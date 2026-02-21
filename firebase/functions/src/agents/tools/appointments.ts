/**
 * Appointments Tools — Lane 1 Scheduling
 *
 * Tools for listing upcoming appointments and creating new ones
 * (case manager meetings, court dates, medical visits, etc.).
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getSessionUserId } from '../context';

// ---------------------------------------------------------------------------
// listAppointments
// ---------------------------------------------------------------------------
export const listAppointments = tool({
  name: 'list_appointments',
  description:
    'List the user\'s upcoming appointments, ordered by date ascending.',
  parameters: z.object({
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .default(20)
      .describe('Maximum number of appointments to return. Defaults to 20.'),
  }),
  execute: async (input, context?) => {
    const userId = getSessionUserId(context);
    if (!userId) {
      return { success: false, error: 'User not authenticated.' };
    }

    const db = getFirestore();
    const now = new Date().toISOString();

    const snapshot = await db
      .collection('appointments')
      .where('userId', '==', userId)
      .where('date', '>=', now)
      .orderBy('date', 'asc')
      .limit(input.limit ?? 20)
      .get();

    const appointments = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      success: true,
      count: appointments.length,
      appointments,
    };
  },
});

// ---------------------------------------------------------------------------
// createAppointment
// ---------------------------------------------------------------------------
export const createAppointment = tool({
  name: 'create_appointment',
  description:
    'Create a new appointment for the user.',
  parameters: z.object({
    title: z.string().describe('Title or name of the appointment.'),
    date: z.string().describe('Date of the appointment in ISO-8601 format (YYYY-MM-DD).'),
    time: z.string().describe('Time of the appointment (e.g., "10:00 AM" or "14:30").'),
    location: z.string().describe('Location or address for the appointment.'),
    type: z
      .enum([
        'case_manager',
        'court',
        'medical',
        'employment',
        'housing',
        'other',
      ])
      .describe('Type of appointment.'),
    notes: z.string().optional().describe('Any additional notes about the appointment.'),
  }),
  execute: async (input, context?) => {
    const userId = getSessionUserId(context);
    if (!userId) {
      return { success: false, error: 'User not authenticated.' };
    }

    const db = getFirestore();
    const appointmentData: Record<string, unknown> = {
      userId,
      title: input.title,
      date: input.date,
      time: input.time,
      location: input.location,
      type: input.type,
      status: 'scheduled',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (input.notes) {
      appointmentData.notes = input.notes;
    }

    const docRef = await db.collection('appointments').add(appointmentData);

    return {
      success: true,
      appointmentId: docRef.id,
      message: `Appointment "${input.title}" on ${input.date} at ${input.time} created successfully.`,
    };
  },
});
