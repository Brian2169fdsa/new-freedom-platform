/* v8 ignore start */
import {getFirestore, FieldValue, Timestamp} from "firebase-admin/firestore";
import {getMessaging} from "firebase-admin/messaging";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {logger} from "firebase-functions/v2";
import {
  APPOINTMENTS_COLLECTION,
  NOTIFICATIONS_COLLECTION,
  USERS_COLLECTION,
} from "../utilities/constants";

/**
 * Reminder thresholds in milliseconds.
 * Each threshold defines a window of time before an appointment
 * when a push notification should be sent.
 */
const REMINDER_THRESHOLDS = [
  {label: "24h", ms: 24 * 60 * 60 * 1000, field: "reminder24hSent"},
  {label: "1h", ms: 60 * 60 * 1000, field: "reminder1hSent"},
  {label: "15m", ms: 15 * 60 * 1000, field: "reminder15mSent"},
] as const;

/**
 * The time window (in ms) within which we consider a reminder due.
 * Because the schedule runs every 15 minutes, a 16-minute window
 * ensures we never miss an appointment between runs.
 */
const SCHEDULE_WINDOW_MS = 16 * 60 * 1000;

/**
 * Builds an FCM notification payload for an appointment reminder.
 *
 * @param {string} token - The FCM device token for the recipient.
 * @param {string} title - The appointment title or description.
 * @param {string} label - The reminder interval label (e.g. "24h").
 * @param {string} appointmentId - The appointment document ID.
 * @returns FCM Message object ready to send.
 */
function buildFcmMessage(
  token: string,
  title: string,
  label: string,
  appointmentId: string
) {
  const bodyMap: Record<string, string> = {
    "24h": "Your appointment is tomorrow.",
    "1h": "Your appointment is in 1 hour.",
    "15m": "Your appointment is in 15 minutes.",
  };
  return {
    token,
    notification: {
      title: `Appointment Reminder: ${title}`,
      body: bodyMap[label] ?? `Reminder for your upcoming appointment.`,
    },
    data: {
      type: "appointment_reminder",
      appointmentId,
      reminderLabel: label,
    },
  };
}

/**
 * Creates an in-app notification document for an appointment reminder.
 *
 * @param {string} userId - The user to notify.
 * @param {string} appointmentId - The related appointment ID.
 * @param {string} title - The appointment title.
 * @param {string} label - The reminder interval label.
 * @returns The notification data object.
 */
function buildNotificationDoc(
  userId: string,
  appointmentId: string,
  title: string,
  label: string
) {
  return {
    userId,
    type: "appointment_reminder",
    title: `Appointment Reminder: ${title}`,
    body: label === "24h"
      ? "Your appointment is tomorrow."
      : label === "1h"
        ? "Your appointment is in 1 hour."
        : "Your appointment is in 15 minutes.",
    referenceId: appointmentId,
    referenceType: "appointment",
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  };
}

/**
 * Scheduled Cloud Function that runs every 15 minutes.
 *
 * Queries the appointments collection for upcoming appointments,
 * then sends FCM push notifications at 24-hour, 1-hour, and
 * 15-minute intervals before the appointment time.
 *
 * Each reminder threshold is tracked with a boolean field on the
 * appointment document to prevent duplicate notifications.
 */
export const appointmentReminders = onSchedule(
  {
    schedule: "every 15 minutes",
    timeZone: "America/Phoenix",
    retryCount: 1,
  },
  async () => {
    const db = getFirestore();
    const messaging = getMessaging();
    const now = Date.now();

    // Query appointments within the next 24 hours that are not cancelled.
    const maxLookahead = now + 24 * 60 * 60 * 1000 + SCHEDULE_WINDOW_MS;
    const appointmentsSnapshot = await db
      .collection(APPOINTMENTS_COLLECTION)
      .where("dateTime", ">=", Timestamp.fromMillis(now))
      .where("dateTime", "<=", Timestamp.fromMillis(maxLookahead))
      .where("status", "!=", "cancelled")
      .get();

    if (appointmentsSnapshot.empty) {
      logger.info("No upcoming appointments found for reminders.");
      return;
    }

    const batch = db.batch();
    let reminderCount = 0;

    for (const doc of appointmentsSnapshot.docs) {
      const appointment = doc.data();
      const appointmentTime = (appointment.dateTime as Timestamp).toMillis();
      const userId: string = appointment.userId;
      const title: string = appointment.title ?? "Upcoming Appointment";

      for (const threshold of REMINDER_THRESHOLDS) {
        // Skip if already sent.
        if (appointment[threshold.field] === true) {
          continue;
        }

        const reminderTime = appointmentTime - threshold.ms;
        const isDue =
          reminderTime >= now - SCHEDULE_WINDOW_MS && reminderTime <= now;

        if (!isDue) {
          continue;
        }

        // Look up user FCM token.
        const userDoc = await db
          .collection(USERS_COLLECTION)
          .doc(userId)
          .get();

        if (!userDoc.exists) {
          logger.warn(`User ${userId} not found for appointment ${doc.id}.`);
          continue;
        }

        const userData = userDoc.data();
        const fcmToken: string | undefined = userData?.fcmToken;

        // Send push notification if token is available.
        if (fcmToken) {
          try {
            const message = buildFcmMessage(
              fcmToken,
              title,
              threshold.label,
              doc.id
            );
            await messaging.send(message);
            logger.info(
              `Sent ${threshold.label} reminder for appointment ${doc.id} to user ${userId}.`
            );
          } catch (err) {
            logger.error(
              `Failed to send FCM for appointment ${doc.id}:`,
              err
            );
          }
        }

        // Always create in-app notification regardless of FCM status.
        const notifRef = db.collection(NOTIFICATIONS_COLLECTION).doc();
        const notifData = buildNotificationDoc(
          userId,
          doc.id,
          title,
          threshold.label
        );
        batch.set(notifRef, notifData);

        // Mark reminder as sent on the appointment document.
        batch.update(doc.ref, {
          [threshold.field]: true,
          updatedAt: FieldValue.serverTimestamp(),
        });

        reminderCount++;
      }
    }

    if (reminderCount > 0) {
      await batch.commit();
    }

    logger.info(
      `Appointment reminders complete. Sent ${reminderCount} reminders.`
    );
  }
);
