import {getFirestore} from "firebase-admin/firestore";
import {getMessaging} from "firebase-admin/messaging";
import {logger} from "firebase-functions";
import {USERS_COLLECTION} from "./utilities/constants";

// ─── Types ──────────────────────────────────────────────────────────────────

interface PushNotificationData {
  readonly [key: string]: string | undefined;
}

interface SendPushNotificationParams {
  /** The user ID whose registered FCM tokens to send to. */
  readonly userId: string;
  /** The notification title. */
  readonly title: string;
  /** The notification body text. */
  readonly body: string;
  /** Optional data payload (e.g. link, type). */
  readonly data?: PushNotificationData;
}

interface SendPushNotificationResult {
  /** Number of devices the notification was successfully sent to. */
  readonly successCount: number;
  /** Number of devices that failed (invalid/expired tokens cleaned up). */
  readonly failureCount: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const FCM_TOKENS_SUBCOLLECTION = "fcmTokens";

/**
 * FCM error codes that indicate the token is permanently invalid and
 * should be removed from the database.
 *
 * @see https://firebase.google.com/docs/cloud-messaging/manage-tokens
 */
const INVALID_TOKEN_ERROR_CODES = new Set([
  "messaging/invalid-registration-token",
  "messaging/registration-token-not-registered",
  "messaging/invalid-argument",
]);

// ─── Helper ─────────────────────────────────────────────────────────────────

/**
 * Sends an FCM push notification to all registered devices for a given user.
 *
 * This function:
 * 1. Looks up all FCM tokens from `users/{userId}/fcmTokens` subcollection.
 * 2. Sends the notification to each registered device in parallel.
 * 3. Automatically cleans up invalid/expired tokens from Firestore.
 * 4. Logs success and failure counts.
 *
 * This is an internal helper — not exported as a Cloud Function endpoint.
 * Other Cloud Functions should import and call this directly.
 *
 * @param params - The notification parameters.
 * @returns A result object with success and failure counts.
 */
export async function sendPushNotification(
  params: SendPushNotificationParams
): Promise<SendPushNotificationResult> {
  const {userId, title, body, data = {}} = params;

  if (!userId) {
    logger.warn("sendPushNotification: userId is required, skipping.");
    return {successCount: 0, failureCount: 0};
  }

  const db = getFirestore();
  const messaging = getMessaging();

  // Fetch all registered FCM tokens for the user.
  const tokensSnapshot = await db
    .collection(USERS_COLLECTION)
    .doc(userId)
    .collection(FCM_TOKENS_SUBCOLLECTION)
    .get();

  if (tokensSnapshot.empty) {
    logger.info(
      `sendPushNotification: No FCM tokens found for user ${userId}. ` +
      "Skipping push notification."
    );
    return {successCount: 0, failureCount: 0};
  }

  const tokens = tokensSnapshot.docs.map((doc) => ({
    token: doc.id,
    ref: doc.ref,
  }));

  // Build clean data payload (FCM requires all values to be strings).
  const cleanData: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      cleanData[key] = value;
    }
  }

  // Send to all devices in parallel.
  const results = await Promise.allSettled(
    tokens.map(async ({token, ref}) => {
      try {
        await messaging.send({
          token,
          notification: {title, body},
          data: cleanData,
          webpush: {
            fcmOptions: {
              link: cleanData.link ?? undefined,
            },
          },
        });
        return {token, success: true as const};
      } catch (error: unknown) {
        const errorCode = extractErrorCode(error);

        if (INVALID_TOKEN_ERROR_CODES.has(errorCode)) {
          // Token is permanently invalid — remove from Firestore.
          logger.info(
            `sendPushNotification: Removing invalid token for user ${userId}. ` +
            `Error: ${errorCode}`
          );
          try {
            await ref.delete();
          } catch (deleteError) {
            logger.error(
              `sendPushNotification: Failed to delete invalid token for user ${userId}:`,
              deleteError
            );
          }
        } else {
          logger.error(
            `sendPushNotification: Failed to send to token for user ${userId}. ` +
            `Error: ${errorCode}`,
            error
          );
        }

        return {token, success: false as const};
      }
    })
  );

  let successCount = 0;
  let failureCount = 0;

  for (const result of results) {
    if (result.status === "fulfilled" && result.value.success) {
      successCount++;
    } else {
      failureCount++;
    }
  }

  logger.info(
    `sendPushNotification: Sent to user ${userId}. ` +
    `Success: ${successCount}, Failed: ${failureCount}, ` +
    `Total tokens: ${tokens.length}`
  );

  return {successCount, failureCount};
}

// ─── Utilities ──────────────────────────────────────────────────────────────

/**
 * Extracts a Firebase error code from an unknown error object.
 *
 * @param error - The caught error.
 * @returns The error code string, or "unknown" if not extractable.
 */
function extractErrorCode(error: unknown): string {
  if (error !== null && typeof error === "object" && "code" in error) {
    return String((error as {code: unknown}).code);
  }
  return "unknown";
}
