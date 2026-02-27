import { useState, useMemo } from 'react';
import {
  PageContainer,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Avatar,
  Input,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  useAuth,
  useCollection,
  toDate,
  formatDate,
} from '@reprieve/shared';
import { where, orderBy, limit } from 'firebase/firestore';
import { updateDocument } from '@reprieve/shared/services/firebase/firestore';
import type { UserProgress, Achievement, JournalEntry } from '@reprieve/shared';
import {
  Trophy,
  LogOut,
  Calendar,
  Flame,
  BarChart3,
  Award,
  BookOpen,
  Bell,
  Edit3,
  Save,
  Star,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const STEP_TITLES: Record<number, string> = {
  1: 'Honesty', 2: 'Hope', 3: 'Faith', 4: 'Courage',
  5: 'Integrity', 6: 'Willingness', 7: 'Humility', 8: 'Brotherly Love',
  9: 'Justice', 10: 'Perseverance', 11: 'Spiritual Awareness', 12: 'Service',
};

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-32 bg-slate-100 rounded-xl" />
      <div className="h-10 bg-slate-100 rounded-lg" />
      <div className="h-48 bg-slate-100 rounded-xl" />
    </div>
  );
}

export default function Profile() {
  const { user, signOut } = useAuth();
  const uid = user?.uid ?? null;
  const currentStep = user?.stepExperience?.currentStep ?? 1;

  const [activeTab, setActiveTab] = useState('progress');
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(user?.displayName ?? '');
  const [editSaving, setEditSaving] = useState(false);

  // Sobriety date
  const sobrietyDate = user?.profile?.sobrietyDate
    ? toDate(user.profile.sobrietyDate)
    : null;
  const sobrietyDays = useMemo(() => {
    if (!sobrietyDate) return null;
    return Math.max(0, Math.floor((Date.now() - sobrietyDate.getTime()) / 86400000));
  }, [sobrietyDate]);

  // Fetch progress
  const { data: progressData, loading: progressLoading } = useCollection<UserProgress>(
    'user_progress',
    where('userId', '==', uid ?? ''),
    where('status', '==', 'completed')
  );

  // Fetch achievements
  const { data: achievements, loading: achievementsLoading } = useCollection<Achievement>(
    'achievements',
    where('userId', '==', uid ?? ''),
    orderBy('earnedAt', 'desc')
  );

  // Fetch journal entries for stats
  const { data: journalEntries, loading: journalLoading } = useCollection<JournalEntry>(
    'journal_entries',
    where('userId', '==', uid ?? ''),
    orderBy('date', 'desc')
  );

  // Fetch check-ins for streak
  const { data: checkIns } = useCollection<{ dateStr: string; moodScore: number }>(
    'daily_checkins',
    where('userId', '==', uid ?? ''),
    orderBy('date', 'desc'),
    limit(365)
  );

  const stepsCompleted = useMemo(() => {
    if (!progressData) return 0;
    const completed = new Set<string>();
    progressData.forEach((p) => completed.add(p.courseId));
    return completed.size;
  }, [progressData]);

  // Journal stats
  const journalStats = useMemo(() => {
    if (!journalEntries) return { total: 0, avgMood: 0, longestStreak: 0 };
    const total = journalEntries.length;
    const avgMood = total > 0
      ? journalEntries.reduce((sum, e) => sum + (e.moodScore ?? 3), 0) / total
      : 0;

    let longestStreak = 0;
    let currentStreak = 0;
    let lastDate: string | null = null;

    const sorted = [...journalEntries].reverse();
    sorted.forEach((entry) => {
      const d = toDate(entry.date);
      if (!d) return;
      const dateStr = d.toISOString().slice(0, 10);
      if (lastDate) {
        const last = new Date(lastDate);
        const diff = Math.round((d.getTime() - last.getTime()) / 86400000);
        if (diff === 1) {
          currentStreak++;
        } else if (diff > 1) {
          longestStreak = Math.max(longestStreak, currentStreak);
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }
      lastDate = dateStr;
    });
    longestStreak = Math.max(longestStreak, currentStreak);

    return { total, avgMood, longestStreak };
  }, [journalEntries]);

  // Check-in streak
  const streakDays = useMemo(() => {
    if (!checkIns || checkIns.length === 0) return 0;
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dates = checkIns
      .map((c) => c.dateStr)
      .filter(Boolean);
    const uniqueDates = [...new Set(dates)].sort().reverse();
    const dayMs = 86400000;
    for (let i = 0; i < uniqueDates.length; i++) {
      const expected = new Date(today.getTime() - i * dayMs).toISOString().slice(0, 10);
      if (uniqueDates[i] === expected) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [checkIns]);

  const handleSaveProfile = async () => {
    if (!uid || !editName.trim()) return;
    setEditSaving(true);
    try {
      await updateDocument('users', uid, {
        displayName: editName.trim(),
      });
      setEditing(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setEditSaving(false);
    }
  };

  const isLoading = progressLoading || achievementsLoading || journalLoading;

  if (!user || isLoading) return <LoadingSkeleton />;

  const moodEmojis = ['\u{1F929}', '\u{1F60A}', '\u{1F610}', '\u{1F61F}', '\u{1F198}'];
  const avgMoodEmoji = journalStats.avgMood > 0
    ? moodEmojis[Math.max(0, Math.min(4, 5 - Math.round(journalStats.avgMood)))]
    : '\u{2014}';

  return (
    <PageContainer title="Profile">
      {/* Profile Header */}
      <Card className="bg-gradient-to-br from-blue-50 to-slate-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar
              src={user.photoURL}
              alt={user.displayName}
              size="lg"
            />
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Button size="sm" onClick={handleSaveProfile} disabled={editSaving}>
                    <Save className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-800 text-lg">
                    {user.displayName || 'Member'}
                  </h3>
                  <button onClick={() => { setEditing(true); setEditName(user.displayName ?? ''); }}>
                    <Edit3 className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600" />
                  </button>
                </div>
              )}
              <p className="text-sm text-slate-500">
                Step {currentStep}: {STEP_TITLES[currentStep] ?? `Step ${currentStep}`}
              </p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            {sobrietyDays !== null && (
              <div className="text-center">
                <Calendar className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                <p className="text-xl font-bold text-slate-800">{sobrietyDays}</p>
                <p className="text-[10px] text-slate-500">Days Sober</p>
              </div>
            )}
            <div className="text-center">
              <Flame className="h-4 w-4 text-orange-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-slate-800">{streakDays}</p>
              <p className="text-[10px] text-slate-500">Day Streak</p>
            </div>
            <div className="text-center">
              <Trophy className="h-4 w-4 text-yellow-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-slate-800">{achievements?.length ?? 0}</p>
              <p className="text-[10px] text-slate-500">Badges</p>
            </div>
          </div>

          {/* Step Progress Bar */}
          <div className="mt-5">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-500">{stepsCompleted} of 12 steps</span>
              <span className="font-medium text-blue-700">
                {Math.round((stepsCompleted / 12) * 100)}%
              </span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all"
                style={{ width: `${Math.round((stepsCompleted / 12) * 100)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-3 gap-1">
          <TabsTrigger value="progress" className="text-xs">
            <BarChart3 className="h-3.5 w-3.5 mr-1" /> Progress
          </TabsTrigger>
          <TabsTrigger value="achievements" className="text-xs">
            <Award className="h-3.5 w-3.5 mr-1" /> Badges
          </TabsTrigger>
          <TabsTrigger value="journal" className="text-xs">
            <BookOpen className="h-3.5 w-3.5 mr-1" /> Journal
          </TabsTrigger>
        </TabsList>

        {/* Progress Tab */}
        <TabsContent value="progress">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Course Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((stepNum) => {
                  const isComplete = stepNum < currentStep;
                  const isCurrent = stepNum === currentStep;
                  return (
                    <div key={stepNum} className="flex items-center gap-3">
                      <div
                        className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          isComplete
                            ? 'bg-green-100 text-green-700'
                            : isCurrent
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {stepNum}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium ${isComplete ? 'text-slate-400' : 'text-slate-700'}`}>
                          {STEP_TITLES[stepNum]}
                        </p>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isComplete ? 'bg-green-400' : isCurrent ? 'bg-blue-400' : 'bg-slate-200'
                            }`}
                            style={{ width: isComplete ? '100%' : isCurrent ? '50%' : '0%' }}
                          />
                        </div>
                      </div>
                      {isComplete && (
                        <Badge variant="success" className="text-[10px] shrink-0">Done</Badge>
                      )}
                      {isCurrent && (
                        <Badge className="text-[10px] shrink-0">Current</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Your Badges</CardTitle>
                <Link to="/achievements">
                  <Button variant="link" size="sm" className="text-xs">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {achievements && achievements.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                  {achievements.map((badge) => (
                    <div key={badge.id} className="flex flex-col items-center text-center">
                      <div
                        className={`h-14 w-14 rounded-full flex items-center justify-center mb-1.5 ${
                          badge.rank === 'platinum'
                            ? 'bg-gradient-to-br from-violet-100 to-purple-200'
                            : badge.rank === 'gold'
                              ? 'bg-gradient-to-br from-yellow-100 to-blue-200'
                              : badge.rank === 'silver'
                                ? 'bg-gradient-to-br from-slate-100 to-slate-200'
                                : 'bg-gradient-to-br from-orange-100 to-blue-100'
                        }`}
                      >
                        <span className="text-2xl">{badge.icon || '\u{1F3C6}'}</span>
                      </div>
                      <p className="text-[10px] font-medium text-slate-700 line-clamp-2">
                        {badge.title}
                      </p>
                      <p className="text-[9px] text-slate-400">
                        {formatDate(badge.earnedAt)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Star className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No badges earned yet.</p>
                  <p className="text-xs text-slate-400">Complete steps and maintain streaks!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Journal Stats Tab */}
        <TabsContent value="journal">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Journal Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center bg-slate-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-slate-800">{journalStats.total}</p>
                  <p className="text-[10px] text-slate-500">Total Entries</p>
                </div>
                <div className="text-center bg-slate-50 rounded-lg p-3">
                  <p className="text-2xl">{avgMoodEmoji}</p>
                  <p className="text-[10px] text-slate-500">
                    Avg Mood ({journalStats.avgMood.toFixed(1)})
                  </p>
                </div>
                <div className="text-center bg-slate-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-slate-800">{journalStats.longestStreak}</p>
                  <p className="text-[10px] text-slate-500">Best Streak</p>
                </div>
              </div>

              {journalEntries && journalEntries.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-600 mb-2">Recent Mood Trend</p>
                  <div className="flex items-end gap-1 h-16">
                    {journalEntries
                      .slice(0, 14)
                      .reverse()
                      .map((entry, i) => {
                        const score = entry.moodScore ?? 3;
                        const height = (score / 5) * 100;
                        const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-lime-400', 'bg-green-400'];
                        return (
                          <div
                            key={i}
                            className={`flex-1 rounded-t-sm ${colors[score - 1] ?? 'bg-slate-300'}`}
                            style={{ height: `${height}%` }}
                            title={`${formatDate(entry.date)}: ${score}/5`}
                          />
                        );
                      })}
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                    <span>14 entries ago</span>
                    <span>Latest</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Notification Preferences */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" /> Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { key: 'push', label: 'Push Notifications', desc: 'Daily reminders and updates' },
              { key: 'email', label: 'Email Notifications', desc: 'Weekly progress summaries' },
            ].map((pref) => {
              const isEnabled = user.settings?.notifications?.[pref.key as 'push' | 'email'] ?? true;
              return (
                <div key={pref.key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{pref.label}</p>
                    <p className="text-xs text-slate-400">{pref.desc}</p>
                  </div>
                  <button
                    onClick={async () => {
                      if (!uid) return;
                      await updateDocument('users', uid, {
                        [`settings.notifications.${pref.key}`]: !isEnabled,
                      });
                    }}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      isEnabled ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        isEnabled ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="space-y-2">
        <Link to="/achievements">
          <Button variant="outline" className="w-full justify-start">
            <Trophy className="h-4 w-4 mr-2" /> Achievements
          </Button>
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4 mr-2" /> Sign Out
        </Button>
      </div>
    </PageContainer>
  );
}
