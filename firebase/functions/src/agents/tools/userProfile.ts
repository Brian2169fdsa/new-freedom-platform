/**
 * User Profile Tools — Cross-Lane User Data
 *
 * Tools for reading user profile information, sobriety tracking,
 * and 12-step program progress.
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { getFirestore } from 'firebase-admin/firestore';
import { getSessionUserId } from '../context';

// ---------------------------------------------------------------------------
// getUserProfile
// ---------------------------------------------------------------------------
export const getUserProfile = tool({
  name: 'get_user_profile',
  description:
    'Get the current user\'s profile including name, role, active lanes, sobriety date, and current step.',
  parameters: z.object({}),
  execute: async (_input, context?) => {
    const userId = getSessionUserId(context);
    if (!userId) {
      return { success: false, error: 'User not authenticated.' };
    }

    const db = getFirestore();
    const doc = await db.collection('users').doc(userId).get();

    if (!doc.exists) {
      return {
        success: false,
        error: 'User profile not found.',
      };
    }

    const data = doc.data()!;
    return {
      success: true,
      profile: {
        id: doc.id,
        name: data.name || data.displayName || null,
        email: data.email || null,
        role: data.role || 'participant',
        lanes: data.lanes || [],
        sobrietyDate: data.sobrietyDate || null,
        currentStep: data.currentStep || null,
        createdAt: data.createdAt || null,
      },
    };
  },
});

// ---------------------------------------------------------------------------
// getSobrietyDate
// ---------------------------------------------------------------------------
export const getSobrietyDate = tool({
  name: 'get_sobriety_date',
  description:
    'Get the user\'s sobriety date and calculate total days sober.',
  parameters: z.object({}),
  execute: async (_input, context?) => {
    const userId = getSessionUserId(context);
    if (!userId) {
      return { success: false, error: 'User not authenticated.' };
    }

    const db = getFirestore();
    const doc = await db.collection('users').doc(userId).get();

    if (!doc.exists) {
      return { success: false, error: 'User profile not found.' };
    }

    const data = doc.data()!;
    const sobrietyDate = data.sobrietyDate;

    if (!sobrietyDate) {
      return {
        success: true,
        sobrietyDate: null,
        daysSober: null,
        message: 'No sobriety date has been set yet.',
      };
    }

    // sobrietyDate may be a Firestore Timestamp or an ISO string
    let dateObj: Date;
    if (typeof sobrietyDate === 'string') {
      dateObj = new Date(sobrietyDate);
    } else if (sobrietyDate.toDate) {
      dateObj = sobrietyDate.toDate();
    } else {
      dateObj = new Date(sobrietyDate);
    }

    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const daysSober = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return {
      success: true,
      sobrietyDate: dateObj.toISOString().split('T')[0],
      daysSober,
      message: `${daysSober} days sober since ${dateObj.toISOString().split('T')[0]}.`,
    };
  },
});

// ---------------------------------------------------------------------------
// getCurrentStep
// ---------------------------------------------------------------------------
export const getCurrentStep = tool({
  name: 'get_current_step',
  description:
    'Get the user\'s current step number and progress in the 12-step program.',
  parameters: z.object({}),
  execute: async (_input, context?) => {
    const userId = getSessionUserId(context);
    if (!userId) {
      return { success: false, error: 'User not authenticated.' };
    }

    const db = getFirestore();

    // Get current step from user profile
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return { success: false, error: 'User profile not found.' };
    }

    const userData = userDoc.data()!;
    const currentStep = userData.currentStep || 1;

    // Get progress details from user_progress collection
    const progressSnapshot = await db
      .collection('user_progress')
      .where('userId', '==', userId)
      .where('type', '==', 'step')
      .orderBy('stepNumber', 'asc')
      .get();

    const completedSteps = progressSnapshot.docs
      .filter((doc) => doc.data().completed === true)
      .map((doc) => doc.data().stepNumber);

    return {
      success: true,
      currentStep,
      completedSteps,
      totalSteps: 12,
      percentComplete: Math.round((completedSteps.length / 12) * 100),
      message: `Currently on Step ${currentStep}. ${completedSteps.length} of 12 steps completed.`,
    };
  },
});
