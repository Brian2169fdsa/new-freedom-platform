import { useState, useMemo } from 'react';
import { where, orderBy } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { useCollection } from '../../hooks/useFirestore';
import { cn } from '../../utils/cn';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { CalendarDays, TrendingUp, X } from 'lucide-react';

interface WellnessRecord {
  id: string;
  userId: string;
  dateStr: string;
  mood: number;
  cravingLevel: number;
  sleepQuality: 'poor' | 'fair' | 'good' | 'great';
  energyLevel: 'low' | 'medium' | 'high';
  gratitude: string;
  journalNote: string;
  safetyRating: number;
}

type TimeRange = 'week' | 'month';

const SLEEP_LABEL: Record<string, string> = {
  poor: 'Poor',
  fair: 'Fair',
  good: 'Good',
  great: 'Great',
};

const ENERGY_LABEL: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

function getMoodColor(mood: number): string {
  if (mood <= 3) return 'bg-red-400';
  if (mood <= 5) return 'bg-yellow-400';
  if (mood <= 7) return 'bg-lime-400';
  return 'bg-green-500';
}

function getMoodEmoji(mood: number): string {
  if (mood <= 2) return '\u{1F614}';
  if (mood <= 4) return '\u{1F610}';
  if (mood <= 6) return '\u{1F642}';
  if (mood <= 8) return '\u{1F60A}';
  return '\u{1F604}';
}

function getDateRange(range: TimeRange): { start: Date; days: number } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (range === 'week') {
    const start = new Date(today);
    start.setDate(start.getDate() - 6);
    return { start, days: 7 };
  }
  const start = new Date(today);
  start.setDate(start.getDate() - 29);
  return { start, days: 30 };
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDayLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

export function WellnessHistory() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [selectedRecord, setSelectedRecord] = useState<WellnessRecord | null>(null);

  const { data: records, loading } = useCollection<WellnessRecord>(
    'wellness_checkins',
    where('userId', '==', uid ?? ''),
    orderBy('dateStr', 'desc')
  );

  const { start, days } = getDateRange(timeRange);

  const recordsByDate = useMemo(() => {
    const map = new Map<string, WellnessRecord>();
    (records ?? []).forEach((r) => map.set(r.dateStr, r));
    return map;
  }, [records]);

  const gridDays = useMemo(() => {
    const result: { date: Date; dateStr: string; record: WellnessRecord | null }[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      result.push({ date: d, dateStr, record: recordsByDate.get(dateStr) ?? null });
    }
    return result;
  }, [start, days, recordsByDate]);

  const averages = useMemo(() => {
    const relevant = gridDays.filter((d) => d.record !== null).map((d) => d.record!);
    if (relevant.length === 0) return null;
    const avgMood = relevant.reduce((sum, r) => sum + r.mood, 0) / relevant.length;
    const avgCraving = relevant.reduce((sum, r) => sum + r.cravingLevel, 0) / relevant.length;
    const avgSafety = relevant.reduce((sum, r) => sum + r.safetyRating, 0) / relevant.length;
    const checkInRate = Math.round((relevant.length / days) * 100);
    return {
      mood: avgMood.toFixed(1),
      craving: avgCraving.toFixed(1),
      safety: avgSafety.toFixed(1),
      count: relevant.length,
      checkInRate,
    };
  }, [gridDays, days]);

  if (!user) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-blue-600" />
            Wellness History
          </CardTitle>
          <div className="flex gap-1">
            {(['week', 'month'] as const).map((range) => (
              <button
                key={range}
                onClick={() => {
                  setTimeRange(range);
                  setSelectedRecord(null);
                }}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-full transition-colors',
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                {range === 'week' ? '7 Days' : '30 Days'}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="h-16 bg-slate-100 rounded-lg animate-pulse" />
        ) : (
          <>
            {/* Heatmap Grid */}
            <div className={cn(
              'grid gap-1.5',
              timeRange === 'week' ? 'grid-cols-7' : 'grid-cols-10'
            )}>
              {gridDays.map(({ date, dateStr, record }) => {
                const isToday = dateStr === new Date().toISOString().slice(0, 10);
                const isSelected = selectedRecord?.dateStr === dateStr;
                return (
                  <button
                    key={dateStr}
                    onClick={() => record && setSelectedRecord(isSelected ? null : record)}
                    disabled={!record}
                    className={cn(
                      'aspect-square rounded-md flex flex-col items-center justify-center transition-all text-xs',
                      record
                        ? cn(getMoodColor(record.mood), 'hover:ring-2 hover:ring-blue-400 cursor-pointer text-white font-medium')
                        : 'bg-slate-100 text-slate-400',
                      isToday && 'ring-2 ring-blue-500',
                      isSelected && 'ring-2 ring-slate-800 scale-105'
                    )}
                    title={`${formatShortDate(date)}${record ? ` — Mood: ${record.mood}/10` : ' — No check-in'}`}
                  >
                    {timeRange === 'week' ? (
                      <>
                        <span className="text-[10px] leading-tight">{formatDayLabel(date)}</span>
                        <span className="text-xs font-bold">{date.getDate()}</span>
                      </>
                    ) : (
                      <span className="text-[10px] font-bold">{date.getDate()}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <span>Low</span>
              <div className="flex gap-0.5">
                <div className="w-3 h-3 rounded-sm bg-red-400" />
                <div className="w-3 h-3 rounded-sm bg-yellow-400" />
                <div className="w-3 h-3 rounded-sm bg-lime-400" />
                <div className="w-3 h-3 rounded-sm bg-green-500" />
              </div>
              <span>High Mood</span>
            </div>

            {/* Selected Day Detail */}
            {selectedRecord && (
              <div className="bg-slate-50 rounded-lg p-4 space-y-3 relative">
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{getMoodEmoji(selectedRecord.mood)}</span>
                  <div>
                    <p className="font-medium text-slate-800">
                      {formatShortDate(new Date(selectedRecord.dateStr + 'T00:00:00'))}
                    </p>
                    <p className="text-xs text-slate-500">Mood: {selectedRecord.mood}/10</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white rounded-lg p-2">
                    <p className="text-xs text-slate-500">Craving</p>
                    <p className="font-semibold text-slate-800">{selectedRecord.cravingLevel}/10</p>
                  </div>
                  <div className="bg-white rounded-lg p-2">
                    <p className="text-xs text-slate-500">Sleep</p>
                    <p className="font-semibold text-slate-800">
                      {SLEEP_LABEL[selectedRecord.sleepQuality] ?? selectedRecord.sleepQuality}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-2">
                    <p className="text-xs text-slate-500">Energy</p>
                    <p className="font-semibold text-slate-800">
                      {ENERGY_LABEL[selectedRecord.energyLevel] ?? selectedRecord.energyLevel}
                    </p>
                  </div>
                </div>
                {selectedRecord.gratitude && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-blue-700 font-medium mb-1">Grateful for:</p>
                    <p className="text-sm text-slate-700">{selectedRecord.gratitude}</p>
                  </div>
                )}
                {selectedRecord.journalNote && (
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-1">Journal note:</p>
                    <p className="text-sm text-slate-700">{selectedRecord.journalNote}</p>
                  </div>
                )}
              </div>
            )}

            {/* Averages Summary */}
            {averages && (
              <div className="border-t border-slate-100 pt-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
                  <span className="text-xs font-medium text-slate-600">
                    {timeRange === 'week' ? 'Weekly' : 'Monthly'} Averages
                  </span>
                  <Badge variant="secondary" className="ml-auto text-[10px]">
                    {averages.count} check-in{averages.count !== 1 ? 's' : ''} ({averages.checkInRate}%)
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-50 rounded-lg p-2">
                    <p className="text-xs text-slate-500">Avg Mood</p>
                    <p className="font-semibold text-slate-800">{averages.mood}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2">
                    <p className="text-xs text-slate-500">Avg Craving</p>
                    <p className="font-semibold text-slate-800">{averages.craving}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2">
                    <p className="text-xs text-slate-500">Avg Safety</p>
                    <p className="font-semibold text-slate-800">{averages.safety}</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
