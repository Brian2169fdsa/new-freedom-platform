/* v8 ignore start */
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import {onDocumentCreated} from "firebase-functions/v2/firestore";
import {logger} from "firebase-functions/v2";
import {
  POSTS_COLLECTION,
  MODERATION_QUEUE_COLLECTION,
  MODERATION_REPORTS_COLLECTION,
  NOTIFICATIONS_COLLECTION,
  USERS_COLLECTION,
} from "../utilities/constants";

/**
 * Toxicity score threshold (0-1 scale). Posts scoring above
 * this value are automatically flagged for moderation.
 */
const TOXICITY_THRESHOLD = 0.6;

/**
 * Keywords grouped by severity. Each keyword contributes a
 * weighted score to the total toxicity calculation.
 */
const KEYWORD_WEIGHTS: ReadonlyArray<{
  readonly words: readonly string[];
  readonly weight: number;
}> = [
  {
    words: [
      "kill", "murder", "suicide", "die", "death threat",
      "shoot", "stab", "bomb",
    ],
    weight: 0.5,
  },
  {
    words: [
      "hate", "racist", "sexist", "slur", "nazi",
      "bigot", "derogatory", "harass",
    ],
    weight: 0.35,
  },
  {
    words: [
      "stupid", "idiot", "loser", "worthless", "pathetic",
      "shut up", "dumb", "trash",
    ],
    weight: 0.15,
  },
];

/**
 * Calculates a toxicity score for the given text using a
 * keyword-based approach. This is a basic filter intended to
 * catch obvious violations; a more sophisticated ML-based
 * classifier should replace this in production.
 *
 * @param {string} text - The text content to analyze.
 * @returns A score between 0 and 1, where 1 is most toxic.
 */
function calculateToxicityScore(text: string): number {
  if (!text || text.trim().length === 0) {
    return 0;
  }

  const normalizedText = text.toLowerCase();
  let totalScore = 0;

  for (const group of KEYWORD_WEIGHTS) {
    for (const keyword of group.words) {
      if (normalizedText.includes(keyword)) {
        totalScore += group.weight;
      }
    }
  }

  // Clamp between 0 and 1.
  return Math.min(totalScore, 1);
}

/**
 * Builds a moderation queue entry document.
 *
 * @param {string} postId - The flagged post's ID.
 * @param {string} authorId - The post author's user ID.
 * @param {number} toxicityScore - The calculated toxicity score.
 * @param {string[]} flaggedKeywords - Keywords that triggered the flag.
 * @returns A moderation queue data object.
 */
function buildModerationQueueEntry(
  postId: string,
  authorId: string,
  toxicityScore: number,
  flaggedKeywords: readonly string[]
) {
  return {
    postId,
    authorId,
    toxicityScore,
    flaggedKeywords: [...flaggedKeywords],
    source: "auto_moderation",
    status: "pending",
    assignedTo: "",
    action: "pending",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
}

/**
 * Identifies which specific keywords were found in the text.
 *
 * @param {string} text - The text to scan.
 * @returns An array of matched keywords.
 */
function findFlaggedKeywords(text: string): string[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const normalizedText = text.toLowerCase();
  const found: string[] = [];

  for (const group of KEYWORD_WEIGHTS) {
    for (const keyword of group.words) {
      if (normalizedText.includes(keyword)) {
        found.push(keyword);
      }
    }
  }

  return found;
}

/**
 * Firestore trigger that fires when a new post is created.
 *
 * Analyzes the post content for toxicity using a keyword-based
 * filter. If the toxicity score exceeds the threshold:
 *
 * 1. The post is flagged (archived) pending moderation review.
 * 2. A moderation queue entry is created for moderator review.
 * 3. A moderation report is created (consistent with existing
 *    moderation infrastructure).
 * 4. Admin users are notified of the flagged content.
 */
export const moderationTrigger = onDocumentCreated(
  `${POSTS_COLLECTION}/{postId}`,
  async (event) => {
    if (!event.data) return;

    const postData = event.data.data();
    const postId = event.params.postId;
    const authorId: string = postData.authorId;
    const text: string = postData.text ?? "";
    const title: string = postData.title ?? "";

    // Combine title and text for analysis.
    const fullContent = `${title} ${text}`.trim();

    if (fullContent.length === 0) {
      return;
    }

    const toxicityScore = calculateToxicityScore(fullContent);

    // Skip if below threshold.
    if (toxicityScore <= TOXICITY_THRESHOLD) {
      logger.info(
        `Post ${postId} passed moderation check (score: ${toxicityScore.toFixed(2)}).`
      );
      return;
    }

    const db = getFirestore();
    const flaggedKeywords = findFlaggedKeywords(fullContent);

    logger.warn(
      `Post ${postId} flagged for moderation. ` +
      `Score: ${toxicityScore.toFixed(2)}, ` +
      `Keywords: [${flaggedKeywords.join(", ")}].`
    );

    const batch = db.batch();

    // 1. Flag the post by archiving it pending moderation.
    batch.update(event.data.ref, {
      archived: true,
      moderationStatus: "flagged",
      toxicityScore,
      flaggedKeywords,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 2. Create a moderation queue entry.
    const queueRef = db.collection(MODERATION_QUEUE_COLLECTION).doc();
    const queueEntry = buildModerationQueueEntry(
      postId,
      authorId,
      toxicityScore,
      flaggedKeywords
    );
    batch.set(queueRef, {
      id: queueRef.id,
      ...queueEntry,
    });

    // 3. Create a moderation report (consistent with existing infrastructure).
    const reportRef = db.collection(MODERATION_REPORTS_COLLECTION).doc();
    batch.set(reportRef, {
      id: reportRef.id,
      assignedTo: "",
      availableAt: FieldValue.serverTimestamp(),
      contentId: postId,
      reportType: "auto_toxicity",
      reportedBy: "system",
      source: "post",
      status: "pending",
      ownerId: authorId,
      action: "pending",
      toxicityScore,
      flaggedKeywords,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 4. Notify admin users.
    const adminsSnapshot = await db
      .collection(USERS_COLLECTION)
      .where("role", "==", "admin")
      .limit(10)
      .get();

    const authorDisplayName: string =
      postData.authorDisplayName || "A user";

    for (const adminDoc of adminsSnapshot.docs) {
      const notifRef = db.collection(NOTIFICATIONS_COLLECTION).doc();
      batch.set(notifRef, {
        userId: adminDoc.id,
        type: "moderation_flag",
        priority: "high",
        title: "Post Flagged for Moderation",
        body:
          `A post by ${authorDisplayName} was auto-flagged ` +
          `(toxicity: ${toxicityScore.toFixed(2)}). ` +
          `Keywords: [${flaggedKeywords.join(", ")}]. ` +
          `Please review in the moderation queue.`,
        referenceId: postId,
        referenceType: "post",
        moderationQueueId: queueRef.id,
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();

    logger.info(
      `Post ${postId} flagged and moderation queue entry ${queueRef.id} created.`
    );
  }
);
