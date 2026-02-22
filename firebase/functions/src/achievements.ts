import {FieldValue, getFirestore} from "firebase-admin/firestore";
import {logger} from "firebase-functions";
import {
  ACHIEVEMENTS_COLLECTION,
  WELLNESS_CHECKINS_COLLECTION,
  JOURNAL_ENTRIES_COLLECTION,
  USER_PROGRESS_COLLECTION,
  POSTS_COLLECTION,
  USERS_COLLECTION,
  COURSES_COLLECTION,
} from "./utilities/constants";

// ─── Achievement Definitions ─────────────────────────────────────────────────

interface AchievementDef {
  readonly key: string;
  readonly title: string;
  readonly description: string;
  readonly type: string;
  readonly icon: string;
  readonly rank: "bronze" | "silver" | "gold" | "platinum";
}

const ACHIEVEMENT_DEFS: readonly AchievementDef[] = [
  // Check-in streaks
  {key: "first_checkin", title: "First Check-In", description: "Completed your first wellness check-in", type: "streak", icon: "heart", rank: "bronze"},
  {key: "streak_7", title: "7-Day Streak", description: "Checked in 7 days in a row", type: "streak", icon: "fire", rank: "bronze"},
  {key: "streak_30", title: "30-Day Streak", description: "Checked in 30 days in a row", type: "streak", icon: "fire", rank: "silver"},
  {key: "streak_90", title: "90-Day Streak", description: "Checked in 90 days in a row", type: "streak", icon: "fire", rank: "gold"},

  // Journal entries
  {key: "first_journal", title: "First Reflection", description: "Wrote your first journal entry", type: "community", icon: "book", rank: "bronze"},
  {key: "journal_10", title: "Thoughtful Writer", description: "Wrote 10 journal entries", type: "community", icon: "book", rank: "silver"},
  {key: "journal_50", title: "Deep Reflector", description: "Wrote 50 journal entries", type: "community", icon: "book", rank: "gold"},

  // Step completions
  {key: "step_1_complete", title: "Step 1 Complete", description: "Completed Step 1 of the program", type: "step_completion", icon: "star", rank: "bronze"},
  {key: "step_6_complete", title: "Halfway There", description: "Completed Step 6 of the program", type: "step_completion", icon: "star", rank: "silver"},
  {key: "all_12_steps", title: "All 12 Steps", description: "Completed all 12 steps of the program", type: "step_completion", icon: "trophy", rank: "platinum"},

  // Community
  {key: "first_post", title: "First Post", description: "Shared your first post with the community", type: "community", icon: "chat", rank: "bronze"},
  {key: "first_story", title: "Storyteller", description: "Shared your first story", type: "community", icon: "story", rank: "silver"},

  // Sobriety milestones
  {key: "sober_30", title: "30 Days Sober", description: "30 days of sobriety — incredible!", type: "sobriety_milestone", icon: "medal", rank: "bronze"},
  {key: "sober_90", title: "90 Days Sober", description: "90 days of sobriety — remarkable!", type: "sobriety_milestone", icon: "medal", rank: "silver"},
  {key: "sober_365", title: "1 Year Sober", description: "One full year of sobriety — legendary!", type: "sobriety_milestone", icon: "medal", rank: "platinum"},
] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Retrieves the set of achievement keys already earned by a user.
 */
async function getExistingAchievementKeys(
  userId: string
): Promise<Set<string>> {
  const db = getFirestore();
  const snapshot = await db
    .collection(ACHIEVEMENTS_COLLECTION)
    .where("userId", "==", userId)
    .get();

  const keys = new Set<string>();
  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data.key) {
      keys.add(data.key as string);
    }
  });
  return keys;
}

/**
 * Awards an achievement to a user if not already earned.
 */
async function awardAchievement(
  userId: string,
  def: AchievementDef,
  existingKeys: Set<string>
): Promise<boolean> {
  if (existingKeys.has(def.key)) return false;

  const db = getFirestore();
  const ref = db.collection(ACHIEVEMENTS_COLLECTION).doc();
  await ref.set({
    id: ref.id,
    key: def.key,
    userId,
    type: def.type,
    title: def.title,
    description: def.description,
    icon: def.icon,
    rank: def.rank,
    shared: false,
    earnedAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return true;
}

function getAchievementDef(key: string): AchievementDef | undefined {
  return ACHIEVEMENT_DEFS.find((d) => d.key === key);
}

/**
 * Calculates the current consecutive check-in streak for a user.
 * Returns the number of consecutive days with at least one check-in,
 * counting backwards from the most recent check-in date.
 */
async function getCheckinStreak(userId: string): Promise<number> {
  const db = getFirestore();
  const snapshot = await db
    .collection(WELLNESS_CHECKINS_COLLECTION)
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .limit(100)
    .get();

  if (snapshot.empty) return 0;

  // Collect unique dates (YYYY-MM-DD) in descending order.
  const dates = new Set<string>();
  snapshot.forEach((doc) => {
    const data = doc.data();
    const ts = data.createdAt?.toDate?.();
    if (ts) {
      dates.add(ts.toISOString().split("T")[0]);
    }
  });

  const sortedDates = Array.from(dates).sort().reverse();
  if (sortedDates.length === 0) return 0;

  let streak = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const current = new Date(sortedDates[i - 1]);
    const previous = new Date(sortedDates[i]);
    const diffMs = current.getTime() - previous.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Returns the set of step numbers the user has completed at least one
 * course/module for.
 */
async function getCompletedStepNumbers(userId: string): Promise<Set<number>> {
  const db = getFirestore();

  // Get all completed progress records.
  const progressSnapshot = await db
    .collection(USER_PROGRESS_COLLECTION)
    .where("userId", "==", userId)
    .where("status", "==", "completed")
    .get();

  // Collect unique courseIds.
  const courseIds = new Set<string>();
  progressSnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.courseId) {
      courseIds.add(data.courseId as string);
    }
  });

  // Look up step numbers from courses.
  const stepNumbers = new Set<number>();
  const courseIdArray = Array.from(courseIds);

  // Firestore 'in' queries are limited to 30 items; batch if needed.
  for (let i = 0; i < courseIdArray.length; i += 30) {
    const batch = courseIdArray.slice(i, i + 30);
    const coursesSnapshot = await db
      .collection(COURSES_COLLECTION)
      .where("__name__", "in", batch)
      .get();

    coursesSnapshot.forEach((doc) => {
      const courseData = doc.data();
      if (typeof courseData.stepNumber === "number") {
        stepNumbers.add(courseData.stepNumber);
      }
    });
  }

  return stepNumbers;
}

// ─── Main Achievement Checker ────────────────────────────────────────────────

/**
 * Evaluates all milestone conditions for a user and awards any newly
 * earned achievements. Prevents duplicate awards.
 *
 * @param {string} userId - The user to check achievements for.
 */
export async function checkAchievements(userId: string): Promise<void> {
  const db = getFirestore();
  const existingKeys = await getExistingAchievementKeys(userId);
  const awarded: string[] = [];

  const award = async (key: string): Promise<void> => {
    const def = getAchievementDef(key);
    if (!def) return;
    const wasAwarded = await awardAchievement(userId, def, existingKeys);
    if (wasAwarded) {
      awarded.push(key);
      existingKeys.add(key);
    }
  };

  // ── Check-in streaks ──

  const checkinCount = await db
    .collection(WELLNESS_CHECKINS_COLLECTION)
    .where("userId", "==", userId)
    .count()
    .get();
  const totalCheckins = checkinCount.data().count;

  if (totalCheckins >= 1) await award("first_checkin");

  if (!existingKeys.has("streak_7") ||
      !existingKeys.has("streak_30") ||
      !existingKeys.has("streak_90")) {
    const streak = await getCheckinStreak(userId);
    if (streak >= 7) await award("streak_7");
    if (streak >= 30) await award("streak_30");
    if (streak >= 90) await award("streak_90");
  }

  // ── Journal entries ──

  const journalCount = await db
    .collection(JOURNAL_ENTRIES_COLLECTION)
    .where("userId", "==", userId)
    .count()
    .get();
  const totalJournals = journalCount.data().count;

  if (totalJournals >= 1) await award("first_journal");
  if (totalJournals >= 10) await award("journal_10");
  if (totalJournals >= 50) await award("journal_50");

  // ── Step completions ──

  if (!existingKeys.has("step_1_complete") ||
      !existingKeys.has("step_6_complete") ||
      !existingKeys.has("all_12_steps")) {
    const completedSteps = await getCompletedStepNumbers(userId);
    if (completedSteps.has(1)) await award("step_1_complete");
    if (completedSteps.has(6)) await award("step_6_complete");
    if (completedSteps.size >= 12) await award("all_12_steps");
  }

  // ── Community posts ──

  const postsSnapshot = await db
    .collection(POSTS_COLLECTION)
    .where("authorId", "==", userId)
    .limit(1)
    .get();

  if (!postsSnapshot.empty) {
    await award("first_post");
  }

  // Check for story-type posts.
  if (!existingKeys.has("first_story")) {
    const storySnapshot = await db
      .collection(POSTS_COLLECTION)
      .where("authorId", "==", userId)
      .where("type", "==", "story")
      .limit(1)
      .get();
    if (!storySnapshot.empty) {
      await award("first_story");
    }
  }

  // ── Sobriety milestones ──

  try {
    const userDoc = await db.collection(USERS_COLLECTION).doc(userId).get();
    const userData = userDoc.data();
    const sobrietyDate = userData?.profile?.sobrietyDate?.toDate?.()
      ?? userData?.sobrietyDate?.toDate?.();

    if (sobrietyDate) {
      const now = new Date();
      const diffMs = now.getTime() - sobrietyDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays >= 30) await award("sober_30");
      if (diffDays >= 90) await award("sober_90");
      if (diffDays >= 365) await award("sober_365");
    }
  } catch (error) {
    logger.error("checkAchievements: sobriety check failed", error);
  }

  if (awarded.length > 0) {
    logger.info(
      `checkAchievements: awarded ${awarded.length} achievements to ${userId}`,
      {awarded}
    );
  }
}
