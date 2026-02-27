import { useState } from 'react';
import {
  PageContainer,
  Card,
  CardContent,
  Button,
  Badge,
  Input,
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@reprieve/shared';
import type { Goal, GoalCategory, Milestone } from '@reprieve/shared';
import { useCollection } from '@reprieve/shared/hooks/useFirestore';
import { useAuth } from '@reprieve/shared/hooks/useAuth';
import {
  addDocument,
  updateDocument,
  deleteDocument,
  where,
  orderBy,
} from '@reprieve/shared/services/firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import {
  Plus,
  Target,
  CheckCircle2,
  Circle,
  Trash2,
  Edit,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Category configuration
// ---------------------------------------------------------------------------

const CATEGORY_CONFIG: Record<
  GoalCategory,
  { label: string; bg: string; text: string; ring: string; icon: string }
> = {
  sobriety: {
    label: 'Sobriety',
    bg: 'bg-green-100',
    text: 'text-green-800',
    ring: 'ring-green-300',
    icon: '🟢',
  },
  employment: {
    label: 'Employment',
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    ring: 'ring-blue-300',
    icon: '🔵',
  },
  housing: {
    label: 'Housing',
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    ring: 'ring-amber-300',
    icon: '🟡',
  },
  education: {
    label: 'Education',
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    ring: 'ring-purple-300',
    icon: '🟣',
  },
  health: {
    label: 'Health',
    bg: 'bg-red-100',
    text: 'text-red-800',
    ring: 'ring-red-300',
    icon: '🔴',
  },
  financial: {
    label: 'Financial',
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    ring: 'ring-emerald-300',
    icon: '💚',
  },
  legal: {
    label: 'Legal',
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    ring: 'ring-orange-300',
    icon: '🟠',
  },
  personal: {
    label: 'Personal',
    bg: 'bg-stone-100',
    text: 'text-stone-800',
    ring: 'ring-stone-300',
    icon: '⚪',
  },
};

const ALL_CATEGORIES: GoalCategory[] = [
  'sobriety',
  'employment',
  'housing',
  'education',
  'health',
  'financial',
  'legal',
  'personal',
];

const STATUS_BADGE: Record<string, { label: string; variant: 'success' | 'default' | 'secondary' }> = {
  active: { label: 'Active', variant: 'default' },
  completed: { label: 'Completed', variant: 'success' },
  paused: { label: 'Paused', variant: 'secondary' },
};

// ---------------------------------------------------------------------------
// Helper: generate a simple unique id for milestones
// ---------------------------------------------------------------------------
function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// ---------------------------------------------------------------------------
// Component: GoalCard
// ---------------------------------------------------------------------------

interface GoalCardProps {
  goal: Goal;
  onToggleMilestone: (goal: Goal, milestoneId: string) => void;
  onDelete: (goalId: string) => void;
  onEdit: (goal: Goal) => void;
}

function GoalCard({ goal, onToggleMilestone, onDelete, onEdit }: GoalCardProps) {
  const [expanded, setExpanded] = useState(false);
  const cat = CATEGORY_CONFIG[goal.category];
  const status = STATUS_BADGE[goal.status] ?? STATUS_BADGE.active;

  const targetDateStr = goal.targetDate
    ? goal.targetDate instanceof Timestamp
      ? goal.targetDate.toDate().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : ''
    : null;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Top color accent bar */}
        <div className={`h-1.5 ${cat.bg.replace('100', '400')}`} />

        <div className="p-4 space-y-3">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-lg text-sm ${cat.bg}`}
              >
                <Target className={`h-4 w-4 ${cat.text}`} />
              </span>
              <div className="min-w-0">
                <h3 className="font-semibold text-stone-800 truncate">{goal.title}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${cat.bg} ${cat.text}`}>
                    {cat.label}
                  </span>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(goal)}>
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => onDelete(goal.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-stone-500">Progress</span>
              <span className="text-xs font-semibold text-stone-700">
                {Math.round(goal.progress)}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-stone-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  goal.progress >= 100
                    ? 'bg-green-500'
                    : goal.progress >= 50
                    ? 'bg-amber-500'
                    : 'bg-amber-300'
                }`}
                style={{ width: `${Math.min(goal.progress, 100)}%` }}
              />
            </div>
          </div>

          {/* Target date */}
          {targetDateStr && (
            <p className="text-xs text-stone-400">
              Target: <span className="text-stone-600">{targetDateStr}</span>
            </p>
          )}

          {/* Milestones toggle */}
          {goal.milestones && goal.milestones.length > 0 && (
            <div>
              <button
                className="flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-900 transition-colors"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
                {goal.milestones.length} milestone{goal.milestones.length !== 1 ? 's' : ''}
                {' '}({goal.milestones.filter((m) => m.completed).length} done)
              </button>

              {expanded && (
                <ul className="mt-2 space-y-1.5">
                  {goal.milestones.map((ms) => (
                    <li key={ms.id} className="flex items-center gap-2">
                      <button
                        className="shrink-0 focus:outline-none"
                        onClick={() => onToggleMilestone(goal, ms.id)}
                      >
                        {ms.completed ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Circle className="h-4 w-4 text-stone-300 hover:text-amber-500 transition-colors" />
                        )}
                      </button>
                      <span
                        className={`text-sm ${
                          ms.completed ? 'line-through text-stone-400' : 'text-stone-700'
                        }`}
                      >
                        {ms.title}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Component: EmptyState
// ---------------------------------------------------------------------------

function EmptyState({ tab }: { tab: string }) {
  const messages: Record<string, { title: string; desc: string }> = {
    active: {
      title: 'No active goals yet',
      desc: 'Create your first goal and start building the future you deserve. Every step forward counts.',
    },
    completed: {
      title: 'No completed goals yet',
      desc: 'Keep working toward your goals. Completed goals will show up here as proof of your progress.',
    },
    all: {
      title: 'No goals yet',
      desc: 'Tap the + button above to set your first goal. Small wins lead to big changes.',
    },
  };
  const msg = messages[tab] ?? messages.all;

  return (
    <Card>
      <CardContent className="p-8 text-center">
        <div className="mx-auto h-14 w-14 rounded-full bg-amber-50 flex items-center justify-center mb-4">
          <Target className="h-7 w-7 text-amber-400" />
        </div>
        <h3 className="text-lg font-semibold text-stone-700 mb-1">{msg.title}</h3>
        <p className="text-sm text-stone-500 max-w-xs mx-auto">{msg.desc}</p>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Component: NewGoalDialog / EditGoalDialog
// ---------------------------------------------------------------------------

interface GoalFormState {
  title: string;
  category: GoalCategory;
  targetDate: string;
  milestones: { id: string; title: string }[];
  newMilestone: string;
}

const INITIAL_FORM: GoalFormState = {
  title: '',
  category: 'personal',
  targetDate: '',
  milestones: [],
  newMilestone: '',
};

interface GoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (form: GoalFormState) => Promise<void>;
  initial?: GoalFormState;
  mode: 'create' | 'edit';
}

function GoalDialog({ open, onOpenChange, onSave, initial, mode }: GoalDialogProps) {
  const [form, setForm] = useState<GoalFormState>(initial ?? INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  // Reset form when dialog opens or initial values change
  const initialKey = initial ? JSON.stringify(initial) : 'create';
  const [lastKey, setLastKey] = useState(initialKey);
  if (initialKey !== lastKey) {
    setLastKey(initialKey);
    setForm(initial ?? INITIAL_FORM);
  }

  const handleAddMilestone = () => {
    const text = form.newMilestone.trim();
    if (!text) return;
    setForm((prev) => ({
      ...prev,
      milestones: [...prev.milestones, { id: uid(), title: text }],
      newMilestone: '',
    }));
  };

  const handleRemoveMilestone = (id: string) => {
    setForm((prev) => ({
      ...prev,
      milestones: prev.milestones.filter((m) => m.id !== id),
    }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await onSave(form);
      setForm(INITIAL_FORM);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>{mode === 'create' ? 'New Goal' : 'Edit Goal'}</DialogTitle>
      </DialogHeader>
      <DialogContent className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Goal Title</label>
          <Input
            placeholder="e.g. Find stable housing"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          />
        </div>

        {/* Category grid */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">Category</label>
          <div className="grid grid-cols-4 gap-2">
            {ALL_CATEGORIES.map((cat) => {
              const cfg = CATEGORY_CONFIG[cat];
              const selected = form.category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  className={`flex flex-col items-center gap-1 rounded-lg p-2 text-xs font-medium border-2 transition-all ${
                    selected
                      ? `${cfg.bg} ${cfg.text} border-current ring-2 ${cfg.ring}`
                      : 'bg-white text-stone-500 border-stone-200 hover:border-stone-300'
                  }`}
                  onClick={() => setForm((p) => ({ ...p, category: cat }))}
                >
                  <span className="text-base leading-none">{cfg.icon}</span>
                  <span className="truncate w-full text-center">{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Target date */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Target Date <span className="text-stone-400 font-normal">(optional)</span>
          </label>
          <Input
            type="date"
            value={form.targetDate}
            onChange={(e) => setForm((p) => ({ ...p, targetDate: e.target.value }))}
          />
        </div>

        {/* Milestones */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Milestones</label>
          {form.milestones.length > 0 && (
            <ul className="space-y-1.5 mb-2">
              {form.milestones.map((ms) => (
                <li key={ms.id} className="flex items-center gap-2 text-sm text-stone-700">
                  <Circle className="h-3.5 w-3.5 text-stone-300 shrink-0" />
                  <span className="flex-1 truncate">{ms.title}</span>
                  <button
                    type="button"
                    className="text-stone-400 hover:text-red-500 transition-colors shrink-0"
                    onClick={() => handleRemoveMilestone(ms.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <Input
              placeholder="Add a milestone..."
              value={form.newMilestone}
              onChange={(e) => setForm((p) => ({ ...p, newMilestone: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddMilestone();
                }
              }}
            />
            <Button variant="outline" size="sm" className="shrink-0" onClick={handleAddMilestone}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={saving || !form.title.trim()}>
          {saving ? 'Saving...' : mode === 'create' ? 'Create Goal' : 'Save Changes'}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Page: Goals
// ---------------------------------------------------------------------------

export default function Goals() {
  const { firebaseUser } = useAuth();
  const userId = firebaseUser?.uid;

  // Fetch goals scoped to current user
  const { data: goals, loading } = useCollection<Goal>(
    'goals',
    where('userId', '==', userId ?? ''),
    orderBy('createdAt', 'desc')
  );

  const [tab, setTab] = useState('active');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);

  // ------- Filtered lists -------
  const activeGoals = goals.filter((g) => g.status === 'active');
  const completedGoals = goals.filter((g) => g.status === 'completed');

  // ------- Create goal -------
  const handleCreate = async (form: GoalFormState) => {
    if (!userId) return;
    const milestones: Milestone[] = form.milestones.map((m) => ({
      id: m.id,
      title: m.title,
      completed: false,
    }));

    const goalData: Record<string, unknown> = {
      userId,
      title: form.title.trim(),
      category: form.category,
      status: 'active',
      progress: 0,
      milestones,
    };

    if (form.targetDate) {
      goalData.targetDate = Timestamp.fromDate(new Date(form.targetDate));
    }

    await addDocument('goals', goalData);
  };

  // ------- Edit goal -------
  const handleOpenEdit = (goal: Goal) => {
    setEditGoal(goal);
  };

  const handleSaveEdit = async (form: GoalFormState) => {
    if (!editGoal) return;

    // Preserve completion status from existing milestones
    const existingMap = new Map(editGoal.milestones.map((m) => [m.id, m]));
    const milestones: Milestone[] = form.milestones.map((m) => {
      const existing = existingMap.get(m.id);
      return existing
        ? { ...existing, title: m.title }
        : { id: m.id, title: m.title, completed: false };
    });

    const completedCount = milestones.filter((m) => m.completed).length;
    const progress = milestones.length > 0 ? (completedCount / milestones.length) * 100 : editGoal.progress;
    const status = milestones.length > 0 && completedCount === milestones.length ? 'completed' : 'active';

    const updates: Record<string, unknown> = {
      title: form.title.trim(),
      category: form.category,
      milestones,
      progress,
      status,
    };

    if (form.targetDate) {
      updates.targetDate = Timestamp.fromDate(new Date(form.targetDate));
    } else {
      updates.targetDate = null;
    }

    await updateDocument('goals', editGoal.id, updates);
    setEditGoal(null);
  };

  // ------- Delete goal -------
  const handleDelete = async (goalId: string) => {
    await deleteDocument('goals', goalId);
  };

  // ------- Toggle milestone -------
  const handleToggleMilestone = async (goal: Goal, milestoneId: string) => {
    const updatedMilestones = goal.milestones.map((ms) =>
      ms.id === milestoneId
        ? {
            ...ms,
            completed: !ms.completed,
            completedAt: !ms.completed ? Timestamp.now() : undefined,
          }
        : ms
    );

    const completedCount = updatedMilestones.filter((m) => m.completed).length;
    const progress =
      updatedMilestones.length > 0 ? (completedCount / updatedMilestones.length) * 100 : 0;
    const allDone = updatedMilestones.length > 0 && completedCount === updatedMilestones.length;

    await updateDocument('goals', goal.id, {
      milestones: updatedMilestones,
      progress,
      status: allDone ? 'completed' : 'active',
    });
  };

  // ------- Build edit form initial state -------
  const editFormInitial: GoalFormState | undefined = editGoal
    ? {
        title: editGoal.title,
        category: editGoal.category,
        targetDate: editGoal.targetDate
          ? editGoal.targetDate instanceof Timestamp
            ? editGoal.targetDate.toDate().toISOString().split('T')[0]
            : ''
          : '',
        milestones: editGoal.milestones.map((m) => ({ id: m.id, title: m.title })),
        newMilestone: '',
      }
    : undefined;

  // ------- Loading state -------
  if (loading) {
    return (
      <PageContainer title="Goals" subtitle="Track your progress toward a better future">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-stone-200" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-4 w-40 bg-stone-200 rounded" />
                      <div className="h-3 w-24 bg-stone-100 rounded" />
                    </div>
                  </div>
                  <div className="h-2 w-full bg-stone-100 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Goals"
      subtitle="Track your progress toward a better future"
      action={
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> New Goal
        </Button>
      }
    >
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-amber-700">{activeGoals.length}</p>
            <p className="text-[11px] text-stone-500">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-green-700">{completedGoals.length}</p>
            <p className="text-[11px] text-stone-500">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-stone-700">{goals.length}</p>
            <p className="text-[11px] text-stone-500">Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Tab filter */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full">
          <TabsTrigger value="active" className="flex-1">
            Active ({activeGoals.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex-1">
            Completed ({completedGoals.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="flex-1">
            All ({goals.length})
          </TabsTrigger>
        </TabsList>

        {(['active', 'completed', 'all'] as const).map((t) => {
          const list =
            t === 'active' ? activeGoals : t === 'completed' ? completedGoals : goals;
          return (
            <TabsContent key={t} value={t}>
              {list.length === 0 ? (
                <EmptyState tab={t} />
              ) : (
                <div className="space-y-4">
                  {list.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onToggleMilestone={handleToggleMilestone}
                      onDelete={handleDelete}
                      onEdit={handleOpenEdit}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      {/* New Goal Dialog */}
      <GoalDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleCreate}
        mode="create"
      />

      {/* Edit Goal Dialog */}
      {editGoal && (
        <GoalDialog
          open={!!editGoal}
          onOpenChange={(open) => {
            if (!open) setEditGoal(null);
          }}
          onSave={handleSaveEdit}
          initial={editFormInitial}
          mode="edit"
        />
      )}
    </PageContainer>
  );
}
