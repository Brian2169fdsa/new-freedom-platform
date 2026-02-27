import { useState, useMemo } from 'react';
import {
  PageContainer,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
  Input,
  useAuth,
  useCollection,
} from '@reprieve/shared';
import type { Appointment, AppointmentType } from '@reprieve/shared';
import { addDocument } from '@reprieve/shared/services/firebase/firestore';
import { Timestamp, where } from 'firebase/firestore';
import {
  Plus,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Calendar,
  AlertCircle,
  Bell,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const APPOINTMENT_TYPES: { value: AppointmentType; label: string; color: string }[] = [
  { value: 'case_manager', label: 'Case Manager', color: 'bg-amber-500' },
  { value: 'mentor', label: 'Mentor', color: 'bg-blue-500' },
  { value: 'therapy', label: 'Therapy', color: 'bg-purple-500' },
  { value: 'court', label: 'Court', color: 'bg-red-500' },
  { value: 'parole', label: 'Parole', color: 'bg-orange-500' },
  { value: 'medical', label: 'Medical', color: 'bg-pink-500' },
  { value: 'interview', label: 'Interview', color: 'bg-green-500' },
  { value: 'aa_meeting', label: 'AA/NA Meeting', color: 'bg-teal-500' },
  { value: 'other', label: 'Other', color: 'bg-stone-500' },
];

const appointmentTypeMap = Object.fromEntries(
  APPOINTMENT_TYPES.map((t) => [t.value, t])
);

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function daysUntil(date: Date): number {
  const now = new Date();
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getReminderLabel(apptDate: Date): string | null {
  const now = new Date();
  const diffMs = apptDate.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);

  if (diffMins <= 0) return null;
  if (diffMins <= 15) return 'Starting in 15 minutes';
  if (diffMins <= 60) return 'Starting in 1 hour';
  if (diffHours <= 24) return `Starting in ${diffHours} hours`;
  return null;
}

/** Safely convert Timestamp-like objects, Dates, or strings to a native Date. */
function toNativeDate(ts: unknown): Date {
  if (ts instanceof Date) return ts;
  if (typeof ts === 'string') return new Date(ts);
  if (ts && typeof (ts as any).toDate === 'function')
    return (ts as any).toDate();
  return new Date(ts as number);
}

export default function CalendarView() {
  const { user } = useAuth();
  const { data: appointments, loading } = useCollection<Appointment>(
    'appointments',
    where('userId', '==', user?.uid ?? '')
  );

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Add form state
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<AppointmentType>('case_manager');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('09:00');
  const [newDuration, setNewDuration] = useState('60');
  const [newLocation, setNewLocation] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const monthLabel = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // Map appointments to day numbers for the current month
  const appointmentsByDay = useMemo(() => {
    const map: Record<number, Appointment[]> = {};
    appointments.forEach((appt) => {
      const apptDate = toNativeDate(appt.dateTime);
      if (apptDate.getFullYear() === year && apptDate.getMonth() === month) {
        const day = apptDate.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(appt);
      }
    });
    return map;
  }, [appointments, year, month]);

  // Appointments for the selected day
  const selectedDayAppointments = useMemo(() => {
    if (!selectedDate) return [];
    return appointments
      .filter((appt) => isSameDay(toNativeDate(appt.dateTime), selectedDate))
      .sort((a, b) => toNativeDate(a.dateTime).getTime() - toNativeDate(b.dateTime).getTime());
  }, [appointments, selectedDate]);

  const navigateMonth = (direction: -1 | 1) => {
    setCurrentDate(new Date(year, month + direction, 1));
  };

  const handleAddAppointment = async () => {
    if (!newTitle.trim() || !newDate || !newTime || !user?.uid) return;

    setSaving(true);
    try {
      const [hours, minutes] = newTime.split(':').map(Number);
      const dateObj = new Date(newDate);
      dateObj.setHours(hours, minutes, 0, 0);

      await addDocument('appointments', {
        userId: user.uid,
        title: newTitle.trim(),
        type: newType,
        dateTime: Timestamp.fromDate(dateObj),
        duration: parseInt(newDuration) || 60,
        location: newLocation.trim() || null,
        reminders: [],
        status: 'scheduled',
      });

      // Reset form
      setNewTitle('');
      setNewType('case_manager');
      setNewDate('');
      setNewTime('09:00');
      setNewDuration('60');
      setNewLocation('');
      setNewNotes('');
      setAddDialogOpen(false);
    } catch (error) {
      console.error('Failed to add appointment:', error);
    } finally {
      setSaving(false);
    }
  };

  const openAddDialog = () => {
    // Pre-fill date with selected date if one is selected
    if (selectedDate) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      setNewDate(dateStr);
    }
    setAddDialogOpen(true);
  };

  // Build calendar grid cells
  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }
  // Pad remaining cells to fill the last row
  while (calendarCells.length % 7 !== 0) {
    calendarCells.push(null);
  }

  return (
    <PageContainer
      title="Calendar"
      subtitle="Keep track of your appointments and court dates"
      action={
        <Button size="sm" onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      }
    >
      {/* Back link */}
      <Link
        to="/tools"
        className="inline-flex items-center gap-1 text-sm text-amber-700 hover:text-amber-800 -mt-2 mb-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Tools
      </Link>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 border-2 border-amber-700 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Month navigation */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => navigateMonth(-1)}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-stone-500 hover:bg-stone-100 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <h3 className="text-lg font-semibold text-stone-800">{monthLabel}</h3>
                <button
                  onClick={() => navigateMonth(1)}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-stone-500 hover:bg-stone-100 transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {DAYS_OF_WEEK.map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-medium text-stone-400 py-1"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarCells.map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty-${idx}`} className="h-10" />;
                  }

                  const cellDate = new Date(year, month, day);
                  const hasAppointments = !!appointmentsByDay[day];
                  const isSelected =
                    selectedDate && isSameDay(cellDate, selectedDate);
                  const isTodayDate = isToday(cellDate);

                  // Collect unique appointment type colors for this day
                  const dotColors = (appointmentsByDay[day] || [])
                    .map((a) => appointmentTypeMap[a.type]?.color || 'bg-stone-500')
                    .filter((v, i, arr) => arr.indexOf(v) === i)
                    .slice(0, 3);

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDate(cellDate)}
                      className={`h-10 rounded-lg flex flex-col items-center justify-center text-sm transition-colors relative ${
                        isSelected
                          ? 'bg-amber-700 text-white'
                          : isTodayDate
                          ? 'bg-amber-50 text-amber-800 font-semibold'
                          : 'text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <span>{day}</span>
                      {hasAppointments && (
                        <div className="flex gap-0.5 absolute bottom-1">
                          {dotColors.map((color, i) => (
                            <div
                              key={i}
                              className={`h-1 w-1 rounded-full ${
                                isSelected ? 'bg-white' : color
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Court Date Countdowns */}
          {(() => {
            const courtDates = appointments
              .filter((a) => {
                const d = toNativeDate(a.dateTime);
                return (
                  (a.type === 'court' || a.type === 'parole') &&
                  d > new Date()
                );
              })
              .sort(
                (a, b) =>
                  toNativeDate(a.dateTime).getTime() - toNativeDate(b.dateTime).getTime(),
              )
              .slice(0, 3);

            if (courtDates.length === 0) return null;

            return (
              <Card className="border-red-200 bg-red-50/50">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    Upcoming Court/Parole Dates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {courtDates.map((appt) => {
                      const apptDate = toNativeDate(appt.dateTime);
                      const days = daysUntil(apptDate);
                      const typeInfo = appointmentTypeMap[appt.type];

                      return (
                        <div
                          key={appt.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-white border border-red-100"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`h-2 w-2 rounded-full flex-shrink-0 ${
                                typeInfo?.color || 'bg-red-500'
                              }`}
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-stone-800 truncate">
                                {appt.title}
                              </p>
                              <p className="text-xs text-stone-500">
                                {apptDate.toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                })}{' '}
                                at {formatTime(apptDate)}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={days <= 3 ? 'destructive' : days <= 7 ? 'warning' : 'secondary'}
                            className="flex-shrink-0"
                          >
                            {days === 0
                              ? 'Today'
                              : days === 1
                              ? 'Tomorrow'
                              : `${days} days`}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* Auto Reminders */}
          {(() => {
            const upcoming = appointments
              .filter((a) => {
                const reminder = getReminderLabel(toNativeDate(a.dateTime));
                return reminder !== null;
              })
              .slice(0, 3);

            if (upcoming.length === 0) return null;

            return (
              <Card className="border-amber-200 bg-amber-50/50">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base text-amber-700">
                    <Bell className="h-4 w-4" />
                    Reminders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {upcoming.map((appt) => {
                      const reminder = getReminderLabel(toNativeDate(appt.dateTime));
                      return (
                        <div
                          key={appt.id}
                          className="flex items-center gap-3 p-2.5 rounded-lg bg-white border border-amber-100"
                        >
                          <Bell className="h-4 w-4 text-amber-600 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-stone-800 truncate">
                              {appt.title}
                            </p>
                            <p className="text-xs text-amber-600">{reminder}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* Selected day appointments */}
          {selectedDate && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDayAppointments.length === 0 ? (
                  <div className="text-center py-6">
                    <Calendar className="h-10 w-10 text-stone-300 mx-auto mb-2" />
                    <p className="text-sm text-stone-400">No appointments this day</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3"
                      onClick={openAddDialog}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Appointment
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDayAppointments.map((appt) => {
                      const typeInfo = appointmentTypeMap[appt.type];
                      const apptDate = toNativeDate(appt.dateTime);

                      return (
                        <div
                          key={appt.id}
                          className="flex items-start gap-3 p-3 rounded-lg bg-stone-50"
                        >
                          <div
                            className={`h-2 w-2 rounded-full mt-2 flex-shrink-0 ${
                              typeInfo?.color || 'bg-stone-500'
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-medium text-stone-800 text-sm">
                                {appt.title}
                              </h4>
                              <Badge variant="secondary">
                                {typeInfo?.label || appt.type}
                              </Badge>
                              {appt.status === 'cancelled' && (
                                <Badge variant="destructive">Cancelled</Badge>
                              )}
                              {appt.status === 'completed' && (
                                <Badge variant="success">Completed</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-stone-500">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTime(apptDate)}
                                {appt.duration && ` (${appt.duration} min)`}
                              </span>
                              {appt.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {appt.location}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Add Appointment Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogHeader>
          <DialogTitle>Add Appointment</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Title
              </label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Parole check-in"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Type
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as AppointmentType)}
                className="flex h-10 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                {APPOINTMENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Date
                </label>
                <Input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Time
                </label>
                <Input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Duration (minutes)
              </label>
              <select
                value={newDuration}
                onChange={(e) => setNewDuration(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="15">15 min</option>
                <option value="30">30 min</option>
                <option value="45">45 min</option>
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
                <option value="120">2 hours</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Location (optional)
              </label>
              <Input
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="e.g. 123 Main St, Phoenix"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Notes (optional)
              </label>
              <textarea
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Any additional details..."
                rows={2}
                className="flex w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
              />
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAddAppointment}
            disabled={!newTitle.trim() || !newDate || saving}
          >
            {saving ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" /> Add Appointment
              </>
            )}
          </Button>
        </DialogFooter>
      </Dialog>
    </PageContainer>
  );
}
