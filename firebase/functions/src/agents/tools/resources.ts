/**
 * Resources Tools — Lane 3 Resource Lookup
 *
 * Tools for searching community resources (shelters, food banks,
 * medical clinics, etc.) and retrieving full details by ID.
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { getFirestore } from 'firebase-admin/firestore';

// ---------------------------------------------------------------------------
// searchResources
// ---------------------------------------------------------------------------
export const searchResources = tool({
  name: 'search_resources',
  description:
    'Search community resources by category. Optionally include a text query to further filter results.',
  parameters: z.object({
    category: z
      .enum([
        'shelter',
        'food',
        'medical',
        'mental_health',
        'legal',
        'employment',
        'transportation',
        'hygiene',
      ])
      .describe('The category of resource to search for.'),
    query: z
      .string()
      .optional()
      .describe('Optional text query to filter results (matched against name and description).'),
  }),
  execute: async (input, _context?) => {
    const db = getFirestore();

    // Primary filter: category
    let queryRef: FirebaseFirestore.Query = db
      .collection('resources')
      .where('category', '==', input.category)
      .where('active', '==', true)
      .orderBy('name', 'asc');

    const snapshot = await queryRef.get();
    let resources = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Client-side text filter when a query string is provided
    if (input.query) {
      const lowerQuery = input.query.toLowerCase();
      resources = resources.filter((r: any) => {
        const name = (r.name || '').toLowerCase();
        const description = (r.description || '').toLowerCase();
        return name.includes(lowerQuery) || description.includes(lowerQuery);
      });
    }

    return {
      success: true,
      category: input.category,
      count: resources.length,
      resources,
    };
  },
});

// ---------------------------------------------------------------------------
// getResourceDetails
// ---------------------------------------------------------------------------
export const getResourceDetails = tool({
  name: 'get_resource_details',
  description:
    'Get full details of a specific community resource by its Firestore document ID.',
  parameters: z.object({
    resourceId: z.string().describe('The Firestore document ID of the resource.'),
  }),
  execute: async (input, _context?) => {
    const db = getFirestore();
    const doc = await db.collection('resources').doc(input.resourceId).get();

    if (!doc.exists) {
      return {
        success: false,
        error: `Resource with ID "${input.resourceId}" not found.`,
      };
    }

    return {
      success: true,
      resource: {
        id: doc.id,
        ...doc.data(),
      },
    };
  },
});
