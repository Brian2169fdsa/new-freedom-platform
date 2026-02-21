/**
 * Journal Tools — Lane 2 Journaling
 *
 * Tools for creating journal entries, listing recent entries,
 * and retrieving recovery-focused journal prompts.
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getSessionUserId } from '../context';

// ---------------------------------------------------------------------------
// Recovery-focused journal prompts
// ---------------------------------------------------------------------------
const JOURNAL_PROMPTS: string[] = [
  'What are three things you are grateful for today?',
  'Describe a moment this week when you felt genuinely proud of yourself.',
  'What triggers did you encounter today, and how did you handle them?',
  'Write about a relationship that has improved since you began recovery.',
  'What does "one day at a time" mean to you right now?',
  'Describe a healthy coping skill you used recently. How did it feel?',
  'What is one fear you have about the future? How can you address it?',
  'Write a letter of forgiveness — to yourself or someone else.',
  'What progress have you made this month that you want to acknowledge?',
  'Who is one person you can reach out to when you feel vulnerable?',
  'Describe what your ideal day in recovery looks like.',
  'What boundary did you set recently? How did it go?',
  'Write about a time you wanted to give up but didn\'t. What kept you going?',
  'What does your Higher Power (however you define it) mean to your recovery?',
  'List five strengths you bring to your own recovery journey.',
  'What is one thing you would tell your past self about where you are now?',
  'Describe a small victory from today — no matter how small.',
  'What does honesty mean to you in the context of recovery?',
  'How has your relationship with yourself changed since starting recovery?',
  'What step are you working on right now, and what is it teaching you?',
  'Write about a moment of peace you experienced recently.',
  'What role does service to others play in your recovery?',
  'Describe a challenge you are currently facing. What resources do you have to meet it?',
  'What does "serenity" look like in your everyday life?',
  'How do you plan to take care of yourself this week?',
];

// ---------------------------------------------------------------------------
// createJournalEntry
// ---------------------------------------------------------------------------
export const createJournalEntry = tool({
  name: 'create_journal_entry',
  description:
    'Create a new journal entry with content, a mood rating (1-5), and optional title and tags.',
  parameters: z.object({
    content: z.string().describe('The body text of the journal entry.'),
    mood: z
      .number()
      .int()
      .min(1)
      .max(5)
      .describe('Mood rating from 1 (very low) to 5 (excellent).'),
    title: z.string().optional().describe('Optional title for the entry.'),
    tags: z
      .array(z.string())
      .optional()
      .describe('Optional tags to categorize the entry (e.g., ["gratitude","step-4"]).'),
  }),
  execute: async (input, context?) => {
    const userId = getSessionUserId(context);
    if (!userId) {
      return { success: false, error: 'User not authenticated.' };
    }

    const db = getFirestore();
    const entryData: Record<string, unknown> = {
      userId,
      content: input.content,
      mood: input.mood,
      createdAt: FieldValue.serverTimestamp(),
    };

    if (input.title) {
      entryData.title = input.title;
    }
    if (input.tags && input.tags.length > 0) {
      entryData.tags = input.tags;
    }

    const docRef = await db.collection('journal_entries').add(entryData);

    return {
      success: true,
      entryId: docRef.id,
      message: 'Journal entry saved successfully.',
    };
  },
});

// ---------------------------------------------------------------------------
// listJournalEntries
// ---------------------------------------------------------------------------
export const listJournalEntries = tool({
  name: 'list_journal_entries',
  description:
    'List the user\'s most recent journal entries, ordered newest first (default limit 10).',
  parameters: z.object({
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .default(10)
      .describe('Number of entries to return. Defaults to 10.'),
  }),
  execute: async (input, context?) => {
    const userId = getSessionUserId(context);
    if (!userId) {
      return { success: false, error: 'User not authenticated.' };
    }

    const db = getFirestore();
    const snapshot = await db
      .collection('journal_entries')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(input.limit ?? 10)
      .get();

    const entries = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      success: true,
      count: entries.length,
      entries,
    };
  },
});

// ---------------------------------------------------------------------------
// getJournalPrompt
// ---------------------------------------------------------------------------
export const getJournalPrompt = tool({
  name: 'get_journal_prompt',
  description:
    'Returns a recovery-focused journal prompt to inspire the user\'s writing. No Firestore access needed.',
  parameters: z.object({}),
  execute: async (_input, _context?) => {
    const randomIndex = Math.floor(Math.random() * JOURNAL_PROMPTS.length);
    return {
      success: true,
      prompt: JOURNAL_PROMPTS[randomIndex],
    };
  },
});
