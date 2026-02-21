/**
 * Goals Tools — Lane 1 Goal Management
 *
 * Tools for creating and listing recovery goals across categories
 * like employment, housing, education, health, legal, financial, personal.
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getSessionUserId } from '../context';

// ---------------------------------------------------------------------------
// listGoals
// ---------------------------------------------------------------------------
export const listGoals = tool({
  name: 'list_goals',
  description:
    'List the current user\'s recovery goals. Optionally filter by status: active, completed, or all.',
  parameters: z.object({
    status: z
      .enum(['active', 'completed', 'all'])
      .optional()
      .default('all')
      .describe('Filter goals by status. Defaults to all.'),
  }),
  execute: async (input, context?) => {
    const userId = getSessionUserId(context);
    if (!userId) {
      return { success: false, error: 'User not authenticated.' };
    }

    const db = getFirestore();
    let query: FirebaseFirestore.Query = db
      .collection('goals')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc');

    if (input.status && input.status !== 'all') {
      query = query.where('status', '==', input.status);
    }

    const snapshot = await query.get();
    const goals = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      success: true,
      count: goals.length,
      goals,
    };
  },
});

// ---------------------------------------------------------------------------
// createGoal
// ---------------------------------------------------------------------------
export const createGoal = tool({
  name: 'create_goal',
  description:
    'Create a new recovery goal for the user with a title, category, description, and optional target date.',
  parameters: z.object({
    title: z.string().describe('Short title for the goal.'),
    category: z
      .enum([
        'employment',
        'housing',
        'education',
        'health',
        'legal',
        'financial',
        'personal',
      ])
      .describe('Category the goal falls under.'),
    description: z.string().describe('Detailed description of the goal.'),
    targetDate: z
      .string()
      .optional()
      .describe('Optional target completion date in ISO-8601 format (YYYY-MM-DD).'),
  }),
  execute: async (input, context?) => {
    const userId = getSessionUserId(context);
    if (!userId) {
      return { success: false, error: 'User not authenticated.' };
    }

    const db = getFirestore();
    const goalData: Record<string, unknown> = {
      userId,
      title: input.title,
      category: input.category,
      description: input.description,
      status: 'active',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (input.targetDate) {
      goalData.targetDate = input.targetDate;
    }

    const docRef = await db.collection('goals').add(goalData);

    return {
      success: true,
      goalId: docRef.id,
      message: `Goal "${input.title}" created successfully.`,
    };
  },
});
