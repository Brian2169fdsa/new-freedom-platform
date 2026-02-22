/**
 * Notification Cloud Functions.
 *
 * This module exports all notification-related Cloud Functions:
 *
 * - appointmentReminders: Scheduled (every 15 min) push + in-app
 *   notifications at 24h, 1h, and 15m before appointments.
 *
 * - documentExpiration: Scheduled (daily 9 AM) in-app notifications
 *   for documents expiring within 30 days, with expired doc flagging.
 *
 * - wellnessCrisis: Firestore trigger on wellness check-in writes
 *   that creates urgent notifications when crisis indicators are detected.
 *
 * - moderationTrigger: Firestore trigger on post creation that
 *   auto-flags toxic content and creates moderation queue entries.
 */
export {appointmentReminders} from "./appointmentReminders";
export {documentExpiration} from "./documentExpiration";
export {wellnessCrisis} from "./wellnessCrisis";
export {moderationTrigger} from "./moderationTrigger";
