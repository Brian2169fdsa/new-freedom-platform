/**
 * Content Moderation System -- My Struggle (Lane 3)
 *
 * Cloud Functions that provide automated content moderation for the
 * My Struggle social network. Handles posts, comments, and messages.
 *
 * Exports:
 *   - moderateContent   (onCall)  -- Analyse arbitrary text
 *   - autoModeratePost  (trigger) -- Firestore trigger on posts/{postId}
 *   - getModerationQueue(onCall)  -- Admin: list flagged posts
 *   - reviewModeration  (onCall)  -- Admin: approve / reject flagged content
 */

import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';

// ---------------------------------------------------------------------------
// Firestore reference
// Firebase Admin is already initialised in index.ts -- no duplicate init.
// ---------------------------------------------------------------------------

const db = getFirestore();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ModerationCategory =
  | 'profanity'
  | 'hate_speech'
  | 'self_harm'
  | 'drug_glorification'
  | 'spam';

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface ModerationResult {
  readonly flagged: boolean;
  readonly categories: readonly ModerationCategory[];
  readonly severity: Severity;
}

export type ReviewAction = 'approve' | 'reject';

interface ModerationRecord {
  readonly postId: string;
  readonly authorId: string;
  readonly text: string;
  readonly flaggedCategories: readonly ModerationCategory[];
  readonly severity: Severity;
  readonly status: 'pending' | 'approved' | 'rejected';
  readonly createdAt: Timestamp | FieldValue;
  readonly reviewedAt?: Timestamp | FieldValue;
  readonly reviewedBy?: string;
}

// ---------------------------------------------------------------------------
// Keyword lists (configurable per category)
// ---------------------------------------------------------------------------

const KEYWORD_LISTS: Readonly<Record<ModerationCategory, readonly string[]>> = Object.freeze({
  profanity: Object.freeze([
    'damn', 'dammit', 'hell', 'ass', 'asshole', 'bastard', 'bitch',
    'bullshit', 'crap', 'dick', 'fuck', 'fucking', 'motherfucker',
    'piss', 'shit', 'shitty', 'slut', 'whore', 'cock', 'cunt',
    'dumbass', 'jackass', 'goddamn', 'dipshit', 'prick',
  ]),

  hate_speech: Object.freeze([
    'nigger', 'nigga', 'kike', 'spic', 'wetback', 'chink', 'gook',
    'raghead', 'towelhead', 'beaner', 'cracker', 'honky', 'fag',
    'faggot', 'dyke', 'tranny', 'retard', 'retarded', 'cripple',
    'white power', 'heil hitler', 'gas the', 'kill all', 'lynch',
    'ethnic cleansing', 'race war', 'subhuman',
  ]),

  self_harm: Object.freeze([
    'kill myself', 'want to die', 'end my life', 'suicide', 'suicidal',
    'slit my wrists', 'hang myself', 'overdose on', 'jump off a bridge',
    'no reason to live', 'better off dead', 'take my own life',
    'self harm', 'self-harm', 'cutting myself', 'hurt myself',
    'end it all', 'not worth living', 'gonna end it', 'wanna die',
    'tired of living', 'can\'t go on', 'nothing to live for',
    'planning my death', 'goodbye cruel world',
  ]),

  drug_glorification: Object.freeze([
    'get high', 'getting high', 'love being high', 'best high',
    'smoke meth', 'shoot up', 'shooting up', 'snort coke',
    'pop pills', 'popping pills', 'love drugs', 'drugs are great',
    'need a fix', 'need my fix', 'fentanyl is', 'heroin is amazing',
    'meth is awesome', 'love cocaine', 'crack rocks',
    'scoring dope', 'copping dope', 'drug dealer',
    'plug for', 'who got', 'anyone selling',
  ]),

  spam: Object.freeze([
    'buy now', 'click here', 'free money', 'act now', 'limited time',
    'make money fast', 'work from home', 'earn cash', 'get rich quick',
    'nigerian prince', 'wire transfer', 'bitcoin giveaway',
    'discount code', 'promo code', 'follow my link',
    'check out my shop', 'dm for deals', 'onlyfans',
    'subscribe to my', 'free gift', 'congratulations you won',
    'claim your prize', 'send me money',
  ]),
});

// ---------------------------------------------------------------------------
// Category --> Severity mapping
// ---------------------------------------------------------------------------

const CATEGORY_SEVERITY: Readonly<Record<ModerationCategory, Severity>> = Object.freeze({
  spam: 'low',
  profanity: 'medium',
  drug_glorification: 'high',
  hate_speech: 'high',
  self_harm: 'critical',
});

const SEVERITY_RANK: Readonly<Record<Severity, number>> = Object.freeze({
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Normalise text for matching -- lowercase, strip common substitutions.
 */
function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/@/g, 'a')
    .replace(/\$/g, 's')
    .replace(/!/g, 'i')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/0/g, 'o')
    .replace(/\*/g, 'u')
    .replace(/\+/g, 't');
}

/**
 * Check whether `text` contains any keyword from `terms`.
 * Uses case-insensitive, whole-word (or whole-phrase) matching.
 */
function containsAny(normalisedText: string, terms: readonly string[]): boolean {
  return terms.some((term) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // For multi-word phrases use simple includes; for single words use word-boundary
    if (term.includes(' ')) {
      return normalisedText.includes(term.toLowerCase());
    }
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    return regex.test(normalisedText);
  });
}

/**
 * Determine the highest severity from a list of matched categories.
 */
function highestSeverity(categories: readonly ModerationCategory[]): Severity {
  if (categories.length === 0) {
    return 'low';
  }
  return categories.reduce<Severity>((worst, cat) => {
    const catSeverity = CATEGORY_SEVERITY[cat];
    return SEVERITY_RANK[catSeverity] > SEVERITY_RANK[worst] ? catSeverity : worst;
  }, 'low');
}

/**
 * Core analysis function -- shared by the onCall and the trigger.
 */
function analyseText(text: string): ModerationResult {
  const normalisedText = normalise(text);

  const matched: ModerationCategory[] = [];

  for (const [category, terms] of Object.entries(KEYWORD_LISTS) as [ModerationCategory, readonly string[]][]) {
    if (containsAny(normalisedText, terms)) {
      matched.push(category);
    }
  }

  const severity = highestSeverity(matched);

  return Object.freeze({
    flagged: matched.length > 0,
    categories: Object.freeze([...matched]),
    severity,
  });
}

/**
 * Validate that the caller has an admin custom claim.
 */
function assertAdmin(auth: { uid: string; token: Record<string, unknown> } | undefined): asserts auth is { uid: string; token: Record<string, unknown> } {
  if (!auth) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }
  if (auth.token.admin !== true) {
    throw new HttpsError('permission-denied', 'Admin privileges required.');
  }
}

/**
 * Create a crisis alert notification in Firestore when self-harm content
 * is detected. Includes the 988 Suicide & Crisis Lifeline information.
 */
async function createCrisisAlert(params: {
  readonly authorId: string;
  readonly postId: string;
  readonly text: string;
}): Promise<void> {
  const { authorId, postId, text } = params;

  const alertData = {
    type: 'crisis_alert',
    authorId,
    postId,
    textSnippet: text.length > 200 ? `${text.slice(0, 200)}...` : text,
    crisisResources: {
      lifeline: '988',
      lifelineName: '988 Suicide & Crisis Lifeline',
      lifelineUrl: 'https://988lifeline.org',
      crisisTextLine: 'Text HOME to 741741',
      instruction: 'If you or someone you know is in crisis, please call or text 988 for immediate help.',
    },
    status: 'unresolved',
    createdAt: FieldValue.serverTimestamp(),
  };

  await db.collection('crisis_alerts').add(alertData);

  // Also write a notification to the user so the front-end can show
  // crisis resources in real time.
  const notificationData = {
    recipientId: authorId,
    type: 'crisis_resource',
    title: 'We care about you',
    body: 'It sounds like you might be going through a tough time. '
      + 'Please reach out to the 988 Suicide & Crisis Lifeline by calling or texting 988. '
      + 'You are not alone.',
    resources: {
      lifeline: '988',
      lifelineName: '988 Suicide & Crisis Lifeline',
      lifelineUrl: 'https://988lifeline.org',
      crisisTextLine: 'Text HOME to 741741',
    },
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  };

  await db.collection('notifications').add(notificationData);
}

// ---------------------------------------------------------------------------
// Cloud Functions
// ---------------------------------------------------------------------------

/**
 * `moderateContent` -- callable function
 *
 * Accepts arbitrary text and returns a moderation verdict.
 * Any authenticated user may call this (used by the client before / after
 * posting).
 */
export const moderateContent = onCall(
  { region: 'us-central1' },
  async (request) => {
    // Auth check -- any logged-in user may call
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }

    const { text } = request.data as { text?: unknown };

    if (typeof text !== 'string' || text.trim().length === 0) {
      throw new HttpsError(
        'invalid-argument',
        'The "text" field must be a non-empty string.',
      );
    }

    if (text.length > 50_000) {
      throw new HttpsError(
        'invalid-argument',
        'Text exceeds the maximum allowed length of 50,000 characters.',
      );
    }

    const result = analyseText(text);

    return {
      flagged: result.flagged,
      categories: [...result.categories],
      severity: result.severity,
    };
  },
);

/**
 * `autoModeratePost` -- Firestore trigger
 *
 * Fires whenever a new document is created in `posts/{postId}`.
 * Analyses the post body, and if flagged:
 *   1. Writes a record to `moderation_queue`.
 *   2. Updates the post with `moderated: true` and `visible: false`.
 *   3. If severity is critical (self_harm), creates a crisis alert.
 */
export const autoModeratePost = onDocumentCreated(
  { document: 'posts/{postId}', region: 'us-central1' },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      return;
    }

    const postData = snapshot.data();
    const postId = event.params.postId;
    const text: string = postData.body ?? postData.content ?? postData.text ?? '';
    const authorId: string = postData.authorId ?? postData.userId ?? '';

    if (typeof text !== 'string' || text.trim().length === 0) {
      return;
    }

    const result = analyseText(text);

    if (!result.flagged) {
      // Mark the post as clean so the front-end knows moderation ran.
      await snapshot.ref.update({
        moderated: true,
        visible: true,
        moderationResult: {
          flagged: false,
          categories: [],
          severity: 'low',
          moderatedAt: FieldValue.serverTimestamp(),
        },
      });
      return;
    }

    // -- Flagged content -------------------------------------------------------

    const moderationRecord: ModerationRecord = {
      postId,
      authorId,
      text: text.length > 1000 ? `${text.slice(0, 1000)}...` : text,
      flaggedCategories: [...result.categories],
      severity: result.severity,
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
    };

    // Write to moderation queue
    await db.collection('moderation_queue').doc(postId).set(moderationRecord);

    // Hide the post until reviewed
    await snapshot.ref.update({
      moderated: true,
      visible: false,
      moderationResult: {
        flagged: true,
        categories: [...result.categories],
        severity: result.severity,
        moderatedAt: FieldValue.serverTimestamp(),
      },
    });

    // Crisis path
    if (result.categories.includes('self_harm')) {
      await createCrisisAlert({ authorId, postId, text });
    }
  },
);

/**
 * `getModerationQueue` -- callable function (admin only)
 *
 * Returns paginated list of flagged posts awaiting review.
 *
 * Request data:
 *   - limit?:  number  (default 20, max 100)
 *   - offset?: number  (default 0)
 *   - status?: 'pending' | 'approved' | 'rejected' (default 'pending')
 *   - severity?: Severity -- optional filter
 */
export const getModerationQueue = onCall(
  { region: 'us-central1' },
  async (request) => {
    assertAdmin(request.auth);

    const data = (request.data ?? {}) as Record<string, unknown>;

    const limit = Math.min(
      Math.max(Number(data.limit) || 20, 1),
      100,
    );
    const offset = Math.max(Number(data.offset) || 0, 0);
    const status = typeof data.status === 'string' ? data.status : 'pending';
    const severityFilter = typeof data.severity === 'string' ? data.severity : null;

    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      throw new HttpsError(
        'invalid-argument',
        `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      );
    }

    const validSeverities: Severity[] = ['low', 'medium', 'high', 'critical'];
    if (severityFilter !== null && !validSeverities.includes(severityFilter as Severity)) {
      throw new HttpsError(
        'invalid-argument',
        `Invalid severity. Must be one of: ${validSeverities.join(', ')}`,
      );
    }

    let query = db
      .collection('moderation_queue')
      .where('status', '==', status)
      .orderBy('createdAt', 'desc');

    if (severityFilter) {
      query = query.where('severity', '==', severityFilter);
    }

    const countSnapshot = await query.count().get();
    const total = countSnapshot.data().count;

    const snapshot = await query.offset(offset).limit(limit).get();

    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      items,
      total,
      limit,
      offset,
    };
  },
);

/**
 * `reviewModeration` -- callable function (admin only)
 *
 * Approve or reject a flagged post.
 *
 * Request data:
 *   - postId: string
 *   - action: 'approve' | 'reject'
 *   - reason?: string  (optional reviewer note)
 */
export const reviewModeration = onCall(
  { region: 'us-central1' },
  async (request) => {
    assertAdmin(request.auth);

    const data = (request.data ?? {}) as Record<string, unknown>;

    const postId = data.postId;
    const action = data.action;
    const reason = typeof data.reason === 'string' ? data.reason.trim() : '';

    if (typeof postId !== 'string' || postId.trim().length === 0) {
      throw new HttpsError(
        'invalid-argument',
        'The "postId" field must be a non-empty string.',
      );
    }

    const validActions: ReviewAction[] = ['approve', 'reject'];
    if (typeof action !== 'string' || !validActions.includes(action as ReviewAction)) {
      throw new HttpsError(
        'invalid-argument',
        `The "action" field must be one of: ${validActions.join(', ')}`,
      );
    }

    const reviewerUid = request.auth!.uid;
    const queueRef = db.collection('moderation_queue').doc(postId.trim());
    const queueSnap = await queueRef.get();

    if (!queueSnap.exists) {
      throw new HttpsError(
        'not-found',
        `No moderation record found for post "${postId}".`,
      );
    }

    const record = queueSnap.data() as ModerationRecord;

    if (record.status !== 'pending') {
      throw new HttpsError(
        'failed-precondition',
        `This post has already been reviewed (status: ${record.status}).`,
      );
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    // Update the moderation queue record
    await queueRef.update({
      status: newStatus,
      reviewedAt: FieldValue.serverTimestamp(),
      reviewedBy: reviewerUid,
      reviewReason: reason,
    });

    // Update the post visibility
    const postRef = db.collection('posts').doc(postId.trim());
    const postSnap = await postRef.get();

    if (postSnap.exists) {
      if (action === 'approve') {
        await postRef.update({
          visible: true,
          'moderationResult.reviewedAt': FieldValue.serverTimestamp(),
          'moderationResult.reviewedBy': reviewerUid,
          'moderationResult.decision': 'approved',
        });
      } else {
        await postRef.update({
          visible: false,
          'moderationResult.reviewedAt': FieldValue.serverTimestamp(),
          'moderationResult.reviewedBy': reviewerUid,
          'moderationResult.decision': 'rejected',
          'moderationResult.reason': reason,
        });

        // Notify the author their post was rejected
        await db.collection('notifications').add({
          recipientId: record.authorId,
          type: 'moderation_rejection',
          title: 'Post removed',
          body: reason
            ? `Your post was removed for violating community guidelines: ${reason}`
            : 'Your post was removed for violating community guidelines.',
          postId: postId.trim(),
          read: false,
          createdAt: FieldValue.serverTimestamp(),
        });
      }
    }

    return {
      success: true,
      postId: postId.trim(),
      action: newStatus,
    };
  },
);
