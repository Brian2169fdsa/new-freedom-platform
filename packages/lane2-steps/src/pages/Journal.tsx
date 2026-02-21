import { useState, useMemo, useCallback } from 'react';
import {
  PageContainer,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Textarea,
  Input,
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
  useAuth,
  useCollection,
  toDate,
  formatDate,
  CRISIS_HOTLINE,
} from '@reprieve/shared';
import { where, orderBy, limit } from 'firebase/firestore';
import { setDocument } from '@reprieve/shared/services/firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import type { JournalEntry, MoodLevel } from '@reprieve/shared';
import {
  Plus,
  Calendar,
  Moon,
  Zap,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  Phone,
  MessageSquare,
  Heart,
} from 'lucide-react';

const MOOD_OPTIONS: { value: MoodLevel; emoji: string; label: string; score: number }[] = [
  { value: 'great', emoji: '\u{1F929}', label: 'Great', score: 5 },
  { value: 'good', emoji: '\u{1F60A}', label: 'Good', score: 4 },
  { value: 'okay', emoji: '\u{1F610}', label: 'Okay', score: 3 },
  { value: 'struggling', emoji: '\u{1F61F}', label: 'Struggling', score: 2 },
  { value: 'crisis', emoji: '\u{1F198}', label: 'In Crisis', score: 1 },
];

const GUIDED_PROMPTS: Record<number, string[]> = {
  1: ['What does honesty mean to me in my recovery?', 'When did I first admit I was powerless?', 'How has my life become unmanageable?'],
  2: ['What gives me hope today?', 'Can I believe that things can get better?', 'Who or what has been a source of hope for me?'],
  3: ['What does faith look like for me?', 'How do I practice letting go of control?', 'What does turning my will over mean in daily life?'],
  4: ['What patterns do I notice in my behavior?', 'What am I most afraid to look at honestly?', 'What strengths did I discover in my inventory?'],
  5: ['Who have I been honest with about my wrongs?', 'How did it feel to share with another person?', 'What integrity means to me now?'],
  6: ['Am I truly willing to change?', 'What character defects am I holding onto?', 'What would my life look like without these defects?'],
  7: ['What does humility look like for me today?', 'How do I practice asking for help?', 'What shortcomings am I ready to release?'],
  8: ['Who have I harmed in my addiction?', 'How do I feel about making amends?', 'What does brotherly love look like in action?'],
  9: ['What amends have I made so far?', 'How has making amends changed me?', 'Are there amends I am still avoiding?'],
  10: ['How do I take daily inventory?', 'When was the last time I promptly admitted a wrong?', 'What does perseverance mean in my recovery?'],
  11: ['How do I connect with my higher power?', 'What does my prayer or meditation practice look like?', 'How has my spiritual awareness grown?'],
  12: ['How can I be of service today?', 'How has my spiritual awakening changed me?', 'What message do I carry to others?'],
};

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-48 bg-stone-100 rounded-xl" />
      <div className="h-20 bg-stone-100 rounded-xl" />
      <div className="h-32 bg-stone-100 rounded-xl" />
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
        We care about you deeply. Please reach out to a trained counselor right now.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <a
          href={`tel:${CRISIS_HOTLINE.phone}`}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
        >
          <Phone className="h-4 w-4" /> Call {CRISIS_HOTLINE.phone} Now
        </a>
        <a
          href="sms:741741&body=HOME"
          className="flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200"
        >
          <MessageSquare className="h-4 w-4" /> {CRISIS_HOTLINE.text}
        </a>
      </div>
    </div>
  );
}

interface CheckInData {
  dateStr: string;
  moodScore: number;
  sleepHours?: number;
  cravingIntensity?: number;
}

function MoodHeatmap({ checkIns }: { checkIns: CheckInData[] }) {
  const days = useMemo(() => {
    const result: Array<{ date: string; day: string; score: number | null }> = [];
    const today = new Date();
    const checkInMap = new Map(checkIns.map((c) => [c.dateStr, c.moodScore]));
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayOfWeek = d.toLocaleDateString('en', { weekday: 'short' }).charAt(0);
      result.push({
        date: dateStr,
        day: dayOfWeek,
        score: checkInMap.get(dateStr) ?? null,
      });
    }
    return result;
  }, [checkIns]);

  const getColor = (score: number | null): string => {
    if (score === null) return 'bg-stone-100';
    if (score >= 5) return 'bg-green-400';
    if (score >= 4) return 'bg-lime-400';
    if (score >= 3) return 'bg-yellow-400';
    if (score >= 2) return 'bg-orange-400';
    return 'bg-red-400';
  };

  return (
    <div>
      <h4 className="text-sm font-medium text-stone-700 mb-2">Mood History (30 Days)</h4>
      <div className="flex flex-wrap gap-1">
        {days.map((d) => (
          <div
            key={d.date}
            className={`h-6 w-6 rounded-sm ${getColor(d.score)} transition-colors`}
            title={`${d.date}: ${d.score !== null ? `Mood ${d.score}/5` : 'No check-in'}`}
          />
        ))}
      </div>
      <div className="flex items-center gap-2 mt-2 text-xs text-stone-400">
        <span>Less</span>
        <div className="flex gap-0.5">
          <div className="h-3 w-3 rounded-sm bg-stone-100" />
          <div className="h-3 w-3 rounded-sm bg-red-400" />
          <div className="h-3 w-3 rounded-sm bg-orange-400" />
          <div className="h-3 w-3 rounded-sm bg-yellow-400" />
          <div className="h-3 w-3 rounded-sm bg-lime-400" />
          <div className="h-3 w-3 rounded-sm bg-green-400" />
        </div>
        <span>Better</span>
      </div>
    </div>
  );
}

interface TrendChartProps {
  data: Array<{ date: string; value: number }>;
  label: string;
  maxValue: number;
  color: string;
}

function TrendChart({ data, label, maxValue, color }: TrendChartProps) {
  if (data.length < 2) return null;
  const recent = data.slice(-14);
  const width = 100;
  const height = 40;
  const points = recent
    .map((d, i) => {
      const x = (i / (recent.length - 1)) * width;
      const y = height - (d.value / maxValue) * height;
      return `${x},${y}`;
    })
    .join(' ');
  const avg = recent.reduce((sum, d) => sum + d.value, 0) / recent.length;
  const trend = recent.length >= 2 ? recent[recent.length - 1].value - recent[0].value : 0;

  return (
    <div className="bg-stone-50 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-stone-600">{label}</span>
        <div className="flex items-center gap-1 text-xs">
          {trend > 0 ? (
            <TrendingUp className="h-3 w-3 text-green-600" />
          ) : trend < 0 ? (
            <TrendingDown className="h-3 w-3 text-red-500" />
          ) : null}
          <span className="text-stone-500">avg {avg.toFixed(1)}</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-10">
        <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
      </svg>
    </div>
  );
}

export default function Journal() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const currentStep = user?.stepExperience?.currentStep ?? 1;

  const [showEditor, setShowEditor] = useState(false);
  const [showCrisis, setShowCrisis] = useState(false);

  // Check-in state
  const [checkInMood, setCheckInMood] = useState<MoodLevel | null>(null);
  const [sleepHours, setSleepHours] = useState(7);
  const [energyLevel, setEnergyLevel] = useState(5);
  const [cravingIntensity, setCravingIntensity] = useState(3);
  const [checkInDone, setCheckInDone] = useState(false);
  const [checkInSubmitting, setCheckInSubmitting] = useState(false);

  // Journal editor state
  const [entryContent, setEntryContent] = useState('');
  const [entryMood, setEntryMood] = useState<MoodLevel>('okay');
  const [entryStep, setEntryStep] = useState<number>(currentStep);
  const [entryPrivate, setEntryPrivate] = useState(true);
  const [entryTags, setEntryTags] = useState('');
  const [entrySaving, setEntrySaving] = useState(false);

  // Fetch journal entries
  const { data: journalEntries, loading: entriesLoading } = useCollection<JournalEntry>(
    'journal_entries',
    where('userId', '==', uid ?? ''),
    orderBy('date', 'desc'),
    limit(50)
  );

  // Fetch check-ins for heatmap
  const todayStr = new Date().toISOString().slice(0, 10);
  const { data: todayCheckIns } = useCollection<JournalEntry>(
    'daily_checkins',
    where('userId', '==', uid ?? ''),
    where('dateStr', '==', todayStr)
  );
  const hasCheckedInToday = checkInDone || (todayCheckIns && todayCheckIns.length > 0);

  const { data: recentCheckIns } = useCollection<JournalEntry & CheckInData>(
    'daily_checkins',
    where('userId', '==', uid ?? ''),
    orderBy('date', 'desc'),
    limit(30)
  );

  // Mood heatmap data
  const heatmapData = useMemo((): CheckInData[] => {
    if (!recentCheckIns) return [];
    return recentCheckIns.map((c) => ({
      dateStr: (c as any).dateStr ?? '',
      moodScore: c.moodScore ?? 3,
      sleepHours: (c as any).sleepHours,
      cravingIntensity: (c as any).cravingIntensity,
    }));
  }, [recentCheckIns]);

  // Trend data
  const moodTrend = useMemo(() => {
    return heatmapData.map((c) => ({ date: c.dateStr, value: c.moodScore })).reverse();
  }, [heatmapData]);

  const sleepTrend = useMemo(() => {
    return heatmapData
      .filter((c) => c.sleepHours != null)
      .map((c) => ({ date: c.dateStr, value: c.sleepHours! }))
      .reverse();
  }, [heatmapData]);

  const cravingTrend = useMemo(() => {
    return heatmapData
      .filter((c) => c.cravingIntensity != null)
      .map((c) => ({ date: c.dateStr, value: c.cravingIntensity! }))
      .reverse();
  }, [heatmapData]);

  const handleCheckIn = useCallback(async () => {
    if (!checkInMood || !uid) return;
    setCheckInSubmitting(true);
    try {
      const docId = `${uid}_${todayStr}`;
      await setDocument('daily_checkins', docId, {
        userId: uid,
        dateStr: todayStr,
        date: Timestamp.now(),
        mood: checkInMood,
        moodScore: MOOD_OPTIONS.find((m) => m.value === checkInMood)?.score ?? 3,
        sleepHours,
        energyLevel,
        cravingIntensity,
        createdAt: Timestamp.now(),
      });
      setCheckInDone(true);
      if (checkInMood === 'crisis') setShowCrisis(true);
    } catch (err) {
      console.error('Failed to save check-in:', err);
    } finally {
      setCheckInSubmitting(false);
    }
  }, [checkInMood, uid, todayStr, sleepHours, energyLevel, cravingIntensity]);

  const handleSaveEntry = useCallback(async () => {
    if (!entryContent.trim() || !uid) return;
    setEntrySaving(true);
    try {
      const docId = `${uid}_${Date.now()}`;
      await setDocument('journal_entries', docId, {
        userId: uid,
        date: Timestamp.now(),
        mood: entryMood,
        moodScore: MOOD_OPTIONS.find((m) => m.value === entryMood)?.score ?? 3,
        content: entryContent.trim(),
        tags: entryTags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        isPrivate: entryPrivate,
        relatedStep: entryStep,
        createdAt: Timestamp.now(),
      });
      setShowEditor(false);
      setEntryContent('');
      setEntryTags('');
    } catch (err) {
      console.error('Failed to save journal entry:', err);
    } finally {
      setEntrySaving(false);
    }
  }, [entryContent, entryMood, entryStep, entryPrivate, entryTags, uid]);

  const prompts = GUIDED_PROMPTS[currentStep] ?? GUIDED_PROMPTS[1];

  if (entriesLoading) return <LoadingSkeleton />;

  return (
    <PageContainer
      title="Journal"
      subtitle="Reflect on your journey"
      action={
        <Button size="sm" onClick={() => setShowEditor(true)}>
          <Plus className="h-4 w-4 mr-1" /> New Entry
        </Button>
      }
    >
      {showCrisis && <CrisisAlert />}

      {/* Daily Check-in */}
      {!hasCheckedInToday && (
        <Card className="border-amber-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Daily Wellness Check-in</CardTitle>
              <Badge variant="warning">Today</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mood */}
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
                      ? 'bg-amber-100 border-2 border-amber-400'
                      : 'bg-stone-50 border-2 border-transparent hover:bg-stone-100'
                  }`}
                >
                  <span className="text-xl">{opt.emoji}</span>
                  <span className="text-[10px] text-stone-600">{opt.label}</span>
                </button>
              ))}
            </div>
            {/* Sleep */}
            <div className="flex items-center gap-3">
              <Moon className="h-4 w-4 text-indigo-500 shrink-0" />
              <input
                type="range"
                min={0}
                max={12}
                step={0.5}
                value={sleepHours}
                onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                className="flex-1 accent-amber-600"
              />
              <span className="text-sm font-medium text-stone-700 w-8">{sleepHours}h</span>
            </div>
            {/* Energy */}
            <div className="flex items-center gap-3">
              <Zap className="h-4 w-4 text-yellow-500 shrink-0" />
              <input
                type="range"
                min={0}
                max={10}
                value={energyLevel}
                onChange={(e) => setEnergyLevel(parseInt(e.target.value, 10))}
                className="flex-1 accent-amber-600"
              />
              <span className="text-sm font-medium text-stone-700 w-8">{energyLevel}</span>
            </div>
            {/* Cravings */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-stone-500 font-medium shrink-0 w-4">C</span>
              <input
                type="range"
                min={0}
                max={10}
                value={cravingIntensity}
                onChange={(e) => setCravingIntensity(parseInt(e.target.value, 10))}
                className="flex-1 accent-amber-600"
              />
              <span className="text-sm font-medium text-stone-700 w-8">{cravingIntensity}</span>
            </div>
            <Button onClick={handleCheckIn} disabled={!checkInMood || checkInSubmitting} className="w-full" size="sm">
              {checkInSubmitting ? 'Saving...' : 'Submit Check-in'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Mood Heatmap */}
      <Card>
        <CardContent className="p-4">
          <MoodHeatmap checkIns={heatmapData} />
        </CardContent>
      </Card>

      {/* Trend Charts */}
      {(moodTrend.length >= 2 || sleepTrend.length >= 2 || cravingTrend.length >= 2) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <TrendChart data={moodTrend} label="Mood" maxValue={5} color="#f59e0b" />
          <TrendChart data={sleepTrend} label="Sleep (hrs)" maxValue={12} color="#6366f1" />
          <TrendChart data={cravingTrend} label="Cravings" maxValue={10} color="#ef4444" />
        </div>
      )}

      {/* Journal Entries */}
      {journalEntries && journalEntries.length > 0 ? (
        <div className="space-y-3">
          {journalEntries.map((entry) => {
            const moodOpt = MOOD_OPTIONS.find((m) => m.value === entry.mood);
            return (
              <Card key={entry.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{moodOpt?.emoji ?? '\u{1F4DD}'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-stone-400">{formatDate(entry.date)}</span>
                        {entry.relatedStep && (
                          <Badge variant="secondary" className="text-[10px]">
                            Step {entry.relatedStep}
                          </Badge>
                        )}
                        {entry.isPrivate ? (
                          <EyeOff className="h-3 w-3 text-stone-300" />
                        ) : (
                          <Eye className="h-3 w-3 text-stone-400" />
                        )}
                      </div>
                      <p className="text-sm text-stone-700 mt-1 whitespace-pre-wrap line-clamp-4">
                        {entry.content}
                      </p>
                      {entry.tags && entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {entry.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="h-10 w-10 text-stone-300 mx-auto mb-2" />
            <p className="text-stone-500">Your journal is empty.</p>
            <p className="text-sm text-stone-400 mt-1">Start writing to track your thoughts and feelings.</p>
            <Button size="sm" className="mt-4" onClick={() => setShowEditor(true)}>
              <Plus className="h-4 w-4 mr-1" /> Write First Entry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* New Entry Dialog */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogHeader>
          <DialogTitle>New Journal Entry</DialogTitle>
        </DialogHeader>
        <DialogContent className="space-y-4">
          {/* Mood */}
          <div>
            <label className="text-sm font-medium text-stone-700 mb-2 block">How are you feeling?</label>
            <div className="flex gap-2">
              {MOOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setEntryMood(opt.value);
                    if (opt.value === 'crisis') setShowCrisis(true);
                  }}
                  className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg flex-1 ${
                    entryMood === opt.value
                      ? 'bg-amber-100 border-2 border-amber-400'
                      : 'bg-stone-50 border-2 border-transparent'
                  }`}
                >
                  <span className="text-lg">{opt.emoji}</span>
                  <span className="text-[9px] text-stone-500">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Guided Prompts */}
          <div>
            <label className="text-sm font-medium text-stone-700 mb-2 block">
              Guided Prompts (Step {currentStep})
            </label>
            <div className="space-y-1">
              {prompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => setEntryContent((prev) => (prev ? `${prev}\n\n${prompt}\n` : `${prompt}\n`))}
                  className="w-full text-left text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-2 rounded-lg transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <Textarea
            value={entryContent}
            onChange={(e) => setEntryContent(e.target.value)}
            placeholder="Write your thoughts here... (Markdown supported)"
            rows={6}
            className="resize-none"
          />

          {/* Step Selector */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-stone-700 shrink-0">Related Step</label>
            <select
              value={entryStep}
              onChange={(e) => setEntryStep(parseInt(e.target.value, 10))}
              className="flex-1 h-9 rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-700 focus:ring-2 focus:ring-amber-500"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  Step {n}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <Input
            value={entryTags}
            onChange={(e) => setEntryTags(e.target.value)}
            placeholder="Tags (comma separated): gratitude, progress, challenge"
          />

          {/* Privacy Toggle */}
          <button
            onClick={() => setEntryPrivate(!entryPrivate)}
            className="flex items-center gap-2 text-sm text-stone-600 hover:text-stone-800"
          >
            {entryPrivate ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {entryPrivate ? 'Private (only you)' : 'Shared with mentor'}
          </button>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowEditor(false)} size="sm">
            Cancel
          </Button>
          <Button onClick={handleSaveEntry} disabled={!entryContent.trim() || entrySaving} size="sm">
            {entrySaving ? 'Saving...' : 'Save Entry'}
          </Button>
        </DialogFooter>
      </Dialog>
    </PageContainer>
  );
}
