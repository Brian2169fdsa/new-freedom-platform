/* v8 ignore start */
import {getFirestore, FieldValue, Firestore} from "firebase-admin/firestore";
import {onDocumentCreated} from "firebase-functions/v2/firestore";
import {logger} from "firebase-functions/v2";
import {
  NOTIFICATIONS_COLLECTION,
  USERS_COLLECTION,
  WELLNESS_CHECKINS_COLLECTION,
} from "../utilities/constants";

/**
 * Craving intensity threshold at or above which a crisis
 * notification is created for the user's case manager.
 */
const CRISIS_CRAVING_THRESHOLD = 8;

/**
 * Mood values that indicate a crisis situation requiring
 * immediate case manager attention.
 */
const CRISIS_MOOD_VALUES = ["crisis"] as const;

/**
 * Determines whether a wellness check-in represents a crisis.
 *
 * @param {string | undefined} mood - The reported mood value.
 * @param {number | undefined} cravings - The reported cravings intensity (0-10).
 * @returns True if the check-in indicates a crisis state.
 */
function isCrisisCheckin(
  mood: string | undefined,
  cravings: number | undefined
): boolean {
  if (mood && CRISIS_MOOD_VALUES.includes(mood as typeof CRISIS_MOOD_VALUES[number])) {
    return true;
  }
  if (cravings !== undefined && cravings >= CRISIS_CRAVING_THRESHOLD) {
    return true;
  }
  return false;
}

/**
 * Builds the crisis reason string from the check-in data.
 *
 * @param {string | undefined} mood - The reported mood value.
 * @param {number | undefined} cravings - The reported cravings intensity.
 * @returns A human-readable description of why this is a crisis.
 */
function buildCrisisReason(
  mood: string | undefined,
  cravings: number | undefined
): string {
  const reasons: string[] = [];
  if (mood && CRISIS_MOOD_VALUES.includes(mood as typeof CRISIS_MOOD_VALUES[number])) {
    reasons.push(`mood reported as "${mood}"`);
  }
  if (cravings !== undefined && cravings >= CRISIS_CRAVING_THRESHOLD) {
    reasons.push(`cravings intensity at ${cravings}/10`);
  }
  return reasons.join(" and ");
}

/**
 * Firestore trigger that fires on new wellness check-in documents.
 *
 * When a user submits a wellness check-in with a mood of "crisis"
 * or a cravings intensity of 8 or higher, this function:
 *
 * 1. Creates an urgent in-app notification for the user's case manager.
 * 2. Creates a supportive notification for the user with crisis resources.
 * 3. Attempts to trigger the crisis agent if the user has an active session.
 *
 * This ensures no crisis goes unnoticed by the care team.
 */
export const wellnessCrisis = onDocumentCreated(
  `${WELLNESS_CHECKINS_COLLECTION}/{checkinId}`,
  async (event) => {
    if (!event.data) return;

    const checkinData = event.data.data();
    const checkinId = event.params.checkinId;
    const userId: string = checkinData.userId;
    const mood: string | undefined = checkinData.mood;
    const cravings: number | undefined = checkinData.cravings;

    // Only proceed if this check-in indicates a crisis.
    if (!isCrisisCheckin(mood, cravings)) {
      return;
    }

    const db = getFirestore();
    const reason = buildCrisisReason(mood, cravings);

    logger.warn(
      `Crisis detected for user ${userId} via wellness check-in ${checkinId}: ${reason}`
    );

    // Look up the user to find their case manager.
    const userDoc = await db
      .collection(USERS_COLLECTION)
      .doc(userId)
      .get();

    const userData = userDoc.exists ? userDoc.data() : undefined;
    const caseManagerId: string | undefined = userData?.caseManagerId;
    const userName: string = userData?.displayName || "A participant";

    const batch = db.batch();

    // Create urgent notification for case manager (if assigned).
    if (caseManagerId) {
      const caseManagerNotifRef = db
        .collection(NOTIFICATIONS_COLLECTION)
        .doc();
      batch.set(caseManagerNotifRef, {
        userId: caseManagerId,
        type: "wellness_crisis",
        priority: "urgent",
        title: "Urgent: Crisis Check-In Detected",
        body: `${userName} submitted a wellness check-in indicating a crisis state (${reason}). Immediate attention recommended.`,
        referenceId: checkinId,
        referenceType: "wellness_checkin",
        subjectUserId: userId,
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    } else {
      logger.warn(
        `User ${userId} has no assigned case manager. ` +
        `Creating admin-level crisis notification.`
      );
      // Notify all admins by creating a general crisis notification.
      const adminsSnapshot = await db
        .collection(USERS_COLLECTION)
        .where("role", "==", "admin")
        .limit(10)
        .get();

      for (const adminDoc of adminsSnapshot.docs) {
        const adminNotifRef = db.collection(NOTIFICATIONS_COLLECTION).doc();
        batch.set(adminNotifRef, {
          userId: adminDoc.id,
          type: "wellness_crisis",
          priority: "urgent",
          title: "Urgent: Unassigned Participant Crisis",
          body: `${userName} (no case manager assigned) submitted a crisis check-in (${reason}). Please assign and follow up.`,
          referenceId: checkinId,
          referenceType: "wellness_checkin",
          subjectUserId: userId,
          read: false,
          createdAt: FieldValue.serverTimestamp(),
        });
      }
    }

    // Create supportive notification for the user with crisis resources.
    const userNotifRef = db.collection(NOTIFICATIONS_COLLECTION).doc();
    batch.set(userNotifRef, {
      userId,
      type: "crisis_support",
      priority: "urgent",
      title: "We're Here For You",
      body:
        "It looks like you're going through a tough time. " +
        "If you need immediate help, please call 988 (Suicide & Crisis Lifeline) " +
        "or text HOME to 741741 (Crisis Text Line). " +
        "Your care team has been notified.",
      referenceId: checkinId,
      referenceType: "wellness_checkin",
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Flag the check-in document as crisis-detected.
    batch.update(event.data.ref, {
      crisisDetected: true,
      crisisReason: reason,
      crisisNotifiedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();

    // Attempt to trigger the crisis agent for automated support.
    // This is a best-effort operation -- if the agent infrastructure
    // is unavailable, the notifications above still ensure human follow-up.
    try {
      await triggerCrisisAgent(db, userId, checkinId, reason);
    } catch (err) {
      logger.error(
        `Failed to trigger crisis agent for user ${userId}:`,
        err
      );
    }

    logger.info(
      `Crisis notifications created for check-in ${checkinId}, user ${userId}.`
    );
  }
);

/**
 * Attempts to trigger the crisis agent by creating an agent session
 * document. The agent infrastructure picks up new sessions and routes
 * them to the appropriate agent.
 *
 * @param {Firestore} db - Firestore instance.
 * @param {string} userId - The user in crisis.
 * @param {string} checkinId - The wellness check-in ID that triggered the crisis.
 * @param {string} reason - Human-readable crisis reason.
 */
async function triggerCrisisAgent(
  db: Firestore,
  userId: string,
  checkinId: string,
  reason: string
): Promise<void> {
  const agentSessionsRef = db.collection("agent_sessions");

  // Check if user already has an active crisis session.
  const existingSession = await agentSessionsRef
    .where("userId", "==", userId)
    .where("agentName", "==", "Crisis Agent")
    .where("status", "==", "active")
    .limit(1)
    .get();

  if (!existingSession.empty) {
    logger.info(
      `User ${userId} already has an active crisis agent session. Skipping creation.`
    );
    return;
  }

  // Create a new crisis agent session.
  const sessionRef = agentSessionsRef.doc();
  await sessionRef.set({
    id: sessionRef.id,
    userId,
    agentName: "Crisis Agent",
    status: "active",
    triggerType: "wellness_checkin",
    triggerId: checkinId,
    triggerReason: reason,
    activeLane: "all",
    crisisDetected: true,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  logger.info(
    `Crisis agent session ${sessionRef.id} created for user ${userId}.`
  );
}
