/**
 * Resume & Job Application Tools — Lane 1 Career
 *
 * Tools for building a resume section-by-section, retrieving the
 * full resume, and tracking job applications.
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getSessionUserId } from '../context';

// ---------------------------------------------------------------------------
// saveResumeSection
// ---------------------------------------------------------------------------
export const saveResumeSection = tool({
  name: 'save_resume_section',
  description:
    'Save or update a section of the user\'s resume. Sections are stored as sub-documents under the user\'s resume document.',
  parameters: z.object({
    section: z
      .enum(['summary', 'experience', 'education', 'skills', 'certifications'])
      .describe('Which resume section to save.'),
    content: z
      .string()
      .describe('The content for this resume section (plain text or markdown).'),
  }),
  execute: async (input, context?) => {
    const userId = getSessionUserId(context);
    if (!userId) {
      return { success: false, error: 'User not authenticated.' };
    }

    const db = getFirestore();
    const resumeRef = db.collection('users').doc(userId).collection('resume').doc(input.section);

    await resumeRef.set(
      {
        section: input.section,
        content: input.content,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return {
      success: true,
      message: `Resume section "${input.section}" saved successfully.`,
    };
  },
});

// ---------------------------------------------------------------------------
// getResume
// ---------------------------------------------------------------------------
export const getResume = tool({
  name: 'get_resume',
  description:
    'Retrieve all resume sections for the current user.',
  parameters: z.object({}),
  execute: async (_input, context?) => {
    const userId = getSessionUserId(context);
    if (!userId) {
      return { success: false, error: 'User not authenticated.' };
    }

    const db = getFirestore();
    const snapshot = await db
      .collection('users')
      .doc(userId)
      .collection('resume')
      .get();

    if (snapshot.empty) {
      return {
        success: true,
        message: 'No resume sections found yet. Start by saving a section.',
        sections: {},
      };
    }

    const sections: Record<string, unknown> = {};
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      sections[doc.id] = {
        content: data.content,
        updatedAt: data.updatedAt,
      };
    });

    return {
      success: true,
      sections,
    };
  },
});

// ---------------------------------------------------------------------------
// createJobApplication
// ---------------------------------------------------------------------------
export const createJobApplication = tool({
  name: 'create_job_application',
  description:
    'Create a record for a job application the user has submitted or plans to submit.',
  parameters: z.object({
    company: z.string().describe('Name of the company.'),
    position: z.string().describe('Job title or position applied for.'),
    status: z
      .enum(['interested', 'applied', 'interviewing', 'offered', 'rejected', 'accepted'])
      .describe('Current status of the application.'),
    notes: z.string().optional().describe('Any additional notes about the application.'),
  }),
  execute: async (input, context?) => {
    const userId = getSessionUserId(context);
    if (!userId) {
      return { success: false, error: 'User not authenticated.' };
    }

    const db = getFirestore();
    const appData: Record<string, unknown> = {
      userId,
      company: input.company,
      position: input.position,
      status: input.status,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (input.notes) {
      appData.notes = input.notes;
    }

    const docRef = await db.collection('job_applications').add(appData);

    return {
      success: true,
      applicationId: docRef.id,
      message: `Job application for "${input.position}" at ${input.company} recorded.`,
    };
  },
});
