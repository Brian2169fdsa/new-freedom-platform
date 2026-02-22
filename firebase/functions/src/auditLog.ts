import {onCall, HttpsError} from "firebase-functions/v2/https";
import {logger} from "firebase-functions";
import {getFirestore, FieldValue, Timestamp} from "firebase-admin/firestore";
import {getAuthUserIdOrThrow} from "./utilities/getAuthUserIdOrThrow";
import {getUserById} from "./models/data/user";
import {isProd} from "./utilities/isProd";
import {AUDIT_LOG_COLLECTION} from "./utilities/constants";

const VALID_SEVERITIES = ["info", "warning", "critical"] as const;
type Severity = typeof VALID_SEVERITIES[number];

const VALID_ACTION_CATEGORIES = [
  "User Management",
  "Moderation",
  "Content",
  "Settings",
  "Access",
  "Data Export",
] as const;
type ActionCategory = typeof VALID_ACTION_CATEGORIES[number];

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 25;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuditActor {
  uid: string;
  email: string;
  displayName: string;
}

interface AuditTarget {
  type: string;
  id: string;
  name?: string;
}

interface AuditEventInput {
  actor: AuditActor;
  action: string;
  target?: AuditTarget;
  severity: Severity;
  details?: Record<string, unknown>;
  ip?: string;
}

interface AuditLogEntry {
  id: string;
  actor: AuditActor;
  action: string;
  category: ActionCategory;
  target?: AuditTarget;
  severity: Severity;
  details?: Record<string, unknown>;
  ip?: string;
  createdAt: Timestamp | FieldValue;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Derives a human-readable action category from the action string.
 * Actions follow the convention "domain.verb" (e.g. "user.suspend").
 */
function deriveCategory(action: string): ActionCategory {
  const domain = action.split(".")[0]?.toLowerCase() ?? "";
  const categoryMap: Record<string, ActionCategory> = {
    user: "User Management",
    moderation: "Moderation",
    moderate: "Moderation",
    content: "Content",
    post: "Content",
    comment: "Content",
    settings: "Settings",
    config: "Settings",
    access: "Access",
    auth: "Access",
    login: "Access",
    export: "Data Export",
    data: "Data Export",
    privacy: "Data Export",
  };
  return categoryMap[domain] ?? "Settings";
}

/**
 * Validates the severity value is one of the allowed options.
 */
function isValidSeverity(value: string): value is Severity {
  return VALID_SEVERITIES.includes(value as Severity);
}

/**
 * Validates the AuditActor object has the required fields.
 */
function validateActor(actor: unknown): actor is AuditActor {
  if (!actor || typeof actor !== "object") return false;
  const a = actor as Record<string, unknown>;
  return (
    typeof a.uid === "string" && a.uid.length > 0 &&
    typeof a.email === "string" && a.email.length > 0 &&
    typeof a.displayName === "string" && a.displayName.length > 0
  );
}

/**
 * Validates the AuditTarget object structure when present.
 */
function validateTarget(target: unknown): target is AuditTarget | undefined {
  if (target === undefined || target === null) return true;
  if (typeof target !== "object") return false;
  const t = target as Record<string, unknown>;
  return (
    typeof t.type === "string" && t.type.length > 0 &&
    typeof t.id === "string" && t.id.length > 0
  );
}

// ---------------------------------------------------------------------------
// logAuditEvent — Internal helper (NOT a Cloud Function)
// ---------------------------------------------------------------------------

/**
 * Writes an audit log entry to the `audit_log` Firestore collection.
 * This is an internal helper meant to be called from other Cloud Functions.
 *
 * @param {AuditEventInput} event - The audit event to log.
 * @returns {Promise<string>} The document ID of the created audit log entry.
 * @throws {Error} If input validation fails or Firestore write fails.
 */
export async function logAuditEvent(event: AuditEventInput): Promise<string> {
  // Validate required fields
  if (!validateActor(event.actor)) {
    throw new Error(
      "logAuditEvent: actor must have uid, email, and displayName"
    );
  }
  if (typeof event.action !== "string" || event.action.length === 0) {
    throw new Error("logAuditEvent: action must be a non-empty string");
  }
  if (!isValidSeverity(event.severity)) {
    throw new Error(
      `logAuditEvent: severity must be one of ${VALID_SEVERITIES.join(", ")}`
    );
  }
  if (!validateTarget(event.target)) {
    throw new Error(
      "logAuditEvent: target must have type and id when provided"
    );
  }

  const db = getFirestore();
  const category = deriveCategory(event.action);

  const entry: AuditLogEntry = {
    id: "", // will be set after doc creation
    actor: {
      uid: event.actor.uid,
      email: event.actor.email,
      displayName: event.actor.displayName,
    },
    action: event.action,
    category,
    severity: event.severity,
    createdAt: FieldValue.serverTimestamp(),
  };

  // Only include optional fields when present
  if (event.target) {
    entry.target = {
      type: event.target.type,
      id: event.target.id,
      ...(event.target.name ? {name: event.target.name} : {}),
    };
  }
  if (event.details && Object.keys(event.details).length > 0) {
    entry.details = event.details;
  }
  if (event.ip) {
    entry.ip = event.ip;
  }

  const docRef = await db.collection(AUDIT_LOG_COLLECTION).add(entry);
  await docRef.update({id: docRef.id});

  return docRef.id;
}

// ---------------------------------------------------------------------------
// getAuditLog — Cloud Function (onCall, admin only)
// ---------------------------------------------------------------------------

interface GetAuditLogRequest {
  pageSize?: number;
  startAfterTimestamp?: string;
  filters?: {
    dateFrom?: string;
    dateTo?: string;
    actionCategory?: string;
    actorSearch?: string;
    severity?: string;
  };
}

interface GetAuditLogResponse {
  entries: AuditLogEntry[];
  hasMore: boolean;
  totalEstimate: number;
}

export const getAuditLog = onCall(
  async (request): Promise<GetAuditLogResponse> => {
    // Auth check
    const authUserId = getAuthUserIdOrThrow(request);
    const user = await getUserById(authUserId);
    if (user.role !== "admin" && user.role !== "super_admin") {
      throw new HttpsError("permission-denied", "Admin access required");
    }

    const data = (request.data ?? {}) as GetAuditLogRequest;
    const pageSize = Math.min(
      Math.max(data.pageSize ?? DEFAULT_PAGE_SIZE, 1),
      MAX_PAGE_SIZE
    );

    const db = getFirestore();
    let query: FirebaseFirestore.Query = db
      .collection(AUDIT_LOG_COLLECTION)
      .orderBy("createdAt", "desc");

    // Apply filters
    const filters = data.filters ?? {};

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      if (!isNaN(fromDate.getTime())) {
        query = query.where(
          "createdAt",
          ">=",
          Timestamp.fromDate(fromDate)
        );
      }
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      if (!isNaN(toDate.getTime())) {
        // Set to end of day
        toDate.setHours(23, 59, 59, 999);
        query = query.where(
          "createdAt",
          "<=",
          Timestamp.fromDate(toDate)
        );
      }
    }

    if (
      filters.actionCategory &&
      filters.actionCategory !== "All" &&
      VALID_ACTION_CATEGORIES.includes(
        filters.actionCategory as ActionCategory
      )
    ) {
      query = query.where("category", "==", filters.actionCategory);
    }

    if (filters.severity && isValidSeverity(filters.severity)) {
      query = query.where("severity", "==", filters.severity);
    }

    // Pagination cursor
    if (data.startAfterTimestamp) {
      const cursorDate = new Date(data.startAfterTimestamp);
      if (!isNaN(cursorDate.getTime())) {
        query = query.startAfter(Timestamp.fromDate(cursorDate));
      }
    }

    // Fetch one extra to determine if there are more results
    const snapshot = await query.limit(pageSize + 1).get();
    const docs = snapshot.docs;
    const hasMore = docs.length > pageSize;
    const entries = docs.slice(0, pageSize).map((doc) => {
      const d = doc.data() as AuditLogEntry;
      return {...d, id: doc.id};
    });

    // Client-side filter for actor search (Firestore doesn't support
    // substring search natively)
    let filteredEntries = entries;
    if (filters.actorSearch && filters.actorSearch.trim().length > 0) {
      const search = filters.actorSearch.toLowerCase().trim();
      filteredEntries = entries.filter((entry) => {
        const nameMatch =
          entry.actor.displayName.toLowerCase().includes(search);
        const emailMatch = entry.actor.email.toLowerCase().includes(search);
        return nameMatch || emailMatch;
      });
    }

    // Estimate total count (run a separate count query)
    let totalEstimate = 0;
    try {
      const countSnapshot = await db
        .collection(AUDIT_LOG_COLLECTION)
        .count()
        .get();
      totalEstimate = countSnapshot.data().count;
    } catch (err) {
      if (isProd()) {
        logger.warn("Failed to get audit log count estimate", err);
      }
      totalEstimate = filteredEntries.length;
    }

    return {
      entries: filteredEntries,
      hasMore,
      totalEstimate,
    };
  }
);

// ---------------------------------------------------------------------------
// exportAuditLog — Cloud Function (onCall, admin only)
// ---------------------------------------------------------------------------

interface ExportAuditLogRequest {
  filters?: {
    dateFrom?: string;
    dateTo?: string;
    actionCategory?: string;
    actorSearch?: string;
    severity?: string;
  };
}

interface ExportAuditLogEntry {
  id: string;
  timestamp: string;
  actorUid: string;
  actorEmail: string;
  actorName: string;
  action: string;
  category: string;
  severity: string;
  targetType?: string;
  targetId?: string;
  targetName?: string;
  details?: string;
  ip?: string;
}

interface ExportAuditLogResponse {
  entries: ExportAuditLogEntry[];
  exportedAt: string;
  totalCount: number;
}

export const exportAuditLog = onCall(
  async (request): Promise<ExportAuditLogResponse> => {
    // Auth check
    const authUserId = getAuthUserIdOrThrow(request);
    const user = await getUserById(authUserId);
    if (user.role !== "admin" && user.role !== "super_admin") {
      throw new HttpsError("permission-denied", "Admin access required");
    }

    const data = (request.data ?? {}) as ExportAuditLogRequest;
    const db = getFirestore();
    let query: FirebaseFirestore.Query = db
      .collection(AUDIT_LOG_COLLECTION)
      .orderBy("createdAt", "desc");

    // Apply same filters as getAuditLog
    const filters = data.filters ?? {};

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      if (!isNaN(fromDate.getTime())) {
        query = query.where(
          "createdAt",
          ">=",
          Timestamp.fromDate(fromDate)
        );
      }
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      if (!isNaN(toDate.getTime())) {
        toDate.setHours(23, 59, 59, 999);
        query = query.where(
          "createdAt",
          "<=",
          Timestamp.fromDate(toDate)
        );
      }
    }

    if (
      filters.actionCategory &&
      filters.actionCategory !== "All" &&
      VALID_ACTION_CATEGORIES.includes(
        filters.actionCategory as ActionCategory
      )
    ) {
      query = query.where("category", "==", filters.actionCategory);
    }

    if (filters.severity && isValidSeverity(filters.severity)) {
      query = query.where("severity", "==", filters.severity);
    }

    // Cap export at 10,000 entries to prevent memory issues
    const MAX_EXPORT = 10000;
    const snapshot = await query.limit(MAX_EXPORT).get();

    let entries: ExportAuditLogEntry[] = snapshot.docs.map((doc) => {
      const d = doc.data() as AuditLogEntry;
      const createdAt = d.createdAt as Timestamp;
      return {
        id: doc.id,
        timestamp: createdAt?.toDate
          ? createdAt.toDate().toISOString()
          : new Date().toISOString(),
        actorUid: d.actor.uid,
        actorEmail: d.actor.email,
        actorName: d.actor.displayName,
        action: d.action,
        category: d.category,
        severity: d.severity,
        ...(d.target ? {
          targetType: d.target.type,
          targetId: d.target.id,
          targetName: d.target.name,
        } : {}),
        ...(d.details ? {
          details: JSON.stringify(d.details),
        } : {}),
        ...(d.ip ? {ip: d.ip} : {}),
      };
    });

    // Client-side actor search filter
    if (filters.actorSearch && filters.actorSearch.trim().length > 0) {
      const search = filters.actorSearch.toLowerCase().trim();
      entries = entries.filter((entry) => {
        const nameMatch = entry.actorName.toLowerCase().includes(search);
        const emailMatch = entry.actorEmail.toLowerCase().includes(search);
        return nameMatch || emailMatch;
      });
    }

    // Log the export event itself
    try {
      await logAuditEvent({
        actor: {
          uid: authUserId,
          email: typeof user.email === "string" ? user.email : "unknown",
          displayName: typeof user.displayName === "string"
            ? user.displayName : "Unknown Admin",
        },
        action: "export.audit_log",
        severity: "info",
        details: {
          filterApplied: filters,
          entryCount: entries.length,
        },
      });
    } catch (err) {
      // Don't fail the export if logging the event fails
      if (isProd()) {
        logger.warn("Failed to log audit export event", err);
      }
    }

    return {
      entries,
      exportedAt: new Date().toISOString(),
      totalCount: entries.length,
    };
  }
);
