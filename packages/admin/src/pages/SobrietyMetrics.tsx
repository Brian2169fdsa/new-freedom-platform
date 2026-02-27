import { useState, useMemo } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
  Badge, Button,
  useCollection,
  toDate,
  formatRelative,
  MOOD_LABELS,
  MOOD_COLORS,
} from '@reprieve/shared';
import type { User, JournalEntry } from '@reprieve/shared';
import { where, orderBy } from 'firebase/firestore';
import {
  Heart, TrendingUp, ShieldCheck, AlertTriangle,
  Award, Users, Clock, RefreshCw,
} from 'lucide-react';
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
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
      : 'text-stone-500';

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${iconBg}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-3xl font-bold text-stone-800">{value}</p>
            <p className="text-sm text-stone-500">{label}</p>
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
// Milestone helpers
// ---------------------------------------------------------------------------

const MILESTONE_THRESHOLDS = [30, 60, 90, 180, 365] as const;

const MILESTONE_COLORS: Record<number, string> = {
  30: '#f97316',
  60: '#3b82f6',
  90: '#8b5cf6',
  180: '#22c55e',
  365: '#b45309',
};

function daysSobriety(sobrietyDate: unknown): number | null {
  const d = toDate(sobrietyDate as any);
  if (!d) return null;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

// ---------------------------------------------------------------------------
// Mood score mapping
// ---------------------------------------------------------------------------

const MOOD_SCORE: Record<string, number> = {
  great: 5,
  good: 4,
  okay: 3,
  struggling: 2,
  crisis: 1,
};

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function SobrietyMetrics() {
  const { data: members, loading: membersLoading } = useCollection<User>('users');
  const { data: checkins, loading: checkinsLoading } = useCollection<JournalEntry>(
    'daily_checkins',
    orderBy('date', 'desc'),
  );

  const loading = membersLoading || checkinsLoading;

  // Members with sobriety dates
  const recoveryMembers = useMemo(
    () => members.filter((m) => m.profile?.sobrietyDate),
    [members],
  );

  const activeInRecovery = recoveryMembers.length;

  // Average sobriety length in days
  const avgSobrietyDays = useMemo(() => {
    const days = recoveryMembers
      .map((m) => daysSobriety(m.profile?.sobrietyDate))
      .filter((d): d is number => d !== null && d >= 0);
    if (days.length === 0) return 0;
    return Math.round(days.reduce((a, b) => a + b, 0) / days.length);
  }, [recoveryMembers]);

  // Members at 90+ days
  const at90Plus = useMemo(
    () => recoveryMembers.filter((m) => {
      const d = daysSobriety(m.profile?.sobrietyDate);
      return d !== null && d >= 90;
    }).length,
    [recoveryMembers],
  );

  // Crisis interventions this month
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
  const crisisThisMonth = useMemo(
    () => checkins.filter((c) => {
      const date = toDate(c.date);
      return date && date >= thirtyDaysAgo && c.mood === 'crisis';
    }).length,
    [checkins],
  );

  // Milestone distribution
  const milestoneDistribution = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const t of MILESTONE_THRESHOLDS) counts[t] = 0;

    for (const m of recoveryMembers) {
      const d = daysSobriety(m.profile?.sobrietyDate);
      if (d === null || d < 0) continue;
      for (const t of MILESTONE_THRESHOLDS) {
        if (d >= t) counts[t]++;
      }
    }

    return MILESTONE_THRESHOLDS.map((t) => ({
      milestone: `${t}+ days`,
      count: counts[t],
      fill: MILESTONE_COLORS[t],
    }));
  }, [recoveryMembers]);

  // Recent milestones (members who just crossed a threshold in the last 7 days)
  const recentMilestones = useMemo(() => {
    const results: { name: string; days: number; milestone: number }[] = [];
    for (const m of recoveryMembers) {
      const d = daysSobriety(m.profile?.sobrietyDate);
      if (d === null) continue;
      for (const t of MILESTONE_THRESHOLDS) {
        if (d >= t && d < t + 7) {
          results.push({ name: m.displayName, days: d, milestone: t });
        }
      }
    }
    return results.sort((a, b) => b.milestone - a.milestone).slice(0, 10);
  }, [recoveryMembers]);

  // Wellness trend (last 14 days avg mood)
  const wellnessTrend = useMemo(() => {
    const days: { date: string; avg: number; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
      const label = `${d.getMonth() + 1}/${d.getDate()}`;

      const dayCheckins = checkins.filter((c) => {
        const cd = toDate(c.date);
        return cd && cd >= dayStart && cd < dayEnd;
      });

      const scores = dayCheckins
        .map((c) => MOOD_SCORE[c.mood] ?? 3)
        .filter((s) => s > 0);

      const avg = scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
        : 0;

      days.push({ date: label, avg, count: scores.length });
    }
    return days;
  }, [checkins]);

  // Declining wellness alerts: members whose recent mood is trending down
  const declineAlerts = useMemo(() => {
    const memberCheckins = new Map<string, JournalEntry[]>();
    for (const c of checkins) {
      const arr = memberCheckins.get(c.userId) ?? [];
      arr.push(c);
      memberCheckins.set(c.userId, arr);
    }

    const alerts: { userId: string; name: string; recentMood: string; trend: string }[] = [];

    for (const m of members) {
      const entries = memberCheckins.get(m.uid);
      if (!entries || entries.length < 3) continue;

      // Take last 5 entries sorted by date
      const sorted = [...entries]
        .sort((a, b) => {
          const da = toDate(a.date)?.getTime() ?? 0;
          const db = toDate(b.date)?.getTime() ?? 0;
          return db - da;
        })
        .slice(0, 5);

      const scores = sorted.map((e) => MOOD_SCORE[e.mood] ?? 3);
      if (scores.length < 3) continue;

      // Check if trending down: first half avg > second half avg by threshold
      const recent = scores.slice(0, Math.floor(scores.length / 2));
      const older = scores.slice(Math.floor(scores.length / 2));
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

      if (recentAvg < olderAvg - 0.8 && recentAvg <= 2.5) {
        alerts.push({
          userId: m.uid,
          name: m.displayName,
          recentMood: sorted[0]?.mood ?? 'unknown',
          trend: `Avg ${recentAvg.toFixed(1)} (was ${olderAvg.toFixed(1)})`,
        });
      }
    }

    return alerts.slice(0, 10);
  }, [members, checkins]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-stone-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><div className="h-16 bg-stone-100 rounded animate-pulse" /></CardContent></Card>
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
          <h1 className="text-2xl font-bold text-stone-800">Sobriety Metrics</h1>
          <p className="text-stone-500 text-sm">Recovery progress and wellness tracking</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active in Recovery"
          value={activeInRecovery}
          icon={Heart}
          iconBg="bg-green-100 text-green-700"
        />
        <StatCard
          label="Avg Sobriety Length"
          value={`${avgSobrietyDays}d`}
          icon={Clock}
          iconBg="bg-blue-100 text-blue-700"
        />
        <StatCard
          label="Members at 90+ Days"
          value={at90Plus}
          icon={ShieldCheck}
          iconBg="bg-amber-100 text-amber-700"
          change={activeInRecovery > 0 ? `${Math.round((at90Plus / activeInRecovery) * 100)}%` : undefined}
          changeType="positive"
        />
        <StatCard
          label="Crisis Interventions (30d)"
          value={crisisThisMonth}
          icon={AlertTriangle}
          iconBg="bg-red-100 text-red-700"
          change={crisisThisMonth > 5 ? 'Elevated' : undefined}
          changeType={crisisThisMonth > 5 ? 'negative' : 'neutral'}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Milestone Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Milestone Distribution</CardTitle>
            <CardDescription>Members reaching sobriety milestones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={milestoneDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis dataKey="milestone" tick={{ fontSize: 11 }} stroke="#a8a29e" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#a8a29e" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e7e5e4',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  />
                  <Bar dataKey="count" name="Members" radius={[4, 4, 0, 0]}>
                    {milestoneDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Wellness Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Wellness Trend</CardTitle>
            <CardDescription>Average daily mood score (1-5) over 14 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={wellnessTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#a8a29e" />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} stroke="#a8a29e" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e7e5e4',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                    formatter={(value: number) => [value.toFixed(1), 'Avg Mood']}
                  />
                  <Area
                    type="monotone"
                    dataKey="avg"
                    stroke="#b45309"
                    fill="#fef3c7"
                    strokeWidth={2}
                    name="Avg Mood"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Milestones */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Milestones</CardTitle>
            <CardDescription>Members who reached a milestone in the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {recentMilestones.length === 0 ? (
              <p className="text-sm text-stone-400 text-center py-8">No recent milestones</p>
            ) : (
              <div className="space-y-0">
                {recentMilestones.map((m, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-stone-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                        <Award className="h-4 w-4 text-amber-700" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-stone-700">{m.name}</p>
                        <p className="text-xs text-stone-500">{m.days} days sober</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{m.milestone}+ days</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Decline Alerts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Wellness Alerts</CardTitle>
                <CardDescription>Members showing declining mood patterns</CardDescription>
              </div>
              {declineAlerts.length > 0 && (
                <Badge variant="destructive">{declineAlerts.length} alert{declineAlerts.length !== 1 ? 's' : ''}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {declineAlerts.length === 0 ? (
              <div className="text-center py-8">
                <ShieldCheck className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <p className="text-sm text-stone-500">No wellness alerts at this time</p>
              </div>
            ) : (
              <div className="space-y-0">
                {declineAlerts.map((a) => (
                  <div key={a.userId} className="flex items-center justify-between py-3 border-b border-stone-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-stone-700">{a.name}</p>
                        <p className="text-xs text-stone-500">
                          Recent mood: {MOOD_LABELS[a.recentMood] ?? a.recentMood}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-stone-500">{a.trend}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
