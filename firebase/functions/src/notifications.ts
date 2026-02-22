import {FieldValue, getFirestore} from "firebase-admin/firestore";
import {onDocumentCreated, onDocumentUpdated} from "firebase-functions/v2/firestore";
import {onCall, CallableRequest} from "firebase-functions/v2/https";
import {logger} from "firebase-functions";
import {
  NOTIFICATIONS_COLLECTION,
  GOALS_COLLECTION,
  USER_PROGRESS_COLLECTION,
  MESSAGES_COLLECTION,
  WELLNESS_CHECKINS_COLLECTION,
  USERS_COLLECTION,
} from "./utilities/constants";
import {getAuthUserIdOrThrow} from "./utilities/getAuthUserIdOrThrow";
import {checkAchievements} from "./achievements";

// ─── Internal Helper ─────────────────────────────────────────────────────────

interface NotificationData {
  [key: string]: string | undefined;
}

/**
 * Creates a notification document in the notifications collection.
 *
 * @param {string} userId - The user to notify.
 * @param {string} title - The notification title.
 * @param {string} body - The notification body text.
 * @param {NotificationData} data - Optional key-value data payload.
 */
export async function sendNotification(
  userId: string,
  title: string,
  body: string,
  data: NotificationData = {}
): Promise<void> {
  const db = getFirestore();
  const notificationRef = db.collection(NOTIFICATIONS_COLLECTION).doc();
  await notificationRef.set({
    id: notificationRef.id,
    userId,
    title,
    body,
    data,
    read: false,
    lane: data.lane ?? null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

// ─── Firestore Triggers ──────────────────────────────────────────────────────

/**
 * When a goal's status changes to 'completed', notify the user and their
 * case manager (if one is assigned).
 */
export const onGoalCompleted = onDocumentUpdated(
  `${GOALS_COLLECTION}/{goalId}`,
  async (event) => {
    if (!event.data) return;

    const before = event.data.before.data();
    const after = event.data.after.data();

    // Only fire when status transitions to 'completed'.
    if (before.status === "completed" || after.status !== "completed") return;

    const userId: string = after.userId;
    const goalTitle: string = after.title ?? "a goal";

    // Notify the user.
    await sendNotification(
      userId,
      "Goal Completed!",
      `Congratulations! You completed your goal: ${goalTitle}`,
      {type: "milestone", lane: "lane1"}
    );

    // Notify the case manager if assigned.
    try {
      const userDoc = await getFirestore()
        .collection(USERS_COLLECTION)
        .doc(userId)
        .get();
      const userData = userDoc.data();
      const caseManagerId = userData?.reentry?.caseManagerId;
      if (caseManagerId) {
        const displayName = userData?.displayName ?? "A participant";
        await sendNotification(
          caseManagerId,
          "Participant Goal Completed",
          `${displayName} completed their goal: ${goalTitle}`,
          {type: "milestone", lane: "lane1", participantId: userId}
        );
      }
    } catch (error) {
      logger.error("onGoalCompleted: failed to notify case manager", error);
    }
  }
);

/**
 * When a user_progress document is created with status 'completed', trigger
 * achievement checks and send a notification.
 */
export const onStepCompleted = onDocumentCreated(
  `${USER_PROGRESS_COLLECTION}/{progressId}`,
  async (event) => {
    if (!event.data) return;

    const progress = event.data.data();
    if (progress.status !== "completed") return;

    const userId: string = progress.userId;
    const courseId: string = progress.courseId ?? "";

    // Notify the user about step completion.
    await sendNotification(
      userId,
      "Module Completed!",
      "Great work! You've completed a learning module.",
      {type: "achievement", lane: "lane2", courseId}
    );

    // Check for new achievements.
    try {
      await checkAchievements(userId);
    } catch (error) {
      logger.error("onStepCompleted: achievement check failed", error);
    }
  }
);

/**
 * When a new message is created, notify each recipient who has not already
 * read it.
 */
export const onNewMessage = onDocumentCreated(
  `${MESSAGES_COLLECTION}/{messageId}`,
  async (event) => {
    if (!event.data) return;

    const message = event.data.data();
    const senderId: string = message.authorId ?? message.senderId;
    const recipientIds: string[] = message.recipientIds ?? [];

    if (recipientIds.length === 0) return;

    // Look up the sender display name.
    let senderName = "Someone";
    try {
      const senderDoc = await getFirestore()
        .collection(USERS_COLLECTION)
        .doc(senderId)
        .get();
      senderName = senderDoc.data()?.displayName ?? "Someone";
    } catch (error) {
      logger.warn("onNewMessage: could not resolve sender name", error);
    }

    const textPreview = (message.text ?? message.content ?? "")
      .substring(0, 80);

    // Notify all recipients except the sender.
    const notifications = recipientIds
      .filter((id: string) => id !== senderId)
      .map((recipientId: string) =>
        sendNotification(
          recipientId,
          `New message from ${senderName}`,
          textPreview || "You have a new message.",
          {type: "message", senderId, messageId: event.params.messageId}
        )
      );

    await Promise.all(notifications);
  }
);

/**
 * When a wellness check-in is created with a moodScore <= 2 or
 * safetyRating <= 2, alert the user's case manager and all admins.
 */
export const onCrisisDetected = onDocumentCreated(
  `${WELLNESS_CHECKINS_COLLECTION}/{checkinId}`,
  async (event) => {
    if (!event.data) return;

    const checkin = event.data.data();
    const moodScore: number = checkin.moodScore ?? 5;
    const safetyRating: number = checkin.safetyRating ?? 5;

    // Only trigger on crisis-level scores.
    if (moodScore > 2 && safetyRating > 2) return;

    const userId: string = checkin.userId;
    const db = getFirestore();

    const crisisType = moodScore <= 2 ? "low mood" : "safety concern";

    // Look up user info.
    let displayName = "A participant";
    let caseManagerId: string | undefined;
    try {
      const userDoc = await db.collection(USERS_COLLECTION).doc(userId).get();
      const userData = userDoc.data();
      displayName = userData?.displayName ?? "A participant";
      caseManagerId = userData?.reentry?.caseManagerId;
    } catch (error) {
      logger.error("onCrisisDetected: failed to fetch user", error);
    }

    const alerts: Promise<void>[] = [];

    // Alert case manager if assigned.
    if (caseManagerId) {
      alerts.push(
        sendNotification(
          caseManagerId,
          "Crisis Alert",
          `${displayName} reported ${crisisType} (mood: ${moodScore}, safety: ${safetyRating}). Immediate follow-up recommended.`,
          {type: "system", lane: "lane1", participantId: userId, priority: "high"}
        )
      );
    }

    // Alert all admins.
    try {
      const adminsSnapshot = await db
        .collection(USERS_COLLECTION)
        .where("role", "in", ["admin", "super_admin"])
        .get();

      adminsSnapshot.forEach((adminDoc) => {
        const adminId = adminDoc.id;
        if (adminId !== caseManagerId) {
          alerts.push(
            sendNotification(
              adminId,
              "Crisis Alert",
              `${displayName} reported ${crisisType} (mood: ${moodScore}, safety: ${safetyRating}). Immediate attention needed.`,
              {type: "system", participantId: userId, priority: "high"}
            )
          );
        }
      });
    } catch (error) {
      logger.error("onCrisisDetected: failed to notify admins", error);
    }

    await Promise.all(alerts);
  }
);

// ─── Callable Functions ──────────────────────────────────────────────────────

/**
 * Marks a single notification as read.
 *
 * @param {string} data.notificationId - The ID of the notification to mark.
 */
export const markNotificationRead = onCall(
  async (request: CallableRequest<{notificationId: string}>) => {
    const userId = getAuthUserIdOrThrow(request);
    const {notificationId} = request.data;

    if (!notificationId || typeof notificationId !== "string") {
      throw new Error("notificationId is required");
    }

    const db = getFirestore();
    const notifRef = db
      .collection(NOTIFICATIONS_COLLECTION)
      .doc(notificationId);
    const notifDoc = await notifRef.get();

    if (!notifDoc.exists) {
      throw new Error("Notification not found");
    }

    // Only the notification owner can mark it as read.
    const notifData = notifDoc.data();
    if (notifData?.userId !== userId) {
      throw new Error("Unauthorized");
    }

    await notifRef.update({
      read: true,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return {success: true};
  }
);

/**
 * Returns the unread notification count for the authenticated user, broken
 * down by lane (lane1, lane2, lane3) plus a total.
 */
export const getUnreadCount = onCall(
  async (request: CallableRequest<void>) => {
    const userId = getAuthUserIdOrThrow(request);
    const db = getFirestore();

    const snapshot = await db
      .collection(NOTIFICATIONS_COLLECTION)
      .where("userId", "==", userId)
      .where("read", "==", false)
      .get();

    const counts: Record<string, number> = {
      total: 0,
      lane1: 0,
      lane2: 0,
      lane3: 0,
    };

    snapshot.forEach((doc) => {
      const data = doc.data();
      counts.total += 1;
      const lane = data.lane as string | null;
      if (lane && lane in counts) {
        counts[lane] += 1;
      }
    });

    return counts;
  }
);
