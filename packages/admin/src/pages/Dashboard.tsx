import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PageContainer,
  Card, CardHeader, CardTitle, CardContent, CardDescription,
  Badge, Button,
  useAuth,
  useCollection,
  formatRelative,
  toDate,
  LANE_NAMES,
} from '@reprieve/shared';
import type {
  User, Post, JournalEntry, Goal, JobApplication,
  UserProgress, Resource,
} from '@reprieve/shared';
import { where, orderBy, limit, Timestamp } from 'firebase/firestore';
import {
  Users, Activity, TrendingUp, BarChart3,
  Shield, AlertTriangle, Clock, ArrowRight,
  FileText, Heart,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Date helpers (immutable — pure functions returning new values)
// ---------------------------------------------------------------------------

function getTodayDateStr(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getSevenDaysAgo(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getMonthLabel(date: Date): string {
  return date.toLocaleString('default', { month: 'short', year: '2-digit' });
}

function getLastSixMonthsBuckets(): readonly { label: string; start: Date; end: Date }[] {
  const buckets: { label: string; start: Date; end: Date }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
    buckets.push({ label: getMonthLabel(start), start, end });
  }
  return buckets;
}

// ---------------------------------------------------------------------------
// Interfaces for daily check-in data
// ---------------------------------------------------------------------------

interface DailyCheckin {
  readonly id: string;
  readonly userId: string;
  readonly dateStr: string;
  readonly moodScore: number;
  readonly createdAt: Timestamp;
}

// ---------------------------------------------------------------------------
// Overview Stat Card
// ---------------------------------------------------------------------------

interface OverviewStatProps {
  readonly label: string;
  readonly value: string | number;
  readonly subtitle?: string;
  readonly icon: React.ElementType;
  readonly iconBg: string;
}

function OverviewStatCard({ label, value, subtitle, icon: Icon, iconBg }: OverviewStatProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className={`h-11 w-11 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-stone-500">{label}</p>
            <p className="text-2xl font-bold text-stone-800 mt-0.5">{value}</p>
            {subtitle && (
              <p className="text-xs text-stone-400 mt-1">{subtitle}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// CSS Bar Chart for Member Growth
// ---------------------------------------------------------------------------

interface GrowthBar {
  readonly label: string;
  readonly count: number;
}

function MemberGrowthChart({ bars }: { readonly bars: readonly GrowthBar[] }) {
  const maxCount = Math.max(...bars.map((b) => b.count), 1);

  return (
    <div className="flex items-end gap-3 h-48 px-2">
      {bars.map((bar) => {
        const heightPct = maxCount > 0 ? (bar.count / maxCount) * 100 : 0;
        return (
          <div key={bar.label} className="flex-1 flex flex-col items-center gap-2">
            <span className="text-xs font-semibold text-stone-700">{bar.count}</span>
            <div className="w-full relative" style={{ height: '140px' }}>
              <div
                className="absolute bottom-0 left-0 right-0 bg-amber-500/80 rounded-t-md transition-all duration-500 hover:bg-amber-600/90"
                style={{ height: `${Math.max(heightPct, 2)}%` }}
              />
            </div>
            <span className="text-xs text-stone-500 font-medium">{bar.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lane Activity Mini Card
// ---------------------------------------------------------------------------

interface LaneActivityData {
  readonly laneName: string;
  readonly laneColor: string;
  readonly metrics: readonly { readonly label: string; readonly value: number }[];
}

function LaneActivityCard({ laneName, laneColor, metrics }: LaneActivityData) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className={`h-2.5 w-2.5 rounded-full ${laneColor}`} />
          <CardTitle className="text-sm">{laneName}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {metrics.map((m) => (
            <div key={m.label} className="flex items-center justify-between">
              <span className="text-xs text-stone-500">{m.label}</span>
              <span className="text-sm font-semibold text-stone-700">{m.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Activity Feed Item
// ---------------------------------------------------------------------------

type FeedItemKind = 'signup' | 'moderation' | 'crisis';

interface FeedItem {
  readonly id: string;
  readonly kind: FeedItemKind;
  readonly title: string;
  readonly description: string;
  readonly timestamp: string;
  readonly actionLabel: string;
  readonly actionPath: string;
}

const FEED_STYLE: Record<FeedItemKind, { icon: React.ElementType; badge: string }> = {
  signup: { icon: Users, badge: 'bg-blue-100 text-blue-700' },
  moderation: { icon: Shield, badge: 'bg-amber-100 text-amber-700' },
  crisis: { icon: AlertTriangle, badge: 'bg-red-100 text-red-700' },
};

function ActivityFeedRow({ item, onAction }: { readonly item: FeedItem; readonly onAction: (path: string) => void }) {
  const style = FEED_STYLE[item.kind];
  const Icon = style.icon;

  return (
    <div className="flex items-start gap-3 py-3 border-b border-stone-100 last:border-0">
      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${style.badge}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-stone-700">{item.title}</p>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {item.kind}
          </Badge>
        </div>
        <p className="text-xs text-stone-500 truncate mt-0.5">{item.description}</p>
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className="text-[10px] text-stone-400 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {item.timestamp}
        </span>
        <button
          type="button"
          onClick={() => onAction(item.actionPath)}
          className="text-[10px] font-medium text-amber-700 hover:text-amber-900 flex items-center gap-0.5"
        >
          {item.actionLabel}
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quick Action Button
// ---------------------------------------------------------------------------

interface QuickActionProps {
  readonly icon: React.ElementType;
  readonly label: string;
  readonly path: string;
  readonly onNavigate: (path: string) => void;
}

function QuickActionButton({ icon: Icon, label, path, onNavigate }: QuickActionProps) {
  return (
    <button
      type="button"
      onClick={() => onNavigate(path)}
      className="flex flex-col items-center gap-2 p-4 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 hover:border-amber-300 transition-all group"
    >
      <div className="h-10 w-10 rounded-lg bg-stone-100 group-hover:bg-amber-100 flex items-center justify-center transition-colors">
        <Icon className="h-5 w-5 text-stone-600 group-hover:text-amber-700 transition-colors" />
      </div>
      <span className="text-xs font-medium text-stone-600 group-hover:text-stone-800 text-center">
        {label}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Data computation helpers (pure functions, no mutation)
// ---------------------------------------------------------------------------

function computeGrowthBars(members: readonly User[]): readonly GrowthBar[] {
  const buckets = getLastSixMonthsBuckets();
  return buckets.map((bucket) => {
    const count = members.filter((m) => {
      const created = toDate(m.createdAt);
      return created !== null && created >= bucket.start && created <= bucket.end;
    }).length;
    return { label: bucket.label, count };
  });
}

function computeAverageMood(checkins: readonly DailyCheckin[]): string {
  if (checkins.length === 0) return '0.0';
  const total = checkins.reduce((sum, c) => sum + (c.moodScore ?? 0), 0);
  return (total / checkins.length).toFixed(1);
}

function computeLane1Metrics(
  goals: readonly Goal[],
  jobApps: readonly JobApplication[],
  members: readonly User[],
): readonly { label: string; value: number }[] {
  const activeGoals = goals.filter((g) => g.status === 'active').length;
  const resumeCompletions = members.filter(
    (m) => m.lanes.includes('lane1') && m.reentry?.enrollmentStatus === 'graduated',
  ).length;
  const totalApps = jobApps.length;

  return [
    { label: 'Active Goals', value: activeGoals },
    { label: 'Resume Completions', value: resumeCompletions },
    { label: 'Job Applications', value: totalApps },
  ];
}

function computeLane2Metrics(
  progress: readonly UserProgress[],
  journals: readonly JournalEntry[],
  members: readonly User[],
): readonly { label: string; value: number }[] {
  const stepsCompleted = progress.filter((p) => p.status === 'completed').length;
  const journalEntries = journals.length;
  const steppingMembers = members.filter((m) => m.stepExperience?.currentStep != null);
  const avgStep = steppingMembers.length > 0
    ? Math.round(steppingMembers.reduce((s, m) => s + (m.stepExperience?.currentStep ?? 0), 0) / steppingMembers.length)
    : 0;

  return [
    { label: 'Steps Completed', value: stepsCompleted },
    { label: 'Journal Entries', value: journalEntries },
    { label: 'Avg Current Step', value: avgStep },
  ];
}

function computeLane3Metrics(
  posts: readonly Post[],
  resources: readonly Resource[],
  members: readonly User[],
): readonly { label: string; value: number }[] {
  const totalPosts = posts.length;
  const storyPosts = posts.filter((p) => p.type === 'story').length;
  const resourcesAccessed = resources.length;

  return [
    { label: 'Posts', value: totalPosts },
    { label: 'Stories', value: storyPosts },
    { label: 'Resources', value: resourcesAccessed },
  ];
}

function buildActivityFeed(
  members: readonly User[],
  posts: readonly Post[],
  checkins: readonly DailyCheckin[],
): readonly FeedItem[] {
  const items: FeedItem[] = [];

  // Recent signups
  const recentMembers = [...members]
    .sort((a, b) => {
      const aDate = toDate(a.createdAt);
      const bDate = toDate(b.createdAt);
      if (!aDate || !bDate) return 0;
      return bDate.getTime() - aDate.getTime();
    })
    .slice(0, 5);

  recentMembers.forEach((m) => {
    items.push({
      id: `signup-${m.uid}`,
      kind: 'signup',
      title: 'New User Signup',
      description: m.displayName || m.email,
      timestamp: formatRelative(m.createdAt),
      actionLabel: 'View Profile',
      actionPath: `/members`,
    });
  });

  // Posts requiring moderation
  const pendingPosts = posts
    .filter((p) => p.moderationStatus === 'pending' || p.moderationStatus === 'flagged')
    .slice(0, 5);

  pendingPosts.forEach((p) => {
    items.push({
      id: `mod-${p.id}`,
      kind: 'moderation',
      title: p.moderationStatus === 'flagged' ? 'Flagged Post' : 'Pending Review',
      description: p.content.slice(0, 80),
      timestamp: formatRelative(p.createdAt),
      actionLabel: 'Review',
      actionPath: '/moderation',
    });
  });

  // Crisis detections from wellness check-ins
  const crisisCheckins = checkins
    .filter((c) => c.moodScore <= 2)
    .slice(0, 5);

  crisisCheckins.forEach((c) => {
    items.push({
      id: `crisis-${c.id}`,
      kind: 'crisis',
      title: 'Crisis Detection',
      description: `User reported mood score ${c.moodScore} on ${c.dateStr}`,
      timestamp: formatRelative(c.createdAt),
      actionLabel: 'Respond',
      actionPath: '/members',
    });
  });

  // Sort all by most recent, limit to 10
  return [...items].slice(0, 10);
}

// ---------------------------------------------------------------------------
// Main Dashboard Component
// ---------------------------------------------------------------------------

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const todayStr = useMemo(() => getTodayDateStr(), []);
  const sevenDaysAgoTimestamp = useMemo(() => Timestamp.fromDate(getSevenDaysAgo()), []);

  // ---- Firestore collections ----
  const { data: members, loading: membersLoading } = useCollection<User>('users');
  const { data: todayCheckins, loading: checkinsLoading } = useCollection<DailyCheckin>(
    'daily_checkins',
    where('dateStr', '==', todayStr),
  );
  const { data: recentPosts, loading: postsLoading } = useCollection<Post>(
    'posts',
    where('createdAt', '>=', sevenDaysAgoTimestamp),
  );
  const { data: recentCheckins } = useCollection<DailyCheckin>(
    'daily_checkins',
    orderBy('createdAt', 'desc'),
    limit(100),
  );
  const { data: goals } = useCollection<Goal>('goals');
  const { data: jobApps } = useCollection<JobApplication>('job_applications');
  const { data: progress } = useCollection<UserProgress>('user_progress');
  const { data: journals } = useCollection<JournalEntry>('journal_entries');
  const { data: allPosts } = useCollection<Post>('posts');
  const { data: resources } = useCollection<Resource>('resources');

  const loading = membersLoading || checkinsLoading || postsLoading;

  // ---- Computed values (immutable derivations) ----
  const totalMembers = members.length;
  const activeToday = todayCheckins.length;
  const postsThisWeek = recentPosts.length;
  const averageMood = useMemo(() => computeAverageMood(recentCheckins), [recentCheckins]);

  const growthBars = useMemo(() => computeGrowthBars(members), [members]);

  const lane1Metrics = useMemo(
    () => computeLane1Metrics(goals, jobApps, members),
    [goals, jobApps, members],
  );
  const lane2Metrics = useMemo(
    () => computeLane2Metrics(progress, journals, members),
    [progress, journals, members],
  );
  const lane3Metrics = useMemo(
    () => computeLane3Metrics(allPosts, resources, members),
    [allPosts, resources, members],
  );

  const activityFeed = useMemo(
    () => buildActivityFeed(members, allPosts, recentCheckins),
    [members, allPosts, recentCheckins],
  );

  // ---- Loading skeleton ----
  if (loading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <div className="h-8 w-56 bg-stone-200 rounded animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <div className="h-16 bg-stone-100 rounded animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="h-64 bg-stone-100 rounded-xl animate-pulse" />
        </div>
      </PageContainer>
    );
  }

  // ---- Render ----
  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-stone-800">
            Dashboard
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Welcome back{user?.profile?.firstName ? `, ${user.profile.firstName}` : ''}. Here is your platform overview.
          </p>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* 1. Overview Stats Row                                        */}
        {/* ------------------------------------------------------------ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <OverviewStatCard
            label="Total Members"
            value={totalMembers}
            subtitle="All registered users"
            icon={Users}
            iconBg="bg-amber-100 text-amber-700"
          />
          <OverviewStatCard
            label="Active Today"
            value={activeToday}
            subtitle="Check-ins recorded today"
            icon={Activity}
            iconBg="bg-green-100 text-green-700"
          />
          <OverviewStatCard
            label="Posts This Week"
            value={postsThisWeek}
            subtitle="Last 7 days"
            icon={FileText}
            iconBg="bg-blue-100 text-blue-700"
          />
          <OverviewStatCard
            label="Average Mood"
            value={averageMood}
            subtitle="From recent check-ins"
            icon={Heart}
            iconBg="bg-rose-100 text-rose-700"
          />
        </div>

        {/* ------------------------------------------------------------ */}
        {/* 2. Member Growth Chart                                       */}
        {/* ------------------------------------------------------------ */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-stone-500" />
              <CardTitle>Member Growth</CardTitle>
            </div>
            <CardDescription>New signups per month (last 6 months)</CardDescription>
          </CardHeader>
          <CardContent>
            {growthBars.every((b) => b.count === 0) ? (
              <p className="text-sm text-stone-400 text-center py-12">
                No signup data available yet.
              </p>
            ) : (
              <MemberGrowthChart bars={growthBars} />
            )}
          </CardContent>
        </Card>

        {/* ------------------------------------------------------------ */}
        {/* 3. Lane Activity                                             */}
        {/* ------------------------------------------------------------ */}
        <div>
          <h2 className="text-lg font-semibold text-stone-700 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-stone-400" />
            Lane Activity
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <LaneActivityCard
              laneName={LANE_NAMES.lane1}
              laneColor="bg-amber-500"
              metrics={lane1Metrics}
            />
            <LaneActivityCard
              laneName={LANE_NAMES.lane2}
              laneColor="bg-blue-500"
              metrics={lane2Metrics}
            />
            <LaneActivityCard
              laneName={LANE_NAMES.lane3}
              laneColor="bg-emerald-500"
              metrics={lane3Metrics}
            />
          </div>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* 4. Recent Activity Feed                                      */}
        {/* ------------------------------------------------------------ */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-stone-500" />
              <CardTitle>Recent Activity</CardTitle>
            </div>
            <CardDescription>Latest signups, moderation items, and crisis detections</CardDescription>
          </CardHeader>
          <CardContent>
            {activityFeed.length === 0 ? (
              <p className="text-sm text-stone-400 text-center py-8">
                No recent activity to display.
              </p>
            ) : (
              <div className="max-h-[400px] overflow-y-auto">
                {activityFeed.map((item) => (
                  <ActivityFeedRow
                    key={item.id}
                    item={item}
                    onAction={(path) => navigate(path)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ------------------------------------------------------------ */}
        {/* 5. Quick Actions                                             */}
        {/* ------------------------------------------------------------ */}
        <div>
          <h2 className="text-lg font-semibold text-stone-700 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <QuickActionButton
              icon={Shield}
              label="Review Moderation Queue"
              path="/moderation"
              onNavigate={navigate}
            />
            <QuickActionButton
              icon={Users}
              label="Manage Users"
              path="/members"
              onNavigate={navigate}
            />
            <QuickActionButton
              icon={BarChart3}
              label="View Reports"
              path="/reports"
              onNavigate={navigate}
            />
            <QuickActionButton
              icon={AlertTriangle}
              label="System Settings"
              path="/settings"
              onNavigate={navigate}
            />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
