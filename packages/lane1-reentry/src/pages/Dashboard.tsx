import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PageContainer,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
} from '@reprieve/shared';
import type { Goal, Appointment, JobApplication } from '@reprieve/shared';
import { useCollection } from '@reprieve/shared/hooks/useFirestore';
import { useAuth } from '@reprieve/shared/hooks/useAuth';
import { where, orderBy, limit, Timestamp } from 'firebase/firestore';
import {
  Target,
  Briefcase,
  Calendar,
  MessageSquare,
  ChevronRight,
  Plus,
  Sparkles,
  Clock,
  TrendingUp,
  Heart,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysSince(date: unknown): number | null {
  if (!date) return null;
  const start = toDate(date);
  if (isNaN(start.getTime())) return null;
  const now = new Date();
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function toDate(ts: unknown): Date {
  if (ts instanceof Date) return ts;
  if (typeof ts === 'string') return new Date(ts);
  if (ts && typeof (ts as { toDate?: unknown }).toDate === 'function')
    return (ts as Timestamp).toDate();
  return new Date(ts as number);
}

function formatDate(ts: Timestamp | Date | string | undefined): string {
  if (!ts) return '';
  return toDate(ts).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(ts: Timestamp | Date | string | undefined): string {
  if (!ts) return '';
  return toDate(ts).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

// ---------------------------------------------------------------------------
// Loading Skeletons
// ---------------------------------------------------------------------------

function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-slate-100 ${className}`}
      aria-hidden
    >
      <div className="p-6 space-y-3">
        <div className="h-4 w-1/3 rounded bg-slate-200" />
        <div className="h-8 w-1/2 rounded bg-slate-200" />
        <div className="h-3 w-2/3 rounded bg-slate-200" />
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="animate-pulse flex items-center gap-4 py-3" aria-hidden>
      <div className="h-10 w-10 rounded-full bg-slate-200" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-3/4 rounded bg-slate-200" />
        <div className="h-3 w-1/2 rounded bg-slate-200" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1. Sobriety Counter
// ---------------------------------------------------------------------------

function SobrietyCounter({
  sobrietyDate,
}: {
  sobrietyDate: Date | string | undefined | null;
}) {
  const days = daysSince(sobrietyDate);

  // No sobriety date set -- prompt the user
  if (days === null) {
    return (
      <Card className="border-none bg-gradient-to-br from-blue-50 to-slate-50 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <Heart className="h-10 w-10 text-blue-400 mb-3" />
          <h2 className="text-xl font-semibold text-slate-800 mb-1">
            Track Your Journey
          </h2>
          <p className="text-slate-500 mb-4 max-w-md">
            Set your sobriety date and we will celebrate every milestone with
            you.
          </p>
          <Link to="/profile">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Set Sobriety Date
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Calculate progress toward next milestone
  const milestones = [30, 60, 90, 180, 365, 730, 1095];
  const nextMilestone = milestones.find((m) => m > days) ?? days + 30;
  const progress = Math.min((days / nextMilestone) * 100, 100);

  const encouragement =
    days < 7
      ? 'Every single day matters. You are doing this.'
      : days < 30
        ? 'Building real momentum. Keep going.'
        : days < 90
          ? 'Incredible consistency. You inspire others.'
          : days < 365
            ? 'Your dedication is truly remarkable.'
            : 'A living testament to resilience and courage.';

  return (
    <Card className="border-none bg-gradient-to-br from-blue-50 via-orange-50 to-slate-50 shadow-sm overflow-hidden relative">
      {/* Decorative circle */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-blue-100/40 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <CardContent className="relative py-8 px-6 flex flex-col sm:flex-row items-center gap-6">
        {/* Big counter circle */}
        <div className="flex-shrink-0 flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-orange-600 shadow-lg">
          <div className="text-center text-white">
            <span className="block text-3xl font-bold leading-none">
              {days}
            </span>
            <span className="block text-xs font-medium uppercase tracking-wider opacity-90">
              {days === 1 ? 'Day' : 'Days'}
            </span>
          </div>
        </div>

        <div className="flex-1 text-center sm:text-left">
          <h2 className="text-2xl font-bold text-slate-800 mb-1">
            {days} {days === 1 ? 'Day' : 'Days'} Strong
          </h2>
          <p className="text-slate-500 mb-3">{encouragement}</p>

          {/* Progress bar toward next milestone */}
          <div className="max-w-xs mx-auto sm:mx-0">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Next milestone</span>
              <span>{nextMilestone} days</span>
            </div>
            <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-400 to-orange-500 transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 2. Quick Stats Grid
// ---------------------------------------------------------------------------

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  to: string;
  color: string;
  loading?: boolean;
}

function StatCard({ icon, label, value, to, color, loading }: StatCardProps) {
  return (
    <Link to={to} className="group">
      <Card className="border-none shadow-sm hover:shadow-md transition-shadow h-full">
        <CardContent className="p-5 flex items-center gap-4">
          <div
            className={`flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl ${color}`}
          >
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="animate-pulse space-y-1">
                <div className="h-6 w-10 rounded bg-slate-200" />
                <div className="h-3 w-16 rounded bg-slate-100" />
              </div>
            ) : (
              <>
                <p className="text-2xl font-bold text-slate-800">{value}</p>
                <p className="text-sm text-slate-500 truncate">{label}</p>
              </>
            )}
          </div>
          <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
        </CardContent>
      </Card>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// 3. Appointment List Item
// ---------------------------------------------------------------------------

const APPOINTMENT_TYPE_COLORS: Record<string, string> = {
  medical: 'bg-blue-100 text-blue-700',
  therapy: 'bg-violet-100 text-violet-700',
  legal: 'bg-slate-100 text-slate-700',
  employment: 'bg-blue-100 text-blue-700',
  housing: 'bg-green-100 text-green-700',
  case_management: 'bg-orange-100 text-orange-700',
};

function AppointmentItem({ appointment }: { appointment: Appointment }) {
  const dt = toDate((appointment as any).dateTime);

  const apptType: string | undefined = (appointment as any).type;
  const badgeColor =
    APPOINTMENT_TYPE_COLORS[apptType ?? ''] ?? 'bg-slate-100 text-slate-600';

  return (
    <div className="flex items-start gap-4 py-3 border-b border-slate-100 last:border-b-0">
      <div className="flex-shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-blue-700">
        <Clock className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-800 truncate">
          {(appointment as any).title ?? 'Appointment'}
        </p>
        <p className="text-sm text-slate-500">
          {formatDate(dt)} &middot; {formatTime(dt)}
        </p>
      </div>
      {apptType && (
        <Badge className={`text-xs ${badgeColor} border-none capitalize`}>
          {apptType.replace(/_/g, ' ')}
        </Badge>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. Quick Actions
// ---------------------------------------------------------------------------

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  to: string;
  color: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    icon: <Sparkles className="h-5 w-5" />,
    label: 'AI Chat',
    to: '/ai-chat',
    color: 'bg-blue-100 text-blue-700',
  },
  {
    icon: <Plus className="h-5 w-5" />,
    label: 'New Goal',
    to: '/goals',
    color: 'bg-orange-100 text-orange-700',
  },
  {
    icon: <MessageSquare className="h-5 w-5" />,
    label: 'Check In',
    to: '/journal',
    color: 'bg-slate-100 text-slate-700',
  },
  {
    icon: <Calendar className="h-5 w-5" />,
    label: 'Schedule',
    to: '/tools/calendar',
    color: 'bg-blue-100 text-blue-700',
  },
];

function QuickActions() {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
      {QUICK_ACTIONS.map((action) => (
        <Link
          key={action.label}
          to={action.to}
          className="flex-shrink-0 group"
        >
          <div className="flex flex-col items-center gap-2 w-20">
            <div
              className={`flex items-center justify-center w-14 h-14 rounded-2xl ${action.color} shadow-sm group-hover:shadow-md transition-shadow`}
            >
              {action.icon}
            </div>
            <span className="text-xs font-medium text-slate-600 group-hover:text-blue-700 transition-colors">
              {action.label}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5. Goal Item with Progress Bar
// ---------------------------------------------------------------------------

function GoalItem({ goal }: { goal: Goal }) {
  const progress =
    typeof (goal as any).progress === 'number' ? (goal as any).progress : 0;

  return (
    <div className="py-3 border-b border-slate-100 last:border-b-0">
      <div className="flex items-center justify-between mb-1">
        <p className="font-medium text-slate-800 truncate pr-4">
          {(goal as any).title ?? 'Untitled Goal'}
        </p>
        <span className="text-xs font-semibold text-blue-700 flex-shrink-0">
          {progress}%
        </span>
      </div>
      {(goal as any).description && (
        <p className="text-sm text-slate-500 truncate mb-2">
          {(goal as any).description}
        </p>
      )}
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-400 to-orange-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 6. Getting Started Card (no goals yet)
// ---------------------------------------------------------------------------

function GettingStartedCard() {
  const navigate = useNavigate();

  return (
    <Card className="border-none bg-gradient-to-br from-blue-50 to-orange-50 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-5 w-5 text-blue-500" />
          <CardTitle className="text-lg text-slate-800">
            Welcome to REPrieve
          </CardTitle>
        </div>
        <CardDescription className="text-slate-500">
          Your journey to a new chapter starts here. Setting a goal is the first
          step toward building the future you deserve.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={() => navigate('/goals')}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Target className="h-4 w-4 mr-2" />
          Set Your First Goal
        </Button>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Dashboard
// ---------------------------------------------------------------------------

export default function Dashboard() {
  const { firebaseUser, user } = useAuth();
  const uid = firebaseUser?.uid;

  // ── Firestore queries ────────────────────────────────────────────────────
  // Recent active goals (limit 3 for the card list)
  const { data: recentGoals, loading: recentGoalsLoading } =
    useCollection<Goal>(
      'goals',
      ...(uid
        ? [
            where('userId', '==', uid),
            where('status', '==', 'active'),
            orderBy('createdAt', 'desc'),
            limit(3),
          ]
        : [limit(0)]),
    );

  // All active goals (for the stat count)
  const { data: allActiveGoals, loading: allGoalsLoading } =
    useCollection<Goal>(
      'goals',
      ...(uid
        ? [where('userId', '==', uid), where('status', '==', 'active')]
        : [limit(0)]),
    );

  // Upcoming appointments (next 3, ordered chronologically)
  const { data: appointments, loading: appointmentsLoading } =
    useCollection<Appointment>(
      'appointments',
      ...(uid
        ? [
            where('userId', '==', uid),
            orderBy('dateTime', 'asc'),
            limit(3),
          ]
        : [limit(0)]),
    );

  // Active job applications (for the stat count)
  const { data: jobApps, loading: jobAppsLoading } =
    useCollection<JobApplication>(
      'jobApplications',
      ...(uid
        ? [where('userId', '==', uid), where('status', '==', 'active')]
        : [limit(0)]),
    );

  const anyLoading =
    recentGoalsLoading ||
    allGoalsLoading ||
    appointmentsLoading ||
    jobAppsLoading;

  // ── Derived user profile data ────────────────────────────────────────────
  const sobrietyDate = useMemo(() => {
    const raw =
      (user as any)?.profile?.sobrietyDate ?? (user as any)?.sobrietyDate;
    if (!raw) return null;
    return toDate(raw);
  }, [user]);

  const firstName =
    (user as any)?.profile?.firstName ??
    (user as any)?.firstName ??
    firebaseUser?.displayName?.split(' ')[0] ??
    'there';

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        {/* ── Greeting ──────────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Welcome back, {firstName}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* ── 1. Sobriety Counter ───────────────────────────────────── */}
        {anyLoading ? (
          <SkeletonCard className="h-40" />
        ) : (
          <SobrietyCounter sobrietyDate={sobrietyDate} />
        )}

        {/* ── 2. Quick Stats Grid (2x2) ────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<Target className="h-5 w-5 text-blue-700" />}
            label="Active Goals"
            value={allActiveGoals.length}
            to="/goals"
            color="bg-blue-100"
            loading={allGoalsLoading}
          />
          <StatCard
            icon={<Briefcase className="h-5 w-5 text-orange-700" />}
            label="Applications"
            value={jobApps.length}
            to="/employment"
            color="bg-orange-100"
            loading={jobAppsLoading}
          />
          <StatCard
            icon={<Calendar className="h-5 w-5 text-slate-700" />}
            label="Upcoming"
            value={appointments.length}
            to="/tools/calendar"
            color="bg-slate-100"
            loading={appointmentsLoading}
          />
          <StatCard
            icon={<MessageSquare className="h-5 w-5 text-blue-700" />}
            label="Messages"
            value={0}
            to="/messages"
            color="bg-blue-50"
            loading={false}
          />
        </div>

        {/* ── 3. Upcoming Appointments ──────────────────────────────── */}
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base text-slate-700">
              Upcoming Appointments
            </CardTitle>
            <Link
              to="/tools/calendar"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              View All <ChevronRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {appointmentsLoading ? (
              <div className="space-y-1">
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No upcoming appointments</p>
                <Link to="/tools/calendar">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Schedule One
                  </Button>
                </Link>
              </div>
            ) : (
              appointments.map((appt, idx) => (
                <AppointmentItem
                  key={(appt as any).id ?? idx}
                  appointment={appt}
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* ── 4. Quick Actions ──────────────────────────────────────── */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-slate-700">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <QuickActions />
          </CardContent>
        </Card>

        {/* ── 5. Recent Goals  /  6. Getting Started ────────────────── */}
        {recentGoalsLoading ? (
          <SkeletonCard className="h-48" />
        ) : recentGoals.length === 0 ? (
          <GettingStartedCard />
        ) : (
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base text-slate-700">
                Recent Goals
              </CardTitle>
              <Link
                to="/goals"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                View All <ChevronRight className="h-4 w-4" />
              </Link>
            </CardHeader>
            <CardContent>
              {recentGoals.map((goal, idx) => (
                <GoalItem key={(goal as any).id ?? idx} goal={goal} />
              ))}
            </CardContent>
          </Card>
        )}

        {/* ── Motivational Footer ───────────────────────────────────── */}
        <div className="text-center pt-4 pb-8">
          <p className="text-sm text-slate-400 italic flex items-center justify-center gap-2">
            <TrendingUp className="h-4 w-4" />
            One day at a time. You are building something real.
          </p>
        </div>
      </div>
    </PageContainer>
  );
}
