import React, { useState } from 'react';
import { useAuth, useCollection, Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter, Input, Button, Textarea } from '@reprieve/shared';
import { where, orderBy } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { addDocument, updateDocument } from '@reprieve/shared/services/firebase/firestore';
import {
  Calendar, Clock, MapPin, Users, ChevronRight, Filter,
  Heart, Coffee, BookOpen, Dumbbell, Music, Mic,
  Plus, Loader2, Globe, Building2,
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
  attendees: string[];
  attendeeCount: number;
  maxAttendees?: number;
  isRecurring: boolean;
  recurringSchedule?: string;
}

const CATEGORY_CONFIG: Record<EventCategory, { label: string; icon: React.ReactNode; color: string }> = {
  meeting: { label: 'Meeting', icon: <Users className="h-4 w-4" />, color: 'bg-blue-50 text-blue-600' },
  workshop: { label: 'Workshop', icon: <BookOpen className="h-4 w-4" />, color: 'bg-purple-50 text-purple-600' },
  social: { label: 'Social', icon: <Coffee className="h-4 w-4" />, color: 'bg-amber-50 text-amber-600' },
  wellness: { label: 'Wellness', icon: <Dumbbell className="h-4 w-4" />, color: 'bg-green-50 text-green-600' },
  support: { label: 'Support', icon: <Heart className="h-4 w-4" />, color: 'bg-red-50 text-red-600' },
  other: { label: 'Other', icon: <Music className="h-4 w-4" />, color: 'bg-stone-50 text-stone-600' },
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

function isEventPast(dateTime: unknown): boolean {
  return toNativeDate(dateTime).getTime() < Date.now();
}

function EventCard({ event, currentUserId, onRsvp }: { event: CommunityEvent; currentUserId: string; onRsvp: (event: CommunityEvent) => void }) {
  const config = CATEGORY_CONFIG[event.category] || CATEGORY_CONFIG.other;
  const spotsLeft = event.maxAttendees ? event.maxAttendees - event.attendeeCount : null;
  const isFull = spotsLeft !== null && spotsLeft <= 0;
  const isRsvped = event.attendees?.includes(currentUserId);
  const isPast = isEventPast(event.dateTime);

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4 hover:border-amber-200 transition-colors">
      <div className="flex items-start gap-3">
        {/* Date badge */}
        <div className="flex flex-col items-center justify-center h-14 w-14 rounded-lg bg-amber-50 border border-amber-100 flex-shrink-0">
          <span className="text-xs font-medium text-amber-600 uppercase">
            {toNativeDate(event.dateTime).toLocaleDateString('en-US', { month: 'short' })}
          </span>
          <span className="text-lg font-bold text-amber-800 -mt-0.5">
            {toNativeDate(event.dateTime).getDate()}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-stone-800 text-sm">{event.title}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
              {config.label}
            </span>
          </div>

          <p className="text-xs text-stone-500 mt-1 line-clamp-2">{event.description}</p>

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <div className="flex items-center gap-1 text-xs text-stone-500">
              <Clock className="h-3 w-3 text-stone-400" />
              <span>{formatTime(event.dateTime)}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-stone-500">
              <MapPin className="h-3 w-3 text-stone-400" />
              <span className="truncate max-w-[150px]">
                {event.isVirtual ? 'Virtual' : event.location}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-stone-500">
              <Users className="h-3 w-3 text-stone-400" />
              <span>{event.attendeeCount} attending</span>
            </div>
          </div>

          {/* RSVP section */}
          <div className="flex items-center gap-2 mt-3">
            {isPast ? (
              <span className="px-3 py-1.5 bg-stone-100 text-stone-400 rounded-lg text-xs font-medium">
                Event Passed
              </span>
            ) : isRsvped ? (
              <button
                onClick={() => onRsvp(event)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-200 text-stone-700 rounded-lg text-xs font-medium hover:bg-stone-300 transition-colors"
              >
                <Calendar className="h-3.5 w-3.5" />
                Cancel RSVP
              </button>
            ) : isFull ? (
              <span className="px-3 py-1.5 bg-stone-100 text-stone-500 rounded-lg text-xs font-medium">
                Event Full
              </span>
            ) : (
              <button
                onClick={() => onRsvp(event)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600 transition-colors"
              >
                <Calendar className="h-3.5 w-3.5" />
                RSVP
              </button>
            )}
            {spotsLeft !== null && spotsLeft > 0 && spotsLeft <= 5 && !isPast && (
              <span className="text-xs text-orange-600 font-medium">
                Only {spotsLeft} spots left
              </span>
            )}
            {event.isRecurring && (
              <span className="text-xs text-stone-400">{event.recurringSchedule}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateEventDialog({
  open,
  onOpenChange,
  currentUserId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EventCategory>('meeting');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [isVirtual, setIsVirtual] = useState(false);
  const [maxAttendees, setMaxAttendees] = useState('');
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('meeting');
    setDate('');
    setTime('');
    setLocation('');
    setIsVirtual(false);
    setMaxAttendees('');
  };

  const handleSubmit = async () => {
    if (!title.trim() || !date || !time || !currentUserId) return;
    if (!isVirtual && !location.trim()) return;

    setSaving(true);
    try {
      const dateTime = Timestamp.fromDate(new Date(`${date}T${time}`));
      const max = maxAttendees ? parseInt(maxAttendees, 10) : undefined;

      await addDocument('events', {
        title: title.trim(),
        description: description.trim(),
        category,
        dateTime,
        location: isVirtual ? 'Virtual' : location.trim(),
        isVirtual,
        organizer: currentUserId,
        attendees: [currentUserId],
        attendeeCount: 1,
        ...(max ? { maxAttendees: max } : {}),
        isRecurring: false,
      });

      resetForm();
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to create event:', err);
    } finally {
      setSaving(false);
    }
  };

  const canSubmit = title.trim() && date && time && (isVirtual || location.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Create Event</DialogTitle>
      </DialogHeader>
      <DialogContent>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-stone-600 mb-1 block">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-stone-600 mb-1 block">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this event about?"
              rows={3}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-stone-600 mb-1.5 block">Category</label>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key as EventCategory)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    category === key
                      ? 'bg-amber-500 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {config.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-stone-600 mb-1 block">Date</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-600 mb-1 block">Time</label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-stone-600 mb-1.5 block">Location</label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => setIsVirtual(false)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  !isVirtual ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                <Building2 className="h-3.5 w-3.5" />
                In-Person
              </button>
              <button
                type="button"
                onClick={() => setIsVirtual(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isVirtual ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                <Globe className="h-3.5 w-3.5" />
                Virtual
              </button>
            </div>
            {!isVirtual && (
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Address or venue name"
              />
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-stone-600 mb-1 block">
              Max Attendees <span className="text-stone-400">(optional)</span>
            </label>
            <Input
              type="number"
              value={maxAttendees}
              onChange={(e) => setMaxAttendees(e.target.value)}
              placeholder="Leave blank for unlimited"
              min="1"
            />
          </div>
        </div>
      </DialogContent>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={!canSubmit || saving}>
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Creating...</>
          ) : (
            'Create Event'
          )}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-stone-200 p-4 animate-pulse">
          <div className="flex items-start gap-3">
            <div className="h-14 w-14 rounded-lg bg-stone-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 bg-stone-200 rounded" />
              <div className="h-3 w-full bg-stone-100 rounded" />
              <div className="h-3 w-2/3 bg-stone-100 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Events() {
  const { firebaseUser } = useAuth();
  const currentUserId = firebaseUser?.uid ?? '';
  const [filter, setFilter] = useState<EventCategory | 'all'>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [rsvpLoading, setRsvpLoading] = useState<string | null>(null);

  const now = Timestamp.now();
  const { data: events, loading } = useCollection<CommunityEvent>(
    'events',
    where('dateTime', '>=', now),
    orderBy('dateTime', 'asc')
  );

  const handleRsvp = async (event: CommunityEvent) => {
    if (!currentUserId || rsvpLoading) return;
    setRsvpLoading(event.id);

    try {
      const isRsvped = event.attendees?.includes(currentUserId);
      if (isRsvped) {
        // Cancel RSVP
        const updatedAttendees = (event.attendees || []).filter((id) => id !== currentUserId);
        await updateDocument('events', event.id, {
          attendees: updatedAttendees,
          attendeeCount: Math.max(0, event.attendeeCount - 1),
        });
      } else {
        // RSVP
        const updatedAttendees = [...(event.attendees || []), currentUserId];
        await updateDocument('events', event.id, {
          attendees: updatedAttendees,
          attendeeCount: event.attendeeCount + 1,
        });
      }
    } catch (err) {
      console.error('RSVP failed:', err);
    } finally {
      setRsvpLoading(null);
    }
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-800">Events</h1>
          <p className="text-sm text-stone-500 mt-0.5">Community gatherings and meetings</p>
        </div>
        <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Create Event
        </Button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        <button
          onClick={() => setFilter('all')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            filter === 'all'
              ? 'bg-amber-500 text-white'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
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
                ? 'bg-amber-500 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
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
        <div className="bg-white rounded-xl border border-stone-200 p-8 text-center">
          <Calendar className="h-10 w-10 text-stone-300 mx-auto" />
          <h3 className="font-medium text-stone-800 mt-3">No upcoming events</h3>
          <p className="text-sm text-stone-500 mt-1">
            {filter !== 'all'
              ? 'Try a different category or check back later.'
              : 'Community events will appear here as they are scheduled.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map((group) => (
            <div key={group.label}>
              <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
                {group.label}
              </h3>
              <div className="space-y-3">
                {group.events.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    currentUserId={currentUserId}
                    onRsvp={handleRsvp}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateEventDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        currentUserId={currentUserId}
      />
    </div>
  );
}
