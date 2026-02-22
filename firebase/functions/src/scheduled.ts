import {getFirestore} from "firebase-admin/firestore";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {logger} from "firebase-functions";
import {
  USERS_COLLECTION,
  WELLNESS_CHECKINS_COLLECTION,
  GOALS_COLLECTION,
  USER_PROGRESS_COLLECTION,
  JOURNAL_ENTRIES_COLLECTION,
} from "./utilities/constants";
import {sendNotification} from "./notifications";

// ─── Daily Check-In Reminder ─────────────────────────────────────────────────

/**
 * Runs daily at 9:00 AM MST (16:00 UTC). Sends a reminder notification
 * to every active user who has not yet completed a wellness check-in today.
 */
export const dailyCheckInReminder = onSchedule(
  {
    schedule: "0 16 * * *", // 9 AM MST = 16:00 UTC
    timeZone: "America/Phoenix",
    retryCount: 1,
  },
  async () => {
    const db = getFirestore();

    // Calculate the start of today (MST = UTC-7, Arizona does not observe DST).
    const now = new Date();
    const mstOffset = -7 * 60 * 60 * 1000;
    const mstNow = new Date(now.getTime() + mstOffset);
    const todayStart = new Date(
      Date.UTC(
        mstNow.getUTCFullYear(),
        mstNow.getUTCMonth(),
        mstNow.getUTCDate(),
        7, 0, 0, 0 // 00:00 MST = 07:00 UTC
      )
    );

    // Get all users who have checked in today.
    const checkinSnapshot = await db
      .collection(WELLNESS_CHECKINS_COLLECTION)
      .where("createdAt", ">=", todayStart)
      .get();

    const checkedInUserIds = new Set<string>();
    checkinSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.userId) {
        checkedInUserIds.add(data.userId as string);
      }
    });

    // Get all active users (members, not admins/super_admins).
    const usersSnapshot = await db
      .collection(USERS_COLLECTION)
      .where("role", "in", ["member", "mentor"])
      .get();

    const reminders: Promise<void>[] = [];
    let sentCount = 0;

    usersSnapshot.forEach((doc) => {
      const userId = doc.id;
      const userData = doc.data();

      // Skip users who already checked in today.
      if (checkedInUserIds.has(userId)) return;

      // Skip archived/suspended users.
      if (userData.archived === true) return;

      reminders.push(
        sendNotification(
          userId,
          "Daily Check-In Reminder",
          "How are you feeling today? Take a moment to check in and track your wellness.",
          {type: "system", lane: "lane1"}
        )
      );
      sentCount += 1;
    });

    await Promise.all(reminders);
    logger.info(
      `dailyCheckInReminder: sent ${sentCount} reminders, ${checkedInUserIds.size} already checked in`
    );
  }
);

// ─── Weekly Progress Report ──────────────────────────────────────────────────

/**
 * Runs every Monday at 10:00 AM MST (17:00 UTC). Generates a personalized
 * progress summary notification for each active user covering the past 7 days.
 */
export const weeklyProgressReport = onSchedule(
  {
    schedule: "0 17 * * 1", // Monday 10 AM MST = 17:00 UTC
    timeZone: "America/Phoenix",
    retryCount: 1,
  },
  async () => {
    const db = getFirestore();

    // Calculate 7 days ago.
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get all active users.
    const usersSnapshot = await db
      .collection(USERS_COLLECTION)
      .where("role", "in", ["member", "mentor"])
      .get();

    let sentCount = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();

      // Skip archived users.
      if (userData.archived === true) continue;

      try {
        // Count check-ins this week.
        const checkinsCount = await db
          .collection(WELLNESS_CHECKINS_COLLECTION)
          .where("userId", "==", userId)
          .where("createdAt", ">=", sevenDaysAgo)
          .count()
          .get();

        // Count goals completed this week.
        const goalsCount = await db
          .collection(GOALS_COLLECTION)
          .where("userId", "==", userId)
          .where("status", "==", "completed")
          .where("updatedAt", ">=", sevenDaysAgo)
          .count()
          .get();

        // Count modules completed this week.
        const modulesCount = await db
          .collection(USER_PROGRESS_COLLECTION)
          .where("userId", "==", userId)
          .where("status", "==", "completed")
          .where("completedAt", ">=", sevenDaysAgo)
          .count()
          .get();

        // Count journal entries this week.
        const journalsCount = await db
          .collection(JOURNAL_ENTRIES_COLLECTION)
          .where("userId", "==", userId)
          .where("date", ">=", sevenDaysAgo)
          .count()
          .get();

        const checkins = checkinsCount.data().count;
        const goals = goalsCount.data().count;
        const modules = modulesCount.data().count;
        const journals = journalsCount.data().count;

        // Build a summary message.
        const parts: string[] = [];
        if (checkins > 0) parts.push(`${checkins} check-in${checkins > 1 ? "s" : ""}`);
        if (goals > 0) parts.push(`${goals} goal${goals > 1 ? "s" : ""} completed`);
        if (modules > 0) parts.push(`${modules} module${modules > 1 ? "s" : ""} completed`);
        if (journals > 0) parts.push(`${journals} journal entr${journals > 1 ? "ies" : "y"}`);

        let body: string;
        if (parts.length > 0) {
          body = `Your week: ${parts.join(", ")}. Keep up the great work!`;
        } else {
          body = "Start this week strong! Check in, work on a goal, or write in your journal.";
        }

        await sendNotification(
          userId,
          "Your Weekly Progress",
          body,
          {type: "system"}
        );
        sentCount += 1;
      } catch (error) {
        logger.error(
          `weeklyProgressReport: failed for user ${userId}`,
          error
        );
      }
    }

    logger.info(`weeklyProgressReport: sent ${sentCount} reports`);
  }
);
