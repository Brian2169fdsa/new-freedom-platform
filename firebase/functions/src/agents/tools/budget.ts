/**
 * Budget Tools — Lane 1 Financial
 *
 * Tools for managing a simple budget: viewing summaries of income
 * and expenses, and adding new budget line items.
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getSessionUserId } from '../context';

// ---------------------------------------------------------------------------
// getBudgetSummary
// ---------------------------------------------------------------------------
export const getBudgetSummary = tool({
  name: 'get_budget_summary',
  description:
    'Get the user\'s current budget summary including total income, total expenses, and balance.',
  parameters: z.object({
    month: z
      .string()
      .optional()
      .describe(
        'Optional month to filter by in YYYY-MM format (e.g., "2026-02"). Defaults to all time.'
      ),
  }),
  execute: async (input, context?) => {
    const userId = getSessionUserId(context);
    if (!userId) {
      return { success: false, error: 'User not authenticated.' };
    }

    const db = getFirestore();
    let query: FirebaseFirestore.Query = db
      .collection('budgets')
      .where('userId', '==', userId);

    // Filter by month if provided
    if (input.month) {
      const startDate = `${input.month}-01`;
      // Compute end: roll month forward
      const [year, month] = input.month.split('-').map(Number);
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
      query = query.where('date', '>=', startDate).where('date', '<', endDate);
    }

    const snapshot = await query.get();

    let totalIncome = 0;
    let totalExpenses = 0;
    const incomeItems: Array<Record<string, unknown>> = [];
    const expenseItems: Array<Record<string, unknown>> = [];

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const item = {
        id: doc.id,
        amount: data.amount,
        category: data.category,
        description: data.description,
        date: data.date,
        type: data.type,
      };

      if (data.type === 'income') {
        totalIncome += data.amount || 0;
        incomeItems.push(item);
      } else if (data.type === 'expense') {
        totalExpenses += data.amount || 0;
        expenseItems.push(item);
      }
    });

    const balance = totalIncome - totalExpenses;

    return {
      success: true,
      summary: {
        totalIncome: Math.round(totalIncome * 100) / 100,
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        balance: Math.round(balance * 100) / 100,
        itemCount: snapshot.docs.length,
      },
      income: incomeItems,
      expenses: expenseItems,
      message:
        input.month
          ? `Budget for ${input.month}: Income $${totalIncome.toFixed(2)} | Expenses $${totalExpenses.toFixed(2)} | Balance $${balance.toFixed(2)}`
          : `Total budget: Income $${totalIncome.toFixed(2)} | Expenses $${totalExpenses.toFixed(2)} | Balance $${balance.toFixed(2)}`,
    };
  },
});

// ---------------------------------------------------------------------------
// addBudgetItem
// ---------------------------------------------------------------------------
export const addBudgetItem = tool({
  name: 'add_budget_item',
  description:
    'Add an income or expense item to the user\'s budget.',
  parameters: z.object({
    type: z
      .enum(['income', 'expense'])
      .describe('Whether this is an income or expense item.'),
    amount: z
      .number()
      .positive()
      .describe('The dollar amount (positive number).'),
    category: z
      .string()
      .describe(
        'Category for the item (e.g., "wages", "rent", "groceries", "utilities", "transportation", "benefits").'
      ),
    description: z
      .string()
      .describe('Description of the budget item.'),
    date: z
      .string()
      .optional()
      .describe('Date of the item in YYYY-MM-DD format. Defaults to today.'),
  }),
  execute: async (input, context?) => {
    const userId = getSessionUserId(context);
    if (!userId) {
      return { success: false, error: 'User not authenticated.' };
    }

    const db = getFirestore();
    const today = new Date().toISOString().split('T')[0];

    const itemData: Record<string, unknown> = {
      userId,
      type: input.type,
      amount: Math.round(input.amount * 100) / 100,
      category: input.category,
      description: input.description,
      date: input.date || today,
      createdAt: FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection('budgets').add(itemData);

    return {
      success: true,
      itemId: docRef.id,
      message: `${input.type === 'income' ? 'Income' : 'Expense'} of $${input.amount.toFixed(2)} (${input.category}) added to budget.`,
    };
  },
});
