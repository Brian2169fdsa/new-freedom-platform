import { useState, useCallback } from 'react';
import { Timestamp } from 'firebase/firestore';
import { Flame, Heart, Phone, MessageSquare, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { setDocument } from '../../services/firebase/firestore';
import { useCollection } from '../../hooks/useFirestore';
import { where, orderBy, limit } from 'firebase/firestore';
import { CRISIS_HOTLINE } from '../../utils/constants';
import { cn } from '../../utils/cn';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';

type SleepQuality = 'poor' | 'fair' | 'good' | 'great';
type EnergyLevel = 'low' | 'medium' | 'high';

interface WellnessCheckInData {
  id?: string;
  userId: string;
  dateStr: string;
  date: Timestamp;
  mood: number;
  cravingLevel: number;
  sleepQuality: SleepQuality;
  energyLevel: EnergyLevel;
  gratitude: string;
  journalNote: string;
  safetyRating: number;
  createdAt: Timestamp;
}

const MOOD_EMOJIS = [
  { min: 1, max: 2, emoji: '\u{1F614}', label: 'Struggling' },
  { min: 3, max: 4, emoji: '\u{1F610}', label: 'Low' },
  { min: 5, max: 6, emoji: '\u{1F642}', label: 'Okay' },
  { min: 7, max: 8, emoji: '\u{1F60A}', label: 'Good' },
  { min: 9, max: 10, emoji: '\u{1F604}', label: 'Great' },
];

const SLEEP_OPTIONS: { value: SleepQuality; label: string }[] = [
  { value: 'poor', label: 'Poor' },
  { value: 'fair', label: 'Fair' },
  { value: 'good', label: 'Good' },
  { value: 'great', label: 'Great' },
];

const ENERGY_OPTIONS: { value: EnergyLevel; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const SAFETY_LABELS = ['', 'Very Unsafe', 'Unsafe', 'Neutral', 'Safe', 'Very Safe'];

function getMoodEmoji(value: number): string {
  const match = MOOD_EMOJIS.find((m) => value >= m.min && value <= m.max);
  return match?.emoji ?? '\u{1F642}';
}

function getCravingColor(value: number): string {
  if (value <= 3) return 'text-green-600';
  if (value <= 6) return 'text-yellow-600';
  return 'text-red-600';
}

function getCravingBg(value: number): string {
  if (value <= 3) return 'from-green-400 to-green-500';
  if (value <= 6) return 'from-yellow-400 to-orange-500';
  return 'from-orange-500 to-red-600';
}

function getEncouragingMessage(mood: number, safety: number): string {
  if (safety <= 2) {
    return 'Thank you for being honest. You are not alone — please reach out for support.';
  }
  if (mood >= 8) {
    return 'Amazing! Your positive energy is a gift. Keep shining today!';
  }
  if (mood >= 5) {
    return 'Every day is a step forward. You are doing great work on your journey.';
  }
  return 'Tough days build strength. You showed courage by checking in today.';
}

function useStreakCount(uid: string | null): number {
  const { data: allCheckIns } = useCollection<WellnessCheckInData>(
    'wellness_checkins',
    where('userId', '==', uid ?? ''),
    orderBy('date', 'desc'),
    limit(365)
  );

  if (!allCheckIns || allCheckIns.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayMs = 86400000;

  const uniqueDates = [
    ...new Set(
      allCheckIns
        .map((c) => {
          const d = c.date?.toDate?.() ?? new Date(c.date as unknown as string);
          d.setHours(0, 0, 0, 0);
          return d.getTime();
        })
        .filter((d) => !isNaN(d))
    ),
  ].sort((a, b) => b - a);

  for (let i = 0; i < uniqueDates.length; i++) {
    const expected = today.getTime() - i * dayMs;
    if (uniqueDates[i] === expected) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export function WellnessCheckIn() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const todayStr = new Date().toISOString().slice(0, 10);
  const streakDays = useStreakCount(uid);

  const { data: todayCheckIns } = useCollection<WellnessCheckInData>(
    'wellness_checkins',
    where('userId', '==', uid ?? ''),
    where('dateStr', '==', todayStr)
  );
  const alreadyCheckedIn = todayCheckIns && todayCheckIns.length > 0;

  const [mood, setMood] = useState(5);
  const [cravingLevel, setCravingLevel] = useState(0);
  const [sleepQuality, setSleepQuality] = useState<SleepQuality | null>(null);
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel | null>(null);
  const [gratitude, setGratitude] = useState('');
  const [journalNote, setJournalNote] = useState('');
  const [safetyRating, setSafetyRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = sleepQuality !== null && energyLevel !== null && safetyRating > 0 && !submitting;

  const handleSubmit = useCallback(async () => {
    if (!uid || !canSubmit) return;
    setSubmitting(true);
    try {
      const docId = `${uid}_${todayStr}`;
      await setDocument('wellness_checkins', docId, {
        userId: uid,
        dateStr: todayStr,
        date: Timestamp.now(),
        mood,
        cravingLevel,
        sleepQuality,
        energyLevel,
        gratitude: gratitude.trim(),
        journalNote: journalNote.trim(),
        safetyRating,
        createdAt: Timestamp.now(),
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to save wellness check-in:', err);
    } finally {
      setSubmitting(false);
    }
  }, [uid, canSubmit, todayStr, mood, cravingLevel, sleepQuality, energyLevel, gratitude, journalNote, safetyRating]);

  if (!user) return null;

  // Already submitted — show confirmation
  if (submitted || alreadyCheckedIn) {
    const showCrisis = submitted && safetyRating <= 2;
    return (
      <Card className="border-blue-200 overflow-hidden">
        {showCrisis && (
          <div className="bg-red-50 border-b border-red-200 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-600" />
              <h3 className="font-semibold text-red-800">You are not alone</h3>
            </div>
            <p className="text-sm text-red-700">
              We care about you. Please reach out for immediate support.
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
        )}
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
              <Sparkles className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-emerald-800">Check-in complete!</p>
              <p className="text-sm text-slate-600 mt-0.5">
                {submitted
                  ? getEncouragingMessage(mood, safetyRating)
                  : 'Great job taking care of yourself today.'}
              </p>
            </div>
          </div>
          {streakDays > 0 && (
            <div className="mt-3 flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium text-blue-800">
                {streakDays} day streak!
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Daily Wellness Check-in</CardTitle>
          <div className="flex items-center gap-2">
            {streakDays > 0 && (
              <Badge>
                <Flame className="h-3 w-3 mr-1 inline" />
                {streakDays} day streak
              </Badge>
            )}
            <Badge variant="warning">Today</Badge>
          </div>
        </div>
        <CardDescription>Take a moment to reflect on how you are doing.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Mood Slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-700">Mood</label>
            <span className="text-lg">{getMoodEmoji(mood)} <span className="text-sm text-slate-600">{mood}/10</span></span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={mood}
            onChange={(e) => setMood(parseInt(e.target.value, 10))}
            className="w-full accent-blue-600"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>{'\u{1F614}'} Struggling</span>
            <span>Great {'\u{1F604}'}</span>
          </div>
        </div>

        {/* Craving Level */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-700">Craving Level</label>
            <span className={cn('text-sm font-semibold', getCravingColor(cravingLevel))}>
              {cravingLevel}/10
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={10}
            value={cravingLevel}
            onChange={(e) => setCravingLevel(parseInt(e.target.value, 10))}
            className="w-full accent-blue-600"
          />
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-green-600">None</span>
            <div className={cn('h-1.5 flex-1 mx-2 rounded-full bg-gradient-to-r', getCravingBg(cravingLevel))} />
            <span className="text-xs text-red-600">Intense</span>
          </div>
        </div>

        {/* Sleep Quality */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Sleep Quality</label>
          <div className="grid grid-cols-4 gap-2">
            {SLEEP_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSleepQuality(opt.value)}
                className={cn(
                  'py-2 rounded-lg text-sm font-medium transition-all',
                  sleepQuality === opt.value
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Energy Level */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Energy Level</label>
          <div className="grid grid-cols-3 gap-2">
            {ENERGY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setEnergyLevel(opt.value)}
                className={cn(
                  'py-2 rounded-lg text-sm font-medium transition-all',
                  energyLevel === opt.value
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Gratitude Prompt */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            One thing I am grateful for today
          </label>
          <Input
            value={gratitude}
            onChange={(e) => setGratitude(e.target.value)}
            placeholder="e.g., A supportive friend, a sunny morning..."
            maxLength={200}
          />
        </div>

        {/* Safety Rating */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            How safe do you feel?
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((val) => (
              <button
                key={val}
                onClick={() => setSafetyRating(val)}
                className={cn(
                  'flex-1 py-2 rounded-lg text-sm font-medium transition-all',
                  safetyRating === val
                    ? val <= 2
                      ? 'bg-red-600 text-white shadow-sm'
                      : val === 3
                        ? 'bg-yellow-500 text-white shadow-sm'
                        : 'bg-green-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                {val}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>Very Unsafe</span>
            <span>Very Safe</span>
          </div>
          {safetyRating > 0 && (
            <p className="text-xs text-slate-500 mt-1 text-center">
              {SAFETY_LABELS[safetyRating]}
            </p>
          )}
        </div>

        {/* Journal Note */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            Journal note <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <Textarea
            value={journalNote}
            onChange={(e) => setJournalNote(e.target.value)}
            placeholder="Anything on your mind today..."
            rows={3}
            maxLength={1000}
          />
        </div>

        {/* Submit */}
        <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full">
          {submitting ? 'Saving...' : 'Submit Check-in'}
        </Button>
      </CardContent>
    </Card>
  );
}
