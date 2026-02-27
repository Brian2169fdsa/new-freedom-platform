import { useState, useMemo } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
  Badge, Avatar, Button,
  useCollection,
  formatRelative,
  LANE_NAMES,
} from '@reprieve/shared';
import type { User, Post, Donation, Lane } from '@reprieve/shared';
import {
  Users, Briefcase, Shield, TrendingUp,
  UserPlus, CheckCircle, Flag, Heart,
  ArrowRight, FileBarChart, Ticket, RefreshCw,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

interface StatCardProps {
  readonly label: string;
  readonly value: string | number;
  readonly change?: string;
  readonly changeType?: 'positive' | 'negative' | 'neutral';
  readonly icon: React.ElementType;
  readonly iconBg: string;
}

function StatCard({ label, value, change, changeType = 'neutral', icon: Icon, iconBg }: StatCardProps) {
  const changeColor = changeType === 'positive'
    ? 'text-green-600'
    : changeType === 'negative'
      ? 'text-red-600'
      : 'text-slate-500';

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${iconBg}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-3xl font-bold text-slate-800">{value}</p>
            <p className="text-sm text-slate-500">{label}</p>
          </div>
          {change && (
            <span className={`text-xs font-medium ${changeColor}`}>{change}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Activity Feed Item
// ---------------------------------------------------------------------------

type ActivityType = 'new_member' | 'step_completed' | 'flagged_content' | 'donation';

interface ActivityItem {
  readonly id: string;
  readonly type: ActivityType;
  readonly title: string;
  readonly description: string;
  readonly time: string;
}

const ACTIVITY_ICON_MAP: Record<ActivityType, { icon: React.ElementType; color: string }> = {
  new_member: { icon: UserPlus, color: 'text-blue-600 bg-blue-100' },
  step_completed: { icon: CheckCircle, color: 'text-green-600 bg-green-100' },
  flagged_content: { icon: Flag, color: 'text-orange-600 bg-orange-100' },
  donation: { icon: Heart, color: 'text-pink-600 bg-pink-100' },
};

function ActivityFeedItem({ item }: { readonly item: ActivityItem }) {
  const { icon: Icon, color } = ACTIVITY_ICON_MAP[item.type];
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700">{item.title}</p>
        <p className="text-xs text-slate-500 truncate">{item.description}</p>
      </div>
      <span className="text-xs text-slate-400 whitespace-nowrap">{item.time}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lane Health Card
// ---------------------------------------------------------------------------

interface LaneHealthProps {
  readonly lane: Lane;
  readonly activeUsers: number;
  readonly totalUsers: number;
  readonly completionRate: number;
}

function LaneHealthCard({ lane, activeUsers, totalUsers, completionRate }: LaneHealthProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-slate-700">{LANE_NAMES[lane]}</p>
        <p className="text-xs text-slate-500">{activeUsers} active / {totalUsers} total</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all"
            style={{ width: `${Math.min(completionRate, 100)}%` }}
          />
        </div>
        <span className="text-xs font-medium text-slate-600 w-10 text-right">
          {completionRate}%
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Dashboard
// ---------------------------------------------------------------------------

function generateGrowthData(members: readonly User[]): readonly { date: string; count: number }[] {
  const now = new Date();
  const days: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    const before = members.filter((m) => {
      const created = m.createdAt?.toDate?.();
      return created && created <= d;
    }).length;
    days.push({ date: label, count: before });
  }
  return days;
}

function buildActivity(
  members: readonly User[],
  posts: readonly Post[],
  donations: readonly Donation[],
): readonly ActivityItem[] {
  const items: ActivityItem[] = [];

  members.slice(0, 5).forEach((m) => {
    items.push({
      id: `member-${m.uid}`,
      type: 'new_member',
      title: 'New Member',
      description: m.displayName,
      time: formatRelative(m.createdAt),
    });
  });

  posts
    .filter((p) => p.moderationStatus === 'flagged')
    .slice(0, 5)
    .forEach((p) => {
      items.push({
        id: `flag-${p.id}`,
        type: 'flagged_content',
        title: 'Flagged Content',
        description: p.content.slice(0, 80),
        time: formatRelative(p.createdAt),
      });
    });

  donations.slice(0, 5).forEach((d) => {
    items.push({
      id: `donation-${d.id}`,
      type: 'donation',
      title: 'Donation Received',
      description: `$${d.amount.toFixed(2)}`,
      time: formatRelative(d.createdAt),
    });
  });

  return items.slice(0, 10);
}

export default function AdminDashboard() {
  const { data: members, loading: membersLoading } = useCollection<User>('users');
  const { data: posts, loading: postsLoading } = useCollection<Post>('posts');
  const { data: donations } = useCollection<Donation>('donations');
  const [refreshKey, setRefreshKey] = useState(0);

  const loading = membersLoading || postsLoading;

  const totalMembers = members.length;
  const activeCases = members.filter(
    (m) => m.reentry?.enrollmentStatus === 'active',
  ).length;
  const pendingModeration = posts.filter(
    (p) => p.moderationStatus === 'pending',
  ).length;
  const employed = members.filter(
    (m) => m.lanes.includes('lane1') && m.reentry?.enrollmentStatus === 'active',
  );
  const employmentRate = totalMembers > 0
    ? Math.round((employed.length / totalMembers) * 100)
    : 0;

  const growthData = useMemo(() => generateGrowthData(members), [members, refreshKey]);

  const laneHealth: readonly LaneHealthProps[] = useMemo(() => {
    const lanes: Lane[] = ['lane1', 'lane2', 'lane3'];
    return lanes.map((lane) => {
      const total = members.filter((m) => m.lanes.includes(lane)).length;
      const active = members.filter(
        (m) => m.lanes.includes(lane) && m.reentry?.enrollmentStatus === 'active',
      ).length;
      const graduated = members.filter(
        (m) => m.lanes.includes(lane) && m.reentry?.enrollmentStatus === 'graduated',
      ).length;
      const rate = total > 0 ? Math.round((graduated / total) * 100) : 0;
      return { lane, activeUsers: active, totalUsers: total, completionRate: rate };
    });
  }, [members]);

  const activityFeed = useMemo(
    () => buildActivity(members, posts, donations),
    [members, posts, donations],
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-16 bg-slate-100 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 text-sm">Platform overview and key metrics</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setRefreshKey((k) => k + 1)}
        >
          <RefreshCw className="h-4 w-4 mr-1.5" />
          Refresh
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Members"
          value={totalMembers}
          icon={Users}
          iconBg="bg-blue-100 text-blue-700"
          change="+12 this week"
          changeType="positive"
        />
        <StatCard
          label="Active Cases"
          value={activeCases}
          icon={Briefcase}
          iconBg="bg-blue-100 text-blue-700"
        />
        <StatCard
          label="Pending Moderation"
          value={pendingModeration}
          icon={Shield}
          iconBg="bg-red-100 text-red-700"
          change={pendingModeration > 10 ? 'Needs attention' : undefined}
          changeType="negative"
        />
        <StatCard
          label="Employment Rate"
          value={`${employmentRate}%`}
          icon={TrendingUp}
          iconBg="bg-green-100 text-green-700"
        />
      </div>

      {/* Charts + Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Member Growth Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Member Growth</CardTitle>
            <CardDescription>Total members over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData as { date: string; count: number }[]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#a8a29e" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#a8a29e" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e7e5e4',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#2563eb"
                    fill="#dbeafe"
                    strokeWidth={2}
                    name="Members"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activityFeed.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No recent activity</p>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                {activityFeed.map((item) => (
                  <ActivityFeedItem key={item.id} item={item} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lane Health + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lane Health */}
        <Card>
          <CardHeader>
            <CardTitle>Lane Health</CardTitle>
            <CardDescription>Active users and completion rates per lane</CardDescription>
          </CardHeader>
          <CardContent>
            {laneHealth.map((lh) => (
              <LaneHealthCard key={lh.lane} {...lh} />
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <QuickAction
              icon={Shield}
              label="Review Flagged Content"
              description={`${pendingModeration} items pending review`}
              href="/moderation"
            />
            <QuickAction
              icon={FileBarChart}
              label="Generate Report"
              description="Create outcome or activity report"
              href="/reports"
            />
            <QuickAction
              icon={Ticket}
              label="Manage Invite Codes"
              description="Generate or deactivate access codes"
              href="/invite-codes"
            />
          </CardContent>
        </Card>
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
  readonly description: string;
  readonly href: string;
}

function QuickAction({ icon: Icon, label, description, href }: QuickActionProps) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors group"
    >
      <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
        <Icon className="h-5 w-5 text-slate-600 group-hover:text-blue-700" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600" />
    </a>
  );
}
