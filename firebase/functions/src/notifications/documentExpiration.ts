/* v8 ignore start */
import {getFirestore, FieldValue, Timestamp} from "firebase-admin/firestore";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {logger} from "firebase-functions/v2";
import {
  DOCUMENTS_COLLECTION,
  NOTIFICATIONS_COLLECTION,
} from "../utilities/constants";

/**
 * The number of days before expiration at which to start
 * sending notifications to the user.
 */
const EXPIRATION_WARNING_DAYS = 30;

/**
 * Notification intervals (in days before expiration) at which
 * to send follow-up reminders. Each interval is only sent once,
 * tracked by the sentExpirationWarnings array on the document.
 */
const WARNING_INTERVALS_DAYS = [30, 14, 7, 3, 1, 0] as const;

/**
 * Builds an in-app notification document for a document expiration warning.
 *
 * @param {string} userId - The owner of the document.
 * @param {string} documentId - The expiring document's ID.
 * @param {string} documentName - The name/title of the expiring document.
 * @param {number} daysUntilExpiry - Number of days until the document expires.
 * @returns A notification data object suitable for Firestore.
 */
function buildExpirationNotification(
  userId: string,
  documentId: string,
  documentName: string,
  daysUntilExpiry: number
) {
  const isExpired = daysUntilExpiry <= 0;
  const title = isExpired
    ? `Document Expired: ${documentName}`
    : `Document Expiring Soon: ${documentName}`;
  const body = isExpired
    ? `Your document "${documentName}" has expired. Please renew it as soon as possible.`
    : `Your document "${documentName}" expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? "" : "s"}. Please take action to renew it.`;

  return {
    userId,
    type: "document_expiration",
    title,
    body,
    referenceId: documentId,
    referenceType: "document",
    read: false,
    isExpired,
    daysUntilExpiry,
    createdAt: FieldValue.serverTimestamp(),
  };
}

/**
 * Determines which warning interval applies for a given number of days
 * until expiry, returning the closest matching interval that hasn't
 * already been sent.
 *
 * @param {number} daysUntilExpiry - Days remaining before document expires.
 * @param {number[]} sentWarnings - Array of interval values already sent.
 * @returns The interval to send, or null if no new warning is due.
 */
function getApplicableWarningInterval(
  daysUntilExpiry: number,
  sentWarnings: readonly number[]
): number | null {
  for (const interval of WARNING_INTERVALS_DAYS) {
    if (daysUntilExpiry <= interval && !sentWarnings.includes(interval)) {
      return interval;
    }
  }
  return null;
}

/**
 * Scheduled Cloud Function that runs daily at 9:00 AM Arizona time.
 *
 * Queries the documents collection for items expiring within 30 days.
 * Creates in-app notifications for the document owner at defined
 * intervals (30, 14, 7, 3, 1, and 0 days before expiration).
 *
 * Documents that have already expired are flagged with status "expired".
 */
export const documentExpiration = onSchedule(
  {
    schedule: "0 9 * * *",
    timeZone: "America/Phoenix",
    retryCount: 1,
  },
  async () => {
    const db = getFirestore();
    const now = Date.now();
    const warningWindowEnd = now + EXPIRATION_WARNING_DAYS * 24 * 60 * 60 * 1000;

    // Query documents with an expiresAt within the next 30 days,
    // or already expired (expiresAt <= now).
    const snapshot = await db
      .collection(DOCUMENTS_COLLECTION)
      .where("expiresAt", "<=", Timestamp.fromMillis(warningWindowEnd))
      .where("status", "!=", "expired")
      .get();

    if (snapshot.empty) {
      logger.info("No documents approaching expiration found.");
      return;
    }

    const batch = db.batch();
    let notificationCount = 0;
    let expiredCount = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const expiresAt = (data.expiresAt as Timestamp).toMillis();
      const daysUntilExpiry = Math.ceil(
        (expiresAt - now) / (24 * 60 * 60 * 1000)
      );
      const userId: string = data.userId ?? data.ownerId;
      const documentName: string = data.name ?? data.title ?? "Untitled Document";
      const sentWarnings: number[] = data.sentExpirationWarnings ?? [];

      // Flag expired documents.
      if (daysUntilExpiry <= 0 && data.status !== "expired") {
        batch.update(doc.ref, {
          status: "expired",
          updatedAt: FieldValue.serverTimestamp(),
        });
        expiredCount++;
      }

      // Determine if a new warning notification is due.
      const interval = getApplicableWarningInterval(
        daysUntilExpiry,
        sentWarnings
      );

      if (interval === null) {
        continue;
      }

      // Create in-app notification.
      const notifRef = db.collection(NOTIFICATIONS_COLLECTION).doc();
      const notifData = buildExpirationNotification(
        userId,
        doc.id,
        documentName,
        daysUntilExpiry
      );
      batch.set(notifRef, notifData);

      // Track which warning interval was sent.
      const updatedWarnings = [...sentWarnings, interval];
      batch.update(doc.ref, {
        sentExpirationWarnings: updatedWarnings,
        updatedAt: FieldValue.serverTimestamp(),
      });

      notificationCount++;
    }

    if (notificationCount > 0 || expiredCount > 0) {
      await batch.commit();
    }

    logger.info(
      `Document expiration check complete. ` +
      `Sent ${notificationCount} warnings, flagged ${expiredCount} as expired.`
    );
  }
);
