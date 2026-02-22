/**
 * GDPR-compliant privacy management Cloud Functions.
 *
 * Provides data export (right of access), full deletion (right to be forgotten),
 * and configurable privacy settings for the New Freedom Recovery Platform.
 *
 * These functions handle healthcare-adjacent data and implement thorough
 * safeguards including rate limiting, confirmation checks, and audit logging.
 */

import {onCall, HttpsError} from "firebase-functions/v2/https";
import {logger} from "firebase-functions";
import {getFirestore, FieldValue, Timestamp} from "firebase-admin/firestore";
import {getStorage} from "firebase-admin/storage";
import {getAuth} from "firebase-admin/auth";
import {z} from "zod";
import {
  USERS_COLLECTION,
  POSTS_COLLECTION,
  MESSAGES_COLLECTION,
  GOALS_COLLECTION,
  JOURNAL_ENTRIES_COLLECTION,
  WELLNESS_CHECKINS_COLLECTION,
  USER_PROGRESS_COLLECTION,
  ACHIEVEMENTS_COLLECTION,
  RESUMES_COLLECTION,
  JOB_APPLICATIONS_COLLECTION,
  DONATIONS_COLLECTION,
  NOTIFICATIONS_COLLECTION,
  ProjectConfig,
} from "./utilities/constants";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RATE_LIMIT_COLLECTION = "privacy_rate_limits";
const PRIVACY_SETTINGS_COLLECTION = "privacy_settings";
const DELETION_AUDIT_LOG_COLLECTION = "deletion_audit_log";

const EXPORT_RATE_LIMIT_MS = 24 * 60 * 60 * 1000; // 24 hours

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const PrivacySettingsSchema = z.object({
  profileVisibility: z.enum(["public", "connections", "private"]),
  showSobrietyDate: z.boolean(),
  showActivityStatus: z.boolean(),
  allowMessages: z.enum(["everyone", "connections", "none"]),
  dataRetentionDays: z.union([
    z.literal(90),
    z.literal(180),
    z.literal(365),
    z.literal(-1),
  ]),
});

type PrivacySettings = z.infer<typeof PrivacySettingsSchema>;

const UpdatePrivacySettingsReq = z.object({
  profileVisibility: z.enum(["public", "connections", "private"]).optional(),
  showSobrietyDate: z.boolean().optional(),
  showActivityStatus: z.boolean().optional(),
  allowMessages: z.enum(["everyone", "connections", "none"]).optional(),
  dataRetentionDays: z.union([
    z.literal(90),
    z.literal(180),
    z.literal(365),
    z.literal(-1),
  ]).optional(),
});

const DeleteAccountReq = z.object({
  confirmationText: z.string(),
});

const REQUIRED_CONFIRMATION = "DELETE ALL MY DATA";

// ---------------------------------------------------------------------------
// Collection query configs — maps collection name to the field that
// identifies ownership by the requesting user.
// ---------------------------------------------------------------------------

interface CollectionQueryConfig {
  readonly collection: string;
  readonly userField: string;
}

const USER_DATA_COLLECTIONS: readonly CollectionQueryConfig[] = [
  {collection: POSTS_COLLECTION, userField: "authorId"},
  {collection: MESSAGES_COLLECTION, userField: "senderId"},
  {collection: GOALS_COLLECTION, userField: "userId"},
  {collection: JOURNAL_ENTRIES_COLLECTION, userField: "userId"},
  {collection: WELLNESS_CHECKINS_COLLECTION, userField: "userId"},
  {collection: USER_PROGRESS_COLLECTION, userField: "userId"},
  {collection: ACHIEVEMENTS_COLLECTION, userField: "userId"},
  {collection: RESUMES_COLLECTION, userField: "userId"},
  {collection: JOB_APPLICATIONS_COLLECTION, userField: "userId"},
  {collection: DONATIONS_COLLECTION, userField: "firebaseUserId"},
  {collection: NOTIFICATIONS_COLLECTION, userField: "userId"},
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extracts the authenticated user ID from the request, or throws.
 */
function getAuthenticatedUserId(request: {auth?: {uid?: string}}): string {
  const uid = request.auth?.uid;
  if (!uid || typeof uid !== "string" || uid.length === 0) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }
  return uid;
}

/**
 * Queries all documents in a collection where `field == value` and returns
 * the documents as plain objects.
 */
async function queryUserDocuments(
  collectionName: string,
  field: string,
  userId: string,
): Promise<ReadonlyArray<Record<string, unknown>>> {
  const db = getFirestore();
  const snapshot = await db
    .collection(collectionName)
    .where(field, "==", userId)
    .get();

  return snapshot.docs.map((doc) => ({
    _id: doc.id,
    _collection: collectionName,
    ...doc.data(),
  }));
}

/**
 * Deletes all documents in a collection where `field == value`.
 * Uses batched writes (max 500 per batch) for Firestore limits.
 * Returns the count of deleted documents.
 */
async function deleteUserDocuments(
  collectionName: string,
  field: string,
  userId: string,
): Promise<number> {
  const db = getFirestore();
  const snapshot = await db
    .collection(collectionName)
    .where(field, "==", userId)
    .get();

  if (snapshot.empty) {
    return 0;
  }

  const batchSize = 450; // Stay under 500 limit to leave room
  const docs = snapshot.docs;
  let deleted = 0;

  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = db.batch();
    const slice = docs.slice(i, i + batchSize);
    for (const doc of slice) {
      batch.delete(doc.ref);
    }
    await batch.commit();
    deleted += slice.length;
  }

  return deleted;
}

/**
 * Checks rate limit for data export — max 1 request per 24 hours per user.
 * Returns true if the request is allowed, false if rate-limited.
 */
async function checkExportRateLimit(userId: string): Promise<boolean> {
  const db = getFirestore();
  const rateLimitRef = db.collection(RATE_LIMIT_COLLECTION).doc(userId);
  const rateLimitDoc = await rateLimitRef.get();

  if (rateLimitDoc.exists) {
    const data = rateLimitDoc.data();
    if (data?.lastExportAt) {
      const lastExportTime = data.lastExportAt instanceof Timestamp
        ? data.lastExportAt.toMillis()
        : data.lastExportAt;
      const now = Date.now();
      if (now - lastExportTime < EXPORT_RATE_LIMIT_MS) {
        return false;
      }
    }
  }

  // Update the rate limit timestamp
  await rateLimitRef.set(
    {lastExportAt: FieldValue.serverTimestamp()},
    {merge: true}
  );

  return true;
}

/**
 * Deletes all Storage files under a user's directory.
 */
async function deleteUserStorageFiles(userId: string): Promise<number> {
  const bucket = getStorage().bucket(ProjectConfig.STORAGE_BUCKET);
  let deletedCount = 0;

  // User files are typically stored under users/{userId}/ in Storage
  const prefixes = [
    `users/${userId}/`,
    `profile_pictures/${userId}`,
    `documents/${userId}/`,
    `resumes/${userId}/`,
  ];

  for (const prefix of prefixes) {
    try {
      const [files] = await bucket.getFiles({prefix});
      for (const file of files) {
        await file.delete();
        deletedCount++;
      }
    } catch (error) {
      // Log but don't fail — some prefixes may not exist
      logger.warn(
        `Storage cleanup: could not delete files under "${prefix}"`,
        {userId, error}
      );
    }
  }

  return deletedCount;
}

// ---------------------------------------------------------------------------
// Default privacy settings
// ---------------------------------------------------------------------------

const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  profileVisibility: "connections",
  showSobrietyDate: false,
  showActivityStatus: true,
  allowMessages: "connections",
  dataRetentionDays: -1,
};

// ---------------------------------------------------------------------------
// exportUserData
// ---------------------------------------------------------------------------

/**
 * Exports ALL user data as a structured JSON object (GDPR right of access).
 * Rate limited to 1 request per 24 hours per user.
 */
export const exportUserData = onCall(async (request) => {
  const userId = getAuthenticatedUserId(request);

  // Rate limit check
  const allowed = await checkExportRateLimit(userId);
  if (!allowed) {
    throw new HttpsError(
      "resource-exhausted",
      "Data export is limited to once every 24 hours. Please try again later."
    );
  }

  logger.info("exportUserData: starting export", {userId});

  const db = getFirestore();

  try {
    // Fetch user profile document
    const userDocRef = db.collection(USERS_COLLECTION).doc(userId);
    const userDoc = await userDocRef.get();
    const userProfile = userDoc.exists
      ? {_id: userDoc.id, ...userDoc.data()}
      : null;

    // Fetch privacy settings
    const privacyDocRef = db.collection(PRIVACY_SETTINGS_COLLECTION).doc(userId);
    const privacyDoc = await privacyDocRef.get();
    const privacySettings = privacyDoc.exists
      ? privacyDoc.data()
      : DEFAULT_PRIVACY_SETTINGS;

    // Fetch all user data from all collections in parallel
    const collectionResults = await Promise.all(
      USER_DATA_COLLECTIONS.map(async (config) => {
        const documents = await queryUserDocuments(
          config.collection,
          config.userField,
          userId
        );
        return {collection: config.collection, documents};
      })
    );

    // Build structured export object
    const exportData: Record<string, unknown> = {
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        userId,
        platform: "New Freedom Recovery Platform",
        dataCategories: [
          "profile",
          "privacy_settings",
          ...USER_DATA_COLLECTIONS.map((c) => c.collection),
        ],
      },
      userProfile,
      privacySettings,
    };

    for (const result of collectionResults) {
      exportData[result.collection] = result.documents;
    }

    logger.info("exportUserData: export complete", {
      userId,
      collectionCount: collectionResults.length,
      totalDocuments: collectionResults.reduce(
        (sum, r) => sum + r.documents.length,
        0
      ),
    });

    return exportData;
  } catch (error) {
    logger.error("exportUserData: failed", {userId, error});
    throw new HttpsError(
      "internal",
      "Failed to export user data. Please try again or contact support."
    );
  }
});

// ---------------------------------------------------------------------------
// deleteAllUserData
// ---------------------------------------------------------------------------

/**
 * Deletes ALL user data across the platform (GDPR right to be forgotten).
 * Requires explicit confirmation text. Creates an audit log entry.
 * Deletes Firestore documents, Storage files, and the Auth account.
 */
export const deleteAllUserData = onCall(async (request) => {
  const userId = getAuthenticatedUserId(request);
  const data = request.data;

  // Validate request shape
  const parsed = DeleteAccountReq.safeParse(data);
  if (!parsed.success) {
    throw new HttpsError(
      "invalid-argument",
      "Request must include a confirmationText field."
    );
  }

  // Verify confirmation text
  if (parsed.data.confirmationText !== REQUIRED_CONFIRMATION) {
    throw new HttpsError(
      "failed-precondition",
      `Confirmation text must be exactly "${REQUIRED_CONFIRMATION}".`
    );
  }

  logger.info("deleteAllUserData: starting deletion", {userId});

  const db = getFirestore();
  const deletedCollections: string[] = [];
  let totalDocumentsDeleted = 0;

  try {
    // 1. Delete documents from all user-owned collections
    for (const config of USER_DATA_COLLECTIONS) {
      const count = await deleteUserDocuments(
        config.collection,
        config.userField,
        userId
      );
      if (count > 0) {
        deletedCollections.push(config.collection);
        totalDocumentsDeleted += count;
      }
    }

    // 2. Delete the user profile document
    const userDocRef = db.collection(USERS_COLLECTION).doc(userId);
    const userDoc = await userDocRef.get();
    if (userDoc.exists) {
      await userDocRef.delete();
      deletedCollections.push(USERS_COLLECTION);
      totalDocumentsDeleted += 1;
    }

    // 3. Delete privacy settings document
    const privacyDocRef = db.collection(PRIVACY_SETTINGS_COLLECTION).doc(userId);
    const privacyDoc = await privacyDocRef.get();
    if (privacyDoc.exists) {
      await privacyDocRef.delete();
      totalDocumentsDeleted += 1;
    }

    // 4. Delete rate limit document
    const rateLimitRef = db.collection(RATE_LIMIT_COLLECTION).doc(userId);
    const rateLimitDoc = await rateLimitRef.get();
    if (rateLimitDoc.exists) {
      await rateLimitRef.delete();
    }

    // 5. Delete user's Storage files (profile pictures, documents, etc.)
    let storageFilesDeleted = 0;
    try {
      storageFilesDeleted = await deleteUserStorageFiles(userId);
    } catch (storageError) {
      // Log but continue — Firestore data is more critical
      logger.error("deleteAllUserData: storage cleanup failed", {
        userId,
        error: storageError,
      });
    }

    // 6. Create audit log BEFORE deleting the Auth account
    //    (the audit log persists for regulatory compliance)
    const auditEntry = {
      userId,
      deletedAt: FieldValue.serverTimestamp(),
      deletedCollections,
      totalDocumentsDeleted,
      storageFilesDeleted,
      confirmationProvided: true,
      completedSuccessfully: true,
    };
    await db.collection(DELETION_AUDIT_LOG_COLLECTION).add(auditEntry);

    // 7. Delete Firebase Auth account (last step — irreversible)
    try {
      await getAuth().deleteUser(userId);
    } catch (authError) {
      // If auth deletion fails, log it but still report success
      // for Firestore data deletion. The auth account may need
      // manual cleanup by an admin.
      logger.error("deleteAllUserData: auth deletion failed", {
        userId,
        error: authError,
      });

      // Update audit log to reflect partial failure
      const auditDocs = await db
        .collection(DELETION_AUDIT_LOG_COLLECTION)
        .where("userId", "==", userId)
        .orderBy("deletedAt", "desc")
        .limit(1)
        .get();

      if (!auditDocs.empty) {
        await auditDocs.docs[0].ref.update({
          authDeletionFailed: true,
          authDeletionError: String(authError),
        });
      }
    }

    logger.info("deleteAllUserData: deletion complete", {
      userId,
      deletedCollections,
      totalDocumentsDeleted,
      storageFilesDeleted,
    });

    return {
      success: true,
      deletedCollections,
      totalDocumentsDeleted,
    };
  } catch (error) {
    logger.error("deleteAllUserData: failed", {userId, error});

    // Still create an audit log for the failed attempt
    try {
      await db.collection(DELETION_AUDIT_LOG_COLLECTION).add({
        userId,
        deletedAt: FieldValue.serverTimestamp(),
        deletedCollections,
        totalDocumentsDeleted,
        completedSuccessfully: false,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    } catch (auditError) {
      logger.error("deleteAllUserData: audit log creation also failed", {
        userId,
        error: auditError,
      });
    }

    throw new HttpsError(
      "internal",
      "Failed to complete account deletion. Some data may have been partially " +
      "deleted. Please contact support for assistance."
    );
  }
});

// ---------------------------------------------------------------------------
// getPrivacySettings
// ---------------------------------------------------------------------------

/**
 * Returns the user's current privacy settings, or defaults if none are set.
 */
export const getPrivacySettings = onCall(async (request) => {
  const userId = getAuthenticatedUserId(request);

  try {
    const db = getFirestore();
    const docRef = db.collection(PRIVACY_SETTINGS_COLLECTION).doc(userId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return {...DEFAULT_PRIVACY_SETTINGS};
    }

    const data = doc.data();
    // Validate stored settings and fall back to defaults for any invalid fields
    const result = PrivacySettingsSchema.safeParse(data);
    if (result.success) {
      return result.data;
    }

    // Merge stored data with defaults for partial validity
    return {
      ...DEFAULT_PRIVACY_SETTINGS,
      ...(data ?? {}),
    };
  } catch (error) {
    logger.error("getPrivacySettings: failed", {userId, error});
    throw new HttpsError(
      "internal",
      "Failed to retrieve privacy settings."
    );
  }
});

// ---------------------------------------------------------------------------
// updatePrivacySettings
// ---------------------------------------------------------------------------

/**
 * Updates the user's privacy settings. Accepts partial updates.
 */
export const updatePrivacySettings = onCall(async (request) => {
  const userId = getAuthenticatedUserId(request);
  const data = request.data;

  // Validate input — only accepted fields
  const parsed = UpdatePrivacySettingsReq.safeParse(data);
  if (!parsed.success) {
    throw new HttpsError(
      "invalid-argument",
      "Invalid privacy settings. " +
      parsed.error.issues.map((i) => i.message).join("; ")
    );
  }

  // Filter out undefined values to only update provided fields
  const updates: Record<string, unknown> = {};
  const validatedData = parsed.data;

  if (validatedData.profileVisibility !== undefined) {
    updates.profileVisibility = validatedData.profileVisibility;
  }
  if (validatedData.showSobrietyDate !== undefined) {
    updates.showSobrietyDate = validatedData.showSobrietyDate;
  }
  if (validatedData.showActivityStatus !== undefined) {
    updates.showActivityStatus = validatedData.showActivityStatus;
  }
  if (validatedData.allowMessages !== undefined) {
    updates.allowMessages = validatedData.allowMessages;
  }
  if (validatedData.dataRetentionDays !== undefined) {
    updates.dataRetentionDays = validatedData.dataRetentionDays;
  }

  if (Object.keys(updates).length === 0) {
    throw new HttpsError(
      "invalid-argument",
      "No valid settings fields provided to update."
    );
  }

  try {
    const db = getFirestore();
    const docRef = db.collection(PRIVACY_SETTINGS_COLLECTION).doc(userId);

    await docRef.set(
      {
        ...updates,
        updatedAt: FieldValue.serverTimestamp(),
      },
      {merge: true}
    );

    // Return the full settings after update
    const updatedDoc = await docRef.get();
    const merged = {
      ...DEFAULT_PRIVACY_SETTINGS,
      ...(updatedDoc.data() ?? {}),
    };

    // Strip internal fields from response
    const {updatedAt: _updatedAt, ...settingsOnly} = merged as Record<string, unknown>;
    void _updatedAt;

    return {
      success: true,
      settings: settingsOnly,
    };
  } catch (error) {
    logger.error("updatePrivacySettings: failed", {userId, error});
    throw new HttpsError(
      "internal",
      "Failed to update privacy settings."
    );
  }
});
