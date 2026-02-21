import { useState, useMemo, useCallback } from 'react';
import {
  PageContainer,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
  Button,
  useAuth,
  useCollection,
  toDate,
  formatDate,
  MOOD_LABELS,
  CRISIS_HOTLINE,
} from '@reprieve/shared';
import { where, orderBy, limit } from 'firebase/firestore';
import { setDocument } from '@reprieve/shared/services/firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import type { UserProgress, JournalEntry, Achievement, MoodLevel } from '@reprieve/shared';
import {
  Flame,
  Trophy,
  BookOpen,
  ArrowRight,
  Moon,
  Zap,
  Calendar,
  Heart,
  Phone,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const MOOD_OPTIONS: { value: MoodLevel; emoji: string; label: string }[] = [
  { value: 'great', emoji: '\u{1F929}', label: 'Great' },
  { value: 'good', emoji: '\u{1F60A}', label: 'Good' },
  { value: 'okay', emoji: '\u{1F610}', label: 'Okay' },
  { value: 'struggling', emoji: '\u{1F61F}', label: 'Struggling' },
  { value: 'crisis', emoji: '\u{1F198}', label: 'In Crisis' },
];

const MOOD_SCORE_MAP: Record<MoodLevel, number> = {
  great: 5,
  good: 4,
  okay: 3,
  struggling: 2,
  crisis: 1,
};

const STEP_TITLES: Record<number, string> = {
  1: 'Honesty',
  2: 'Hope',
  3: 'Faith',
  4: 'Courage',
  5: 'Integrity',
  6: 'Willingness',
  7: 'Humility',
  8: 'Brotherly Love',
  9: 'Justice',
  10: 'Perseverance',
  11: 'Spiritual Awareness',
  12: 'Service',
};

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-24 bg-stone-100 rounded-xl" />
      <div className="h-40 bg-stone-100 rounded-xl" />
      <div className="h-32 bg-stone-100 rounded-xl" />
      <div className="h-20 bg-stone-100 rounded-xl" />
    </div>
  );
}

function CrisisAlert() {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Heart className="h-5 w-5 text-red-600" />
        <h3 className="font-semibold text-red-800">You are not alone</h3>
      </div>
      <p className="text-sm text-red-700">
        We care about you. If you are in crisis or having thoughts of self-harm,
        please reach out for immediate support.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <a
          href={`tel:${CRISIS_HOTLINE.phone}`}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
        >
          <Phone className="h-4 w-4" />
          Call {CRISIS_HOTLINE.phone} Now
        </a>
        <a
          href="sms:741741&body=HOME"
          className="flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200"
        >
          <MessageSquare className="h-4 w-4" />
          {CRISIS_HOTLINE.text}
        </a>
      </div>
    </div>
  );
}

export default function StepHome() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const currentStep = user?.stepExperience?.currentStep ?? 1;
  const sobrietyDate = user?.profile?.sobrietyDate
    ? toDate(user.profile.sobrietyDate)
    : null;

  const [checkInMood, setCheckInMood] = useState<MoodLevel | null>(null);
  const [sleepHours, setSleepHours] = useState(7);
  const [energyLevel, setEnergyLevel] = useState(5);
  const [cravingIntensity, setCravingIntensity] = useState(3);
  const [checkInSubmitting, setCheckInSubmitting] = useState(false);
  const [checkInDone, setCheckInDone] = useState(false);
  const [showCrisis, setShowCrisis] = useState(false);

  // Fetch progress data
  const { data: progressData, loading: progressLoading } = useCollection<UserProgress>(
    'user_progress',
    where('userId', '==', uid ?? ''),
    where('status', '==', 'completed')
  );

  // Fetch recent journal entries
  const { data: recentJournals, loading: journalsLoading } = useCollection<JournalEntry>(
    'journal_entries',
    where('userId', '==', uid ?? ''),
    orderBy('date', 'desc'),
    limit(3)
  );

  // Fetch achievements
  const { data: achievements, loading: achievementsLoading } = useCollection<Achievement>(
    'achievements',
    where('userId', '==', uid ?? ''),
    orderBy('earnedAt', 'desc'),
    limit(4)
  );

  // Today's check-in check
  const todayStr = new Date().toISOString().slice(0, 10);
  const { data: todayCheckIns } = useCollection<JournalEntry>(
    'daily_checkins',
    where('userId', '==', uid ?? ''),
    where('dateStr', '==', todayStr)
  );
  const hasCheckedInToday = checkInDone || (todayCheckIns && todayCheckIns.length > 0);

  // Compute streaks from check-ins
  const { data: allCheckIns } = useCollection<JournalEntry>(
    'daily_checkins',
    where('userId', '==', uid ?? ''),
    orderBy('date', 'desc'),
    limit(365)
  );

  const streakDays = useMemo(() => {
    if (!allCheckIns || allCheckIns.length === 0) return 0;
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkInDates = allCheckIns
      .map((c) => {
        const d = toDate(c.date);
        if (!d) return null;
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })
      .filter((d): d is number => d !== null);
    const uniqueDates = [...new Set(checkInDates)].sort((a, b) => b - a);
    const dayMs = 86400000;
    for (let i = 0; i < uniqueDates.length; i++) {
      const expected = today.getTime() - i * dayMs;
      if (uniqueDates[i] === expected) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [allCheckIns]);

  // Sobriety days counter
  const sobrietyDays = useMemo(() => {
    if (!sobrietyDate) return null;
    const diffMs = Date.now() - sobrietyDate.getTime();
    return Math.max(0, Math.floor(diffMs / 86400000));
  }, [sobrietyDate]);

  // Steps completed count
  const stepsCompleted = useMemo(() => {
    if (!progressData) return 0;
    const completedSteps = new Set<string>();
    progressData.forEach((p) => {
      if (p.status === 'completed') {
        completedSteps.add(p.courseId);
      }
    });
    return Math.min(completedSteps.size, 12);
  }, [progressData]);

  const overallProgress = Math.round((stepsCompleted / 12) * 100);
  const isLoading = progressLoading || journalsLoading || achievementsLoading;

  const handleCheckInSubmit = useCallback(async () => {
    if (!checkInMood || !uid) return;
    setCheckInSubmitting(true);
    try {
      const docId = `${uid}_${todayStr}`;
      await setDocument('daily_checkins', docId, {
        userId: uid,
        dateStr: todayStr,
        date: Timestamp.now(),
        mood: checkInMood,
        moodScore: MOOD_SCORE_MAP[checkInMood],
        sleepHours,
        energyLevel,
        cravingIntensity,
        createdAt: Timestamp.now(),
      });
      setCheckInDone(true);
      if (checkInMood === 'crisis') {
        setShowCrisis(true);
      }
    } catch (err) {
      console.error('Failed to save check-in:', err);
    } finally {
      setCheckInSubmitting(false);
    }
  }, [checkInMood, uid, todayStr, sleepHours, energyLevel, cravingIntensity]);

  if (!user) return <LoadingSkeleton />;
  if (isLoading) return <LoadingSkeleton />;

  const firstName = user.profile?.firstName || user.displayName?.split(' ')[0] || 'Friend';

  return (
    <PageContainer title={`Welcome back, ${firstName}`} subtitle="Your recovery journey">
      {/* Crisis Alert */}
      {showCrisis && <CrisisAlert />}

      {/* Sobriety Counter + Streak */}
      <div className="grid grid-cols-2 gap-3">
        {sobrietyDays !== null && (
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
            <CardContent className="p-4 text-center">
              <Calendar className="h-5 w-5 text-amber-600 mx-auto mb-1" />
              <p className="text-3xl font-bold text-amber-800">{sobrietyDays}</p>
              <p className="text-xs text-amber-600 font-medium">Days Sober</p>
            </CardContent>
          </Card>
        )}
        <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
          <CardContent className="p-4 text-center">
            <Flame className="h-5 w-5 text-orange-600 mx-auto mb-1" />
            <p className="text-3xl font-bold text-orange-800">{streakDays}</p>
            <p className="text-xs text-orange-600 font-medium">Day Streak</p>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Overall Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-stone-500">{stepsCompleted} of 12 steps completed</span>
            <span className="font-semibold text-amber-700">{overallProgress}%</span>
          </div>
          <div className="h-3 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Current Step Card */}
      <Card className="bg-gradient-to-br from-amber-50 via-white to-emerald-50 border-amber-300 shadow-md">
        <CardHeader>
          <Badge className="w-fit">Step {currentStep} of 12</Badge>
          <CardTitle className="text-xl">
            Step {currentStep}: {STEP_TITLES[currentStep] || `Step ${currentStep}`}
          </CardTitle>
          <CardDescription>
            Continue your journey through the {STEP_TITLES[currentStep]?.toLowerCase()} step
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/steps">
            <Button className="w-full sm:w-auto">
              Continue Learning <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Daily Wellness Check-in */}
      {!hasCheckedInToday && (
        <Card className="border-amber-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Daily Check-in</CardTitle>
              <Badge variant="warning">Today</Badge>
            </div>
            <CardDescription>How are you feeling right now?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Mood Selector */}
            <div>
              <label className="text-sm font-medium text-stone-700 mb-2 block">Mood</label>
              <div className="flex gap-2 justify-between">
                {MOOD_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setCheckInMood(opt.value);
                      if (opt.value === 'crisis') setShowCrisis(true);
                    }}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all flex-1 ${
                      checkInMood === opt.value
                        ? 'bg-amber-100 border-2 border-amber-400 shadow-sm'
                        : 'bg-stone-50 border-2 border-transparent hover:bg-stone-100'
                    }`}
                  >
                    <span className="text-2xl">{opt.emoji}</span>
                    <span className="text-[10px] text-stone-600 font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sleep Hours */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-stone-700 flex items-center gap-1.5">
                  <Moon className="h-4 w-4 text-indigo-500" /> Sleep
                </label>
                <span className="text-sm font-semibold text-stone-800">{sleepHours}h</span>
              </div>
              <input
                type="range"
                min={0}
                max={12}
                step={0.5}
                value={sleepHours}
                onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                className="w-full accent-amber-600"
              />
              <div className="flex justify-between text-xs text-stone-400 mt-1">
                <span>0h</span>
                <span>12h</span>
              </div>
            </div>

            {/* Energy Level */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-stone-700 flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-yellow-500" /> Energy
                </label>
                <span className="text-sm font-semibold text-stone-800">{energyLevel}/10</span>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                value={energyLevel}
                onChange={(e) => setEnergyLevel(parseInt(e.target.value, 10))}
                className="w-full accent-amber-600"
              />
            </div>

            {/* Craving Intensity */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-stone-700">Craving Intensity</label>
                <span className="text-sm font-semibold text-stone-800">{cravingIntensity}/10</span>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                value={cravingIntensity}
                onChange={(e) => setCravingIntensity(parseInt(e.target.value, 10))}
                className="w-full accent-amber-600"
              />
              <div className="flex justify-between text-xs text-stone-400 mt-1">
                <span>None</span>
                <span>Intense</span>
              </div>
            </div>

            <Button
              onClick={handleCheckInSubmit}
              disabled={!checkInMood || checkInSubmitting}
              className="w-full"
            >
              {checkInSubmitting ? 'Saving...' : 'Submit Check-in'}
            </Button>
          </CardContent>
        </Card>
      )}

      {hasCheckedInToday && !showCrisis && (
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <span className="text-lg">{'\u2705'}</span>
            </div>
            <div>
              <p className="font-medium text-emerald-800">Check-in complete!</p>
              <p className="text-xs text-emerald-600">Great job taking care of yourself today.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Journal Entries */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-amber-600" /> Recent Journal
            </CardTitle>
            <Link to="/journal" className="text-sm text-amber-700 hover:underline flex items-center gap-1">
              View All <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentJournals && recentJournals.length > 0 ? (
            <div className="space-y-3">
              {recentJournals.map((entry) => {
                const moodOpt = MOOD_OPTIONS.find((m) => m.value === entry.mood);
                return (
                  <div
                    key={entry.id}
                    className="flex items-start gap-3 p-3 bg-stone-50 rounded-lg"
                  >
                    <span className="text-lg">{moodOpt?.emoji ?? '\u{1F4DD}'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-stone-700 line-clamp-2">{entry.content}</p>
                      <p className="text-xs text-stone-400 mt-1">{formatDate(entry.date)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-stone-400 text-center py-4">
              No journal entries yet. Start writing to track your journey.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Achievement Badges */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-600" /> Recent Achievements
            </CardTitle>
            <Link to="/achievements" className="text-sm text-amber-700 hover:underline flex items-center gap-1">
              View All <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {achievements && achievements.length > 0 ? (
            <div className="grid grid-cols-4 gap-3">
              {achievements.map((badge) => (
                <div key={badge.id} className="flex flex-col items-center text-center">
                  <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center mb-1">
                    <span className="text-xl">{badge.icon || '\u{1F3C6}'}</span>
                  </div>
                  <p className="text-[10px] text-stone-600 font-medium line-clamp-2">
                    {badge.title}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-stone-400 text-center py-4">
              Complete steps and streaks to earn achievements!
            </p>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
