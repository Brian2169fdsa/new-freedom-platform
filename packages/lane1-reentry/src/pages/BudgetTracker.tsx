import { useState, useMemo, useEffect } from 'react';
import {
  PageContainer,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
  Input,
  useAuth,
} from '@reprieve/shared';
import type { Budget, BudgetItem } from '@reprieve/shared';
import {
  getDocuments,
  setDocument,
  addDocument,
} from '@reprieve/shared/services/firebase/firestore';
import { where } from 'firebase/firestore';
import {
  DollarSign,
  Plus,
  Trash2,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ChevronLeft,
  ChevronRight,
  Zap,
  Bell,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const EXPENSE_CATEGORIES = [
  'Housing',
  'Food',
  'Transportation',
  'Utilities',
  'Insurance',
  'Healthcare',
  'Phone',
  'Personal',
  'Education',
  'Legal',
  'Savings',
  'Other',
];

const INCOME_CATEGORIES = [
  'Employment',
  'Benefits',
  'Child Support',
  'Side Work',
  'Stipend',
  'Other',
];

function getMonthString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthDisplay(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// ---------------------------------------------------------------------------
// First 90 Days Template
// ---------------------------------------------------------------------------

const FIRST_90_DAYS_EXPENSES: BudgetItem[] = [
  { id: generateId(), label: 'Rent / Sober Living', amount: 600, category: 'Housing' },
  { id: generateId(), label: 'Groceries', amount: 250, category: 'Food' },
  { id: generateId(), label: 'Bus Pass', amount: 64, category: 'Transportation' },
  { id: generateId(), label: 'Phone Bill', amount: 50, category: 'Phone' },
  { id: generateId(), label: 'Hygiene / Personal', amount: 40, category: 'Personal' },
  { id: generateId(), label: 'Court Fees', amount: 100, category: 'Legal' },
  { id: generateId(), label: 'Medications', amount: 30, category: 'Healthcare' },
  { id: generateId(), label: 'Savings', amount: 50, category: 'Savings' },
];

const FIRST_90_DAYS_INCOME: BudgetItem[] = [
  { id: generateId(), label: 'Part-Time Job', amount: 1200, category: 'Employment' },
  { id: generateId(), label: 'Program Stipend', amount: 200, category: 'Stipend' },
];

// ---------------------------------------------------------------------------
// CSS Pie Chart (no external dependencies)
// ---------------------------------------------------------------------------

const PIE_COLORS = [
  '#d97706', // amber-600
  '#059669', // emerald-600
  '#7c3aed', // violet-600
  '#dc2626', // red-600
  '#2563eb', // blue-600
  '#d946ef', // fuchsia-500
  '#0d9488', // teal-600
  '#ea580c', // orange-600
  '#64748b', // slate-500
  '#84cc16', // lime-500
  '#f59e0b', // amber-500
  '#6366f1', // indigo-500
];

interface PieSlice {
  label: string;
  value: number;
  color: string;
  percent: number;
}

function ExpensePieChart({ expenses }: { expenses: BudgetItem[] }) {
  const slices = useMemo(() => {
    const grouped: Record<string, number> = {};
    expenses.forEach((item) => {
      const cat = item.category || 'Other';
      grouped[cat] = (grouped[cat] || 0) + item.amount;
    });

    const total = Object.values(grouped).reduce((s, v) => s + v, 0);
    if (total === 0) return [];

    return Object.entries(grouped)
      .sort(([, a], [, b]) => b - a)
      .map(([label, value], i): PieSlice => ({
        label,
        value,
        color: PIE_COLORS[i % PIE_COLORS.length],
        percent: (value / total) * 100,
      }));
  }, [expenses]);

  if (slices.length === 0) return null;

  // Build conic-gradient stops
  let cumulative = 0;
  const stops = slices.map((slice) => {
    const start = cumulative;
    cumulative += slice.percent;
    return `${slice.color} ${start}% ${cumulative}%`;
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      {/* Pie */}
      <div
        className="w-32 h-32 rounded-full flex-shrink-0 shadow-inner"
        style={{
          background: `conic-gradient(${stops.join(', ')})`,
        }}
      />
      {/* Legend */}
      <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-1.5">
        {slices.map((slice) => (
          <div key={slice.label} className="flex items-center gap-2 min-w-0">
            <div
              className="h-3 w-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: slice.color }}
            />
            <span className="text-xs text-stone-600 truncate">{slice.label}</span>
            <span className="text-xs font-medium text-stone-800 ml-auto flex-shrink-0">
              {slice.percent.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BudgetTracker() {
  const { user } = useAuth();

  const [currentMonth, setCurrentMonth] = useState(() => getMonthString(new Date()));
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addType, setAddType] = useState<'income' | 'expenses'>('income');
  const [newLabel, setNewLabel] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [savingsGoal, setSavingsGoal] = useState('');

  // Load budget for current month
  useEffect(() => {
    if (!user?.uid) return;

    const loadBudget = async () => {
      setLoading(true);
      try {
        const results = await getDocuments<Budget>(
          'budgets',
          where('userId', '==', user.uid),
          where('month', '==', currentMonth)
        );

        if (results.length > 0) {
          const budgetDoc = results[0];
          setBudget(budgetDoc);
          setSavingsGoal(String((budgetDoc as any).savingsGoal || 0));
        } else {
          setBudget(null);
          setSavingsGoal('0');
        }
      } catch (error) {
        console.error('Failed to load budget:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBudget();
  }, [user?.uid, currentMonth]);

  const incomeItems = budget?.income ?? [];
  const expenseItems = budget?.expenses ?? [];

  const totalIncome = useMemo(
    () => incomeItems.reduce((sum, item) => sum + item.amount, 0),
    [incomeItems]
  );
  const totalExpenses = useMemo(
    () => expenseItems.reduce((sum, item) => sum + item.amount, 0),
    [expenseItems]
  );
  const net = totalIncome - totalExpenses;
  const savingsGoalNum = parseFloat(savingsGoal) || 0;
  const savingsProgress = savingsGoalNum > 0 ? Math.min((Math.max(net, 0) / savingsGoalNum) * 100, 100) : 0;

  const saveBudget = async (
    income: BudgetItem[],
    expenses: BudgetItem[],
    goal?: number
  ) => {
    if (!user?.uid) return;
    setSaving(true);

    try {
      const budgetData = {
        userId: user.uid,
        month: currentMonth,
        income,
        expenses,
        savingsGoal: goal ?? savingsGoalNum,
      };

      if (budget?.id) {
        await setDocument('budgets', budget.id, budgetData);
        setBudget({ ...budgetData, id: budget.id });
      } else {
        const newId = await addDocument('budgets', budgetData);
        setBudget({ ...budgetData, id: newId });
      }
    } catch (error) {
      console.error('Failed to save budget:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = () => {
    if (!newLabel.trim() || !newAmount) return;

    const newItem: BudgetItem = {
      id: generateId(),
      label: newLabel.trim(),
      amount: parseFloat(newAmount),
      category: newCategory || 'Other',
    };

    if (addType === 'income') {
      const updated = [...incomeItems, newItem];
      saveBudget(updated, expenseItems);
    } else {
      const updated = [...expenseItems, newItem];
      saveBudget(incomeItems, updated);
    }

    setNewLabel('');
    setNewAmount('');
    setNewCategory('');
    setAddDialogOpen(false);
  };

  const handleRemoveItem = (type: 'income' | 'expenses', itemId: string) => {
    if (type === 'income') {
      const updated = incomeItems.filter((i) => i.id !== itemId);
      saveBudget(updated, expenseItems);
    } else {
      const updated = expenseItems.filter((i) => i.id !== itemId);
      saveBudget(incomeItems, updated);
    }
  };

  const handleSavingsGoalChange = () => {
    const goal = parseFloat(savingsGoal) || 0;
    saveBudget(incomeItems, expenseItems, goal);
  };

  const handleApplyTemplate = () => {
    // Apply the First 90 Days template, assigning fresh IDs
    const templateExpenses = FIRST_90_DAYS_EXPENSES.map((item) => ({
      ...item,
      id: generateId(),
    }));
    const templateIncome = FIRST_90_DAYS_INCOME.map((item) => ({
      ...item,
      id: generateId(),
    }));
    saveBudget(templateIncome, templateExpenses, 200);
  };

  const navigateMonth = (direction: -1 | 1) => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + direction);
    setCurrentMonth(getMonthString(date));
  };

  const openAddDialog = (type: 'income' | 'expenses') => {
    setAddType(type);
    setNewLabel('');
    setNewAmount('');
    setNewCategory(type === 'income' ? 'Employment' : 'Housing');
    setAddDialogOpen(true);
  };

  return (
    <PageContainer title="Budget Tracker" subtitle="Manage your monthly income and expenses">
      {/* Back link */}
      <Link
        to="/tools"
        className="inline-flex items-center gap-1 text-sm text-amber-700 hover:text-amber-800 -mt-2 mb-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Tools
      </Link>

      {/* Month selector */}
      <div className="flex items-center justify-center gap-4 mb-2">
        <button
          onClick={() => navigateMonth(-1)}
          className="h-8 w-8 rounded-lg flex items-center justify-center text-stone-500 hover:bg-stone-100 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h3 className="text-lg font-semibold text-stone-800 min-w-[180px] text-center">
          {formatMonthDisplay(currentMonth)}
        </h3>
        <button
          onClick={() => navigateMonth(1)}
          className="h-8 w-8 rounded-lg flex items-center justify-center text-stone-500 hover:bg-stone-100 transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 border-2 border-amber-700 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary Card */}
          <Card className="bg-gradient-to-br from-amber-50 to-stone-50 border-amber-200">
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs font-medium">Income</span>
                  </div>
                  <p className="text-lg font-bold text-stone-800">
                    ${totalIncome.toFixed(2)}
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-red-500 mb-1">
                    <TrendingDown className="h-4 w-4" />
                    <span className="text-xs font-medium">Expenses</span>
                  </div>
                  <p className="text-lg font-bold text-stone-800">
                    ${totalExpenses.toFixed(2)}
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-amber-700 mb-1">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-xs font-medium">Net</span>
                  </div>
                  <p
                    className={`text-lg font-bold ${
                      net >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {net >= 0 ? '+' : ''}${net.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Savings Goal */}
              <div className="mt-4 pt-3 border-t border-amber-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <PiggyBank className="h-4 w-4 text-amber-700" />
                    <span className="text-sm font-medium text-stone-700">Savings Goal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-500">$</span>
                    <input
                      type="number"
                      value={savingsGoal}
                      onChange={(e) => setSavingsGoal(e.target.value)}
                      onBlur={handleSavingsGoalChange}
                      className="w-20 h-7 rounded border border-stone-300 px-2 text-sm text-right text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      min="0"
                      step="50"
                    />
                  </div>
                </div>
                {savingsGoalNum > 0 && (
                  <div>
                    <div className="flex justify-between text-xs text-stone-500 mb-1">
                      <span>${Math.max(net, 0).toFixed(2)} saved</span>
                      <span>{savingsProgress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-stone-200 rounded-full h-2">
                      <div
                        className="bg-amber-600 h-2 rounded-full transition-all"
                        style={{ width: `${savingsProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Income Section */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Income
                </CardTitle>
                <Button size="sm" variant="outline" onClick={() => openAddDialog('income')}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {incomeItems.length === 0 ? (
                <p className="text-sm text-stone-400 text-center py-4">
                  No income items yet. Tap Add to get started.
                </p>
              ) : (
                <div className="space-y-2">
                  {incomeItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-800 truncate">
                          {item.label}
                        </p>
                        <p className="text-xs text-stone-400">{item.category}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-green-600">
                          +${item.amount.toFixed(2)}
                        </span>
                        <button
                          onClick={() => handleRemoveItem('income', item.id)}
                          className="h-7 w-7 rounded flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2 border-t border-stone-200">
                    <span className="text-sm font-semibold text-stone-700">Total Income</span>
                    <span className="text-sm font-bold text-green-600">
                      ${totalIncome.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expenses Section */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                  Expenses
                </CardTitle>
                <Button size="sm" variant="outline" onClick={() => openAddDialog('expenses')}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {expenseItems.length === 0 ? (
                <p className="text-sm text-stone-400 text-center py-4">
                  No expense items yet. Tap Add to get started.
                </p>
              ) : (
                <div className="space-y-2">
                  {expenseItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-800 truncate">
                          {item.label}
                        </p>
                        <p className="text-xs text-stone-400">{item.category}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-red-500">
                          -${item.amount.toFixed(2)}
                        </span>
                        <button
                          onClick={() => handleRemoveItem('expenses', item.id)}
                          className="h-7 w-7 rounded flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2 border-t border-stone-200">
                    <span className="text-sm font-semibold text-stone-700">Total Expenses</span>
                    <span className="text-sm font-bold text-red-500">
                      ${totalExpenses.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expense Breakdown Pie Chart */}
          {expenseItems.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-stone-700">
                  Expense Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ExpensePieChart expenses={expenseItems} />
              </CardContent>
            </Card>
          )}

          {/* Bill Reminders */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="h-4 w-4 text-amber-600" />
                Bill Reminders
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expenseItems.length === 0 ? (
                <p className="text-sm text-stone-400 text-center py-4">
                  Add expenses to track bill due dates.
                </p>
              ) : (
                <div className="space-y-2">
                  {expenseItems
                    .filter((item) =>
                      ['Housing', 'Utilities', 'Phone', 'Insurance', 'Legal'].includes(
                        item.category,
                      ),
                    )
                    .map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-2.5 rounded-lg bg-amber-50 border border-amber-100"
                      >
                        <Bell className="h-4 w-4 text-amber-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-stone-800 truncate">
                            {item.label}
                          </p>
                          <p className="text-xs text-stone-500">
                            {item.category} - ${item.amount.toFixed(2)}/mo
                          </p>
                        </div>
                        <span className="text-xs text-amber-700 font-medium flex-shrink-0">
                          Monthly
                        </span>
                      </div>
                    ))}
                  {expenseItems.filter((item) =>
                    ['Housing', 'Utilities', 'Phone', 'Insurance', 'Legal'].includes(
                      item.category,
                    ),
                  ).length === 0 && (
                    <p className="text-sm text-stone-400 text-center py-2">
                      No recurring bills detected.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* First 90 Days Template */}
          {incomeItems.length === 0 && expenseItems.length === 0 && (
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Zap className="h-5 w-5 text-amber-700" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-stone-800 mb-1">
                      First 90 Days Template
                    </h4>
                    <p className="text-xs text-stone-500 mb-3">
                      Start with a common budget template for people re-entering the community.
                      Pre-fills typical expenses like rent, groceries, transportation, and phone.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-amber-300 text-amber-700 hover:bg-amber-100"
                      onClick={handleApplyTemplate}
                    >
                      <Zap className="h-4 w-4 mr-1" /> Apply Template
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Monthly Comparison */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-stone-700">
                Monthly Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-center gap-2 h-24">
                {/* Simple bar chart showing current month vs savings goal */}
                <div className="flex flex-col items-center gap-1">
                  <div
                    className="w-10 rounded-t bg-green-400 transition-all"
                    style={{
                      height: `${Math.min((totalIncome / Math.max(totalIncome, totalExpenses, 1)) * 80, 80)}px`,
                    }}
                  />
                  <span className="text-[10px] text-stone-500">Income</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div
                    className="w-10 rounded-t bg-red-400 transition-all"
                    style={{
                      height: `${Math.min((totalExpenses / Math.max(totalIncome, totalExpenses, 1)) * 80, 80)}px`,
                    }}
                  />
                  <span className="text-[10px] text-stone-500">Expenses</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-10 rounded-t transition-all ${net >= 0 ? 'bg-amber-400' : 'bg-orange-400'}`}
                    style={{
                      height: `${Math.min((Math.abs(net) / Math.max(totalIncome, totalExpenses, 1)) * 80, 80)}px`,
                    }}
                  />
                  <span className="text-[10px] text-stone-500">Net</span>
                </div>
              </div>
              <p className="text-center text-xs text-stone-400 mt-2">
                {formatMonthDisplay(currentMonth)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Item Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogHeader>
          <DialogTitle>
            Add {addType === 'income' ? 'Income' : 'Expense'}
          </DialogTitle>
        </DialogHeader>
        <DialogContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Label
              </label>
              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder={
                  addType === 'income' ? 'e.g. Weekly paycheck' : 'e.g. Rent'
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Amount ($)
              </label>
              <Input
                type="number"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Category
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                {(addType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(
                  (cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAddItem}
            disabled={!newLabel.trim() || !newAmount || saving}
          >
            {saving ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" /> Add{' '}
                {addType === 'income' ? 'Income' : 'Expense'}
              </>
            )}
          </Button>
        </DialogFooter>
      </Dialog>
    </PageContainer>
  );
}
