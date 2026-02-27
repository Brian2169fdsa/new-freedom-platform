import React, { useState } from 'react';
import { useCollection } from '@reprieve/shared';
import { where, orderBy } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import {
  Calendar, Clock, MapPin, Users, ChevronRight, Filter,
  Heart, Coffee, BookOpen, Dumbbell, Music, Mic,
} from 'lucide-react';

type EventCategory = 'meeting' | 'workshop' | 'social' | 'wellness' | 'support' | 'other';

interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  dateTime: Timestamp;
  endTime?: Timestamp;
  location: string;
  isVirtual: boolean;
  virtualLink?: string;
  organizer: string;
  attendeeCount: number;
  maxAttendees?: number;
  isRecurring: boolean;
  recurringSchedule?: string;
}

const CATEGORY_CONFIG: Record<EventCategory, { label: string; icon: React.ReactNode; color: string }> = {
  meeting: { label: 'Meeting', icon: <Users className="h-4 w-4" />, color: 'bg-blue-50 text-blue-600' },
  workshop: { label: 'Workshop', icon: <BookOpen className="h-4 w-4" />, color: 'bg-purple-50 text-purple-600' },
  social: { label: 'Social', icon: <Coffee className="h-4 w-4" />, color: 'bg-blue-50 text-blue-600' },
  wellness: { label: 'Wellness', icon: <Dumbbell className="h-4 w-4" />, color: 'bg-green-50 text-green-600' },
  support: { label: 'Support', icon: <Heart className="h-4 w-4" />, color: 'bg-red-50 text-red-600' },
  other: { label: 'Other', icon: <Music className="h-4 w-4" />, color: 'bg-slate-50 text-slate-600' },
};

/** Safely convert Timestamp-like objects, Dates, or strings to a native Date. */
function toNativeDate(ts: unknown): Date {
  if (ts instanceof Date) return ts;
  if (typeof ts === 'string') return new Date(ts);
  if (ts && typeof (ts as any).toDate === 'function')
    return (ts as any).toDate();
  return new Date(ts as number);
}

function formatEventDate(timestamp: unknown): string {
  const date = toNativeDate(timestamp);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday = date.toDateString() === now.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  if (isToday) return 'Today';
  if (isTomorrow) return 'Tomorrow';

  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(timestamp: unknown): string {
  return toNativeDate(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function EventCard({ event }: { event: CommunityEvent }) {
  const config = CATEGORY_CONFIG[event.category] || CATEGORY_CONFIG.other;
  const spotsLeft = event.maxAttendees ? event.maxAttendees - event.attendeeCount : null;
  const isFull = spotsLeft !== null && spotsLeft <= 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 hover:border-blue-200 transition-colors">
      <div className="flex items-start gap-3">
        {/* Date badge */}
        <div className="flex flex-col items-center justify-center h-14 w-14 rounded-lg bg-blue-50 border border-blue-100 flex-shrink-0">
          <span className="text-xs font-medium text-blue-600 uppercase">
            {toNativeDate(event.dateTime).toLocaleDateString('en-US', { month: 'short' })}
          </span>
          <span className="text-lg font-bold text-blue-800 -mt-0.5">
            {toNativeDate(event.dateTime).getDate()}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-slate-800 text-sm">{event.title}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
              {config.label}
            </span>
          </div>

          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{event.description}</p>

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="h-3 w-3 text-slate-400" />
              <span>{formatTime(event.dateTime)}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="h-3 w-3 text-slate-400" />
              <span className="truncate max-w-[150px]">
                {event.isVirtual ? 'Virtual' : event.location}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Users className="h-3 w-3 text-slate-400" />
              <span>{event.attendeeCount} attending</span>
            </div>
          </div>

          {/* RSVP section */}
          <div className="flex items-center gap-2 mt-3">
            {isFull ? (
              <span className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-xs font-medium">
                Event Full
              </span>
            ) : (
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 transition-colors">
                <Calendar className="h-3.5 w-3.5" />
                RSVP
              </button>
            )}
            {spotsLeft !== null && spotsLeft > 0 && spotsLeft <= 5 && (
              <span className="text-xs text-orange-600 font-medium">
                Only {spotsLeft} spots left
              </span>
            )}
            {event.isRecurring && (
              <span className="text-xs text-slate-400">{event.recurringSchedule}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse">
          <div className="flex items-start gap-3">
            <div className="h-14 w-14 rounded-lg bg-slate-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 bg-slate-200 rounded" />
              <div className="h-3 w-full bg-slate-100 rounded" />
              <div className="h-3 w-2/3 bg-slate-100 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Events() {
  const [filter, setFilter] = useState<EventCategory | 'all'>('all');

  const now = Timestamp.now();
  const { data: events, loading } = useCollection<CommunityEvent>(
    'events',
    where('dateTime', '>=', now),
    orderBy('dateTime', 'asc')
  );

  const filtered = filter === 'all'
    ? events
    : events.filter((e) => e.category === filter);

  // Group events by date
  const grouped: { label: string; events: CommunityEvent[] }[] = [];
  filtered.forEach((event) => {
    const label = formatEventDate(event.dateTime);
    const existing = grouped.find((g) => g.label === label);
    if (existing) {
      existing.events.push(event);
    } else {
      grouped.push({ label, events: [event] });
    }
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Events</h1>
        <p className="text-sm text-slate-500 mt-0.5">Community gatherings and meetings</p>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        <button
          onClick={() => setFilter('all')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All Events
        </button>
        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setFilter(key as EventCategory)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === key
                ? 'bg-blue-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {config.label}
          </button>
        ))}
      </div>

      {/* Events List */}
      {loading ? (
        <LoadingSkeleton />
      ) : grouped.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <Calendar className="h-10 w-10 text-slate-300 mx-auto" />
          <h3 className="font-medium text-slate-800 mt-3">No upcoming events</h3>
          <p className="text-sm text-slate-500 mt-1">
            {filter !== 'all'
              ? 'Try a different category or check back later.'
              : 'Community events will appear here as they are scheduled.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map((group) => (
            <div key={group.label}>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                {group.label}
              </h3>
              <div className="space-y-3">
                {group.events.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
