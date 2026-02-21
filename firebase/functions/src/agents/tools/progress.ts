/**
 * Progress Tools — Lane 2 Course Progress
 *
 * Tools for tracking progress through the 12-step program,
 * including overall completion and per-step module tracking.
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getSessionUserId } from '../context';

// ---------------------------------------------------------------------------
// getCourseProgress
// ---------------------------------------------------------------------------
export const getCourseProgress = tool({
  name: 'get_course_progress',
  description:
    'Get the user\'s overall progress across all 12 steps — steps completed, current step, and completion percentage.',
  parameters: z.object({}),
  execute: async (_input, context?) => {
    const userId = getSessionUserId(context);
    if (!userId) {
      return { success: false, error: 'User not authenticated.' };
    }

    const db = getFirestore();

    // Get the user's progress documents for each step
    const progressSnapshot = await db
      .collection('user_progress')
      .where('userId', '==', userId)
      .where('type', '==', 'step')
      .orderBy('stepNumber', 'asc')
      .get();

    const stepProgress: Array<{
      stepNumber: number;
      completed: boolean;
      modulesCompleted: number;
      totalModules: number;
      completedAt?: string;
    }> = [];

    let totalCompleted = 0;
    let currentStep = 1;

    progressSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const completed = data.completed === true;
      if (completed) {
        totalCompleted++;
      }

      stepProgress.push({
        stepNumber: data.stepNumber,
        completed,
        modulesCompleted: data.modulesCompleted || 0,
        totalModules: data.totalModules || 0,
        completedAt: data.completedAt
          ? (data.completedAt.toDate?.() || new Date(data.completedAt)).toISOString()
          : undefined,
      });
    });

    // Determine current step: first incomplete step, or 12 if all done
    const firstIncomplete = stepProgress.find((s) => !s.completed);
    currentStep = firstIncomplete ? firstIncomplete.stepNumber : 12;

    const percentComplete = Math.round((totalCompleted / 12) * 100);

    return {
      success: true,
      currentStep,
      stepsCompleted: totalCompleted,
      totalSteps: 12,
      percentComplete,
      stepProgress,
      message:
        totalCompleted === 12
          ? 'Congratulations! All 12 steps have been completed.'
          : `${totalCompleted} of 12 steps completed (${percentComplete}%). Currently on Step ${currentStep}.`,
    };
  },
});

// ---------------------------------------------------------------------------
// updateStepProgress
// ---------------------------------------------------------------------------
export const updateStepProgress = tool({
  name: 'update_step_progress',
  description:
    'Mark a step module as complete. When all modules in a step are done, the step itself is marked complete.',
  parameters: z.object({
    stepNumber: z
      .number()
      .int()
      .min(1)
      .max(12)
      .describe('The step number (1-12).'),
    moduleId: z
      .string()
      .describe('The ID of the module within the step that was completed.'),
    moduleName: z
      .string()
      .optional()
      .describe('Optional human-readable name of the module.'),
  }),
  execute: async (input, context?) => {
    const userId = getSessionUserId(context);
    if (!userId) {
      return { success: false, error: 'User not authenticated.' };
    }

    const db = getFirestore();
    const progressDocId = `${userId}_step_${input.stepNumber}`;
    const progressRef = db.collection('user_progress').doc(progressDocId);

    const progressDoc = await progressRef.get();

    if (!progressDoc.exists) {
      // Create new progress document for this step
      await progressRef.set({
        userId,
        type: 'step',
        stepNumber: input.stepNumber,
        completedModules: [input.moduleId],
        modulesCompleted: 1,
        totalModules: 0, // Will be updated by course config
        completed: false,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        stepNumber: input.stepNumber,
        moduleId: input.moduleId,
        message: `Module "${input.moduleName || input.moduleId}" marked complete for Step ${input.stepNumber}.`,
      };
    }

    // Update existing progress document
    const data = progressDoc.data()!;
    const completedModules: string[] = data.completedModules || [];

    if (completedModules.includes(input.moduleId)) {
      return {
        success: true,
        stepNumber: input.stepNumber,
        moduleId: input.moduleId,
        alreadyCompleted: true,
        message: `Module "${input.moduleName || input.moduleId}" was already marked as complete.`,
      };
    }

    completedModules.push(input.moduleId);
    const modulesCompleted = completedModules.length;
    const totalModules = data.totalModules || 0;

    // Mark step as complete if all modules are done (and we know the total)
    const stepCompleted = totalModules > 0 && modulesCompleted >= totalModules;

    const updateData: Record<string, unknown> = {
      completedModules,
      modulesCompleted,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (stepCompleted) {
      updateData.completed = true;
      updateData.completedAt = FieldValue.serverTimestamp();
    }

    await progressRef.update(updateData);

    // If step completed, update user's currentStep
    if (stepCompleted && input.stepNumber < 12) {
      await db
        .collection('users')
        .doc(userId)
        .update({
          currentStep: input.stepNumber + 1,
          updatedAt: FieldValue.serverTimestamp(),
        });
    }

    return {
      success: true,
      stepNumber: input.stepNumber,
      moduleId: input.moduleId,
      modulesCompleted,
      totalModules,
      stepCompleted,
      message: stepCompleted
        ? `Step ${input.stepNumber} completed! Moving to Step ${input.stepNumber + 1}.`
        : `Module "${input.moduleName || input.moduleId}" marked complete for Step ${input.stepNumber}. ${modulesCompleted}${totalModules > 0 ? `/${totalModules}` : ''} modules done.`,
    };
  },
});
