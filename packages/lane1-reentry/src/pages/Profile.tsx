import { useState, useMemo, useCallback } from 'react';
import {
  PageContainer,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  Badge,
  Button,
  Input,
  Avatar,
  WellnessHistory,
} from '@reprieve/shared';
import type { User, UserSettings, Achievement } from '@reprieve/shared';
import { useAuth } from '@reprieve/shared/hooks/useAuth';
import { useCollection } from '@reprieve/shared/hooks/useFirestore';
import { formatDate } from '@reprieve/shared/utils/formatDate';
import { updateUser } from '@reprieve/shared/services/firebase/functions';
import { updateDocument } from '@reprieve/shared/services/firebase/firestore';
import { signOut } from '@reprieve/shared/services/firebase/auth';
import { where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  LogOut,
  Bell,
  Shield,
  Settings,
  ChevronRight,
  Edit3,
  Check,
  AlertTriangle,
  Trash2,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Safely convert Timestamp-like objects, Dates, or strings to a native Date. */
function toNativeDate(ts: unknown): Date {
  if (ts instanceof Date) return ts;
  if (typeof ts === 'string') return new Date(ts);
  if (ts && typeof (ts as any).toDate === 'function')
    return (ts as any).toDate();
  return new Date(ts as number);
}

function toInputDate(ts?: unknown): string {
  if (!ts) return '';
  const d = toNativeDate(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function daysSince(ts?: unknown): number | null {
  if (!ts) return null;
  const now = new Date();
  const then = toNativeDate(ts);
  return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
}

// ---------------------------------------------------------------------------
// Toggle Switch
// ---------------------------------------------------------------------------

function Toggle({
  on,
  onToggle,
  label,
}: {
  readonly on: boolean;
  readonly onToggle: () => void;
  readonly label: string;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-slate-700">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={onToggle}
        className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors duration-200 ${
          on ? 'bg-blue-600' : 'bg-slate-300'
        }`}
      >
        <div
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
            on ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Edit Profile Form State
// ---------------------------------------------------------------------------

interface EditFormState {
  readonly firstName: string;
  readonly lastName: string;
  readonly phone: string;
  readonly city: string;
  readonly state: string;
  readonly bio: string;
  readonly sobrietyDate: string;
}

function buildInitialEditForm(user: User): EditFormState {
  return {
    firstName: user.profile.firstName ?? '',
    lastName: user.profile.lastName ?? '',
    phone: user.phone ?? '',
    city: user.profile.city ?? '',
    state: user.profile.state ?? '',
    bio: user.profile.bio ?? '',
    sobrietyDate: toInputDate(user.profile.sobrietyDate),
  };
}

// ---------------------------------------------------------------------------
// Section 1: Profile Header
// ---------------------------------------------------------------------------

function ProfileHeader({
  user,
  onEditClick,
}: {
  readonly user: User;
  readonly onEditClick: () => void;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar
            src={user.photoURL}
            alt={user.displayName}
            fallback={
              (user.profile.firstName?.charAt(0) || '') +
              (user.profile.lastName?.charAt(0) || '')
            }
            size="lg"
            className="h-20 w-20 text-2xl flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800 truncate">
                  {user.displayName || 'New Member'}
                </h2>
                <div className="flex items-center gap-1.5 mt-1 text-sm text-slate-500">
                  <Mail className="h-3.5 w-3.5" />
                  <span className="truncate">{user.email}</span>
                </div>
                {user.createdAt && (
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
                    <Calendar className="h-3 w-3" />
                    <span>Member since {formatDate(user.createdAt)}</span>
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onEditClick}
                className="flex-shrink-0"
              >
                <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                Edit
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Section 2: Edit Profile Form
// ---------------------------------------------------------------------------

function EditProfileForm({
  user,
  onClose,
  onSaved,
}: {
  readonly user: User;
  readonly onClose: () => void;
  readonly onSaved: () => void;
}) {
  const [form, setForm] = useState<EditFormState>(buildInitialEditForm(user));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateField = useCallback(
    (key: keyof EditFormState, value: string) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const updates: Record<string, unknown> = {
        'profile.firstName': form.firstName,
        'profile.lastName': form.lastName,
        'profile.bio': form.bio || null,
        'profile.city': form.city || null,
        'profile.state': form.state || null,
        phone: form.phone || null,
        displayName: `${form.firstName} ${form.lastName}`.trim(),
      };

      if (form.sobrietyDate) {
        updates['profile.sobrietyDate'] = Timestamp.fromDate(
          new Date(form.sobrietyDate)
        );
      }

      await updateDocument('users', user.uid, updates);
      onSaved();
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to save profile';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Edit3 className="h-4 w-4 text-blue-600" />
          Edit Profile
        </CardTitle>
        <CardDescription>Update your personal information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg border border-red-200">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">
              First Name
            </label>
            <Input
              value={form.firstName}
              onChange={(e) => updateField('firstName', e.target.value)}
              placeholder="First name"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">
              Last Name
            </label>
            <Input
              value={form.lastName}
              onChange={(e) => updateField('lastName', e.target.value)}
              placeholder="Last name"
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">
            Phone Number
          </label>
          <Input
            type="tel"
            value={form.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            placeholder="(555) 123-4567"
          />
        </div>

        {/* Location row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">
              City
            </label>
            <Input
              value={form.city}
              onChange={(e) => updateField('city', e.target.value)}
              placeholder="Phoenix"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">
              State
            </label>
            <Input
              value={form.state}
              onChange={(e) => updateField('state', e.target.value)}
              placeholder="AZ"
            />
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">
            About Me
          </label>
          <textarea
            value={form.bio}
            onChange={(e) => updateField('bio', e.target.value)}
            placeholder="Tell us a little about yourself and your journey..."
            rows={3}
            className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        {/* Sobriety date */}
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">
            Sobriety Date
          </label>
          <Input
            type="date"
            value={form.sobrietyDate}
            onChange={(e) => updateField('sobrietyDate', e.target.value)}
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {saving ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Section 3: Recovery Stats Card
// ---------------------------------------------------------------------------

function RecoveryStatsCard({ user }: { readonly user: User }) {
  const sobrietyDays = daysSince(user.profile.sobrietyDate);

  const { data: goals } = useCollection(
    'goals',
    where('userId', '==', user.uid)
  );
  const { data: journalEntries } = useCollection(
    'journal_entries',
    where('userId', '==', user.uid)
  );
  const { data: wellnessCheckins } = useCollection(
    'wellness_checkins',
    where('userId', '==', user.uid)
  );
  const { data: stepProgress } = useCollection(
    'user_progress',
    where('userId', '==', user.uid),
    where('status', '==', 'completed')
  );

  const completedGoals = useMemo(
    () => goals.filter((g) => (g as Record<string, unknown>).status === 'completed').length,
    [goals]
  );

  // Calculate check-in streak from wellness check-ins
  const checkInStreak = useMemo(() => {
    if (wellnessCheckins.length === 0) return 0;

    const sortedDates = wellnessCheckins
      .map((c) => (c as Record<string, unknown>).dateStr as string)
      .filter(Boolean)
      .sort()
      .reverse();

    if (sortedDates.length === 0) return 0;

    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    // Streak must include today or yesterday
    if (sortedDates[0] !== today && sortedDates[0] !== yesterday) return 0;

    let streak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const currentDate = new Date(sortedDates[i - 1] + 'T00:00:00');
      const previousDate = new Date(sortedDates[i] + 'T00:00:00');
      const diffDays = Math.round(
        (currentDate.getTime() - previousDate.getTime()) / 86400000
      );
      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [wellnessCheckins]);

  const stats = [
    {
      label: 'Days Sober',
      value: sobrietyDays ?? '--',
      icon: Calendar,
      color: 'bg-blue-50 text-blue-700',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Check-in Streak',
      value: checkInStreak,
      icon: Check,
      color: 'bg-green-50 text-green-700',
      iconColor: 'text-green-600',
    },
    {
      label: 'Journal Entries',
      value: journalEntries.length,
      icon: Edit3,
      color: 'bg-blue-50 text-blue-700',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Goals Completed',
      value: completedGoals,
      icon: Check,
      color: 'bg-purple-50 text-purple-700',
      iconColor: 'text-purple-600',
    },
    {
      label: 'Steps Completed',
      value: stepProgress.length,
      icon: Award,
      color: 'bg-slate-100 text-slate-700',
      iconColor: 'text-slate-600',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Award className="h-4 w-4 text-blue-600" />
          Recovery Stats
        </CardTitle>
        <CardDescription>Your progress at a glance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={`flex flex-col items-center p-3 rounded-xl ${stat.color}`}
              >
                <Icon className={`h-5 w-5 mb-1 ${stat.iconColor}`} />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-[11px] text-center mt-0.5 opacity-80">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Section 5: Achievements Preview
// ---------------------------------------------------------------------------

function AchievementsPreview({ userId }: { readonly userId: string }) {
  const { data: achievements } = useCollection<Achievement>(
    'achievements',
    where('userId', '==', userId),
    orderBy('earnedAt', 'desc'),
    limit(4)
  );

  const rankColors: Record<string, string> = {
    bronze: 'bg-orange-100 text-orange-700 border-orange-200',
    silver: 'bg-slate-100 text-slate-600 border-slate-200',
    gold: 'bg-blue-100 text-blue-700 border-blue-200',
    platinum: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Award className="h-4 w-4 text-blue-600" />
            Achievements
          </CardTitle>
          <Link
            to="/achievements"
            className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
          >
            View All
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <CardDescription>Recent accomplishments</CardDescription>
      </CardHeader>
      <CardContent>
        {achievements.length === 0 ? (
          <div className="text-center py-6">
            <Award className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No achievements yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Complete goals and milestones to earn achievements
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="flex flex-col items-center p-3 rounded-xl bg-slate-50 border border-slate-200 text-center"
              >
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                  <span className="text-lg">{achievement.icon || '🏆'}</span>
                </div>
                <p className="text-xs font-medium text-slate-700 leading-tight">
                  {achievement.title}
                </p>
                {achievement.rank && (
                  <Badge
                    variant="outline"
                    className={`mt-1.5 text-[10px] capitalize ${
                      rankColors[achievement.rank] ?? ''
                    }`}
                  >
                    {achievement.rank}
                  </Badge>
                )}
                <p className="text-[10px] text-slate-400 mt-1">
                  {formatDate(achievement.earnedAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Section 6: Settings Section
// ---------------------------------------------------------------------------

function SettingsSection({
  user,
  onRefresh,
}: {
  readonly user: User;
  readonly onRefresh: () => void;
}) {
  const [settings, setSettings] = useState<UserSettings>(() => ({
    notifications: {
      push: user.settings?.notifications?.push ?? true,
      email: user.settings?.notifications?.email ?? true,
      sms: user.settings?.notifications?.sms ?? false,
    },
    privacy: {
      profileVisible: user.settings?.privacy?.profileVisible ?? true,
      showSobrietyDate: user.settings?.privacy?.showSobrietyDate ?? true,
      shareProgressWithMentor:
        user.settings?.privacy?.shareProgressWithMentor ?? true,
    },
  }));

  const [language, setLanguage] = useState<'en' | 'es'>(
    user.profile.preferredLanguage ?? 'en'
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggleNotification = useCallback(
    (key: 'push' | 'email' | 'sms') => {
      setSettings((prev) => ({
        ...prev,
        notifications: {
          ...prev.notifications,
          [key]: !prev.notifications[key],
        },
      }));
      setSaved(false);
    },
    []
  );

  const togglePrivacy = useCallback(
    (key: 'profileVisible' | 'showSobrietyDate' | 'shareProgressWithMentor') => {
      setSettings((prev) => ({
        ...prev,
        privacy: { ...prev.privacy, [key]: !prev.privacy[key] },
      }));
      setSaved(false);
    },
    []
  );

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await updateDocument('users', user.uid, {
        settings,
        'profile.preferredLanguage': language,
      });
      onRefresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4 text-blue-600" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-slate-100">
          <Toggle
            label="Push Notifications"
            on={settings.notifications.push}
            onToggle={() => toggleNotification('push')}
          />
          <Toggle
            label="Email Notifications"
            on={settings.notifications.email}
            onToggle={() => toggleNotification('email')}
          />
          <Toggle
            label="SMS Notifications"
            on={settings.notifications.sms}
            onToggle={() => toggleNotification('sms')}
          />
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-blue-600" />
            Privacy Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-slate-100">
          <Toggle
            label="Profile Visible to Others"
            on={settings.privacy.profileVisible}
            onToggle={() => togglePrivacy('profileVisible')}
          />
          <Toggle
            label="Show Sobriety Date"
            on={settings.privacy.showSobrietyDate}
            onToggle={() => togglePrivacy('showSobrietyDate')}
          />
          <Toggle
            label="Share Progress with Mentor"
            on={settings.privacy.shareProgressWithMentor}
            onToggle={() => togglePrivacy('shareProgressWithMentor')}
          />
        </CardContent>
      </Card>

      {/* Language Preference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="h-4 w-4 text-blue-600" />
            Language
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setLanguage('en');
                setSaved(false);
              }}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                language === 'en'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => {
                setLanguage('es');
                setSaved(false);
              }}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                language === 'es'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Espa&ntilde;ol
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Save Settings */}
      <Button
        onClick={handleSaveSettings}
        disabled={saving}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        {saving ? (
          <>
            <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2" />
            Saving...
          </>
        ) : saved ? (
          <>
            <Check className="h-4 w-4 mr-2" />
            Settings Saved
          </>
        ) : (
          <>
            <Check className="h-4 w-4 mr-2" />
            Save Settings
          </>
        )}
      </Button>

      {/* Sign Out */}
      <Button
        variant="outline"
        onClick={handleSignOut}
        className="w-full border-slate-300 text-slate-700 hover:bg-slate-100"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section 7: Danger Zone
// ---------------------------------------------------------------------------

function DangerZone({ user }: { readonly user: User }) {
  const [expanded, setExpanded] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE') return;

    setDeleting(true);
    setError(null);

    try {
      await updateUser({ action: 'deleteAccount', userId: user.uid });
      await signOut();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to delete account';
      setError(message);
      setDeleting(false);
    }
  };

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="flex items-center justify-between w-full text-left"
        >
          <CardTitle className="flex items-center gap-2 text-base text-slate-500">
            <AlertTriangle className="h-4 w-4" />
            Danger Zone
          </CardTitle>
          <ChevronRight
            className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
              expanded ? 'rotate-90' : ''
            }`}
          />
        </button>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0">
          {!confirmOpen ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Permanently delete your account and all associated data. This
                action cannot be undone.
              </p>
              <Button
                variant="destructive"
                onClick={() => setConfirmOpen(true)}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete My Account
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm font-medium text-red-800 mb-1">
                  Are you absolutely sure?
                </p>
                <p className="text-xs text-red-600">
                  This will permanently delete your profile, recovery progress,
                  journal entries, goals, and all other data. This cannot be
                  reversed.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg border border-red-200">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">
                  Type <strong>DELETE</strong> to confirm
                </label>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="border-red-300 focus:ring-red-500"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setConfirmOpen(false);
                    setConfirmText('');
                    setError(null);
                  }}
                  className="flex-1"
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={confirmText !== 'DELETE' || deleting}
                  className="flex-1"
                >
                  {deleting ? (
                    <>
                      <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Permanently Delete
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Profile Page
// ---------------------------------------------------------------------------

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [editMode, setEditMode] = useState(false);

  if (!user) {
    return (
      <PageContainer title="Profile">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-12 w-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
          <p className="mt-4 text-sm text-slate-500">Loading profile...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Profile">
      <div className="space-y-6">
        {/* Section 1: Profile Header */}
        <ProfileHeader
          user={user}
          onEditClick={() => setEditMode(true)}
        />

        {/* Section 2: Edit Profile Form (toggled) */}
        {editMode && (
          <EditProfileForm
            user={user}
            onClose={() => setEditMode(false)}
            onSaved={refreshUser}
          />
        )}

        {/* Section 3: Recovery Stats */}
        <RecoveryStatsCard user={user} />

        {/* Section 4: Wellness History */}
        <WellnessHistory />

        {/* Section 5: Achievements Preview */}
        <AchievementsPreview userId={user.uid} />

        {/* Section 6: Settings */}
        <SettingsSection user={user} onRefresh={refreshUser} />

        {/* Section 7: Danger Zone */}
        <DangerZone user={user} />

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 pb-4">
          REPrieve v0.1.0
        </p>
      </div>
    </PageContainer>
  );
}
