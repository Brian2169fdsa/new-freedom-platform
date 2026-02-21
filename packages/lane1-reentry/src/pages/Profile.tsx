import { useState } from 'react';
import {
  PageContainer,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Avatar,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
  Textarea,
} from '@reprieve/shared';
import type { User, UserSettings } from '@reprieve/shared';
import { useAuth } from '@reprieve/shared/hooks/useAuth';
import { useCollection } from '@reprieve/shared/hooks/useFirestore';
import { updateDocument, serverTimestamp } from '@reprieve/shared/services/firebase/firestore';
import { uploadFile } from '@reprieve/shared/services/firebase/storage';
import { where } from 'firebase/firestore';
import {
  Settings,
  LogOut,
  Camera,
  Edit,
  Shield,
  Bell,
  Eye,
  Calendar,
  Heart,
  Award,
  ChevronRight,
  Save,
  User as UserIcon,
  Briefcase,
  FileText,
  Target,
  TrendingUp,
} from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(ts?: Timestamp | null): string {
  if (!ts) return '--';
  const d = ts.toDate();
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function toInputDate(ts?: Timestamp | null): string {
  if (!ts) return '';
  const d = ts.toDate();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function daysSince(ts?: Timestamp | null): number | null {
  if (!ts) return null;
  const now = new Date();
  const then = ts.toDate();
  return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
}

function enrollmentVariant(status?: string) {
  switch (status) {
    case 'active':
      return 'success' as const;
    case 'intake':
      return 'warning' as const;
    case 'graduated':
      return 'default' as const;
    case 'inactive':
      return 'secondary' as const;
    default:
      return 'outline' as const;
  }
}

// ---------------------------------------------------------------------------
// Toggle switch (built from scratch as requested)
// ---------------------------------------------------------------------------

function Toggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-stone-700">{label}</span>
      <div
        onClick={onToggle}
        className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors duration-200 ${
          on ? 'bg-amber-600' : 'bg-stone-300'
        }`}
      >
        <div
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
            on ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Profile Tab
// ---------------------------------------------------------------------------

function ProfileTab({ user, onEditClick, onAvatarUpload }: {
  user: User;
  onEditClick: () => void;
  onAvatarUpload: (file: File) => void;
}) {
  const sobrietyDays = daysSince(user.profile.sobrietyDate);

  // Stats queries
  const { data: goals } = useCollection(
    'goals',
    where('userId', '==', user.uid),
  );
  const { data: documents } = useCollection(
    'documents',
    where('userId', '==', user.uid),
  );

  const completedGoals = goals.filter((g) => (g as any).status === 'completed').length;
  const memberDays = daysSince(user.createdAt) ?? 0;

  // Case manager info from reentry data
  const caseManager = (user.reentry as any)?.caseManager;

  return (
    <div className="space-y-4">
      {/* Avatar + Core Info */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center">
            {/* Avatar with camera overlay */}
            <div className="relative mb-4">
              <Avatar
                src={user.photoURL}
                alt={user.displayName}
                fallback={
                  (user.profile.firstName?.charAt(0) || '') +
                  (user.profile.lastName?.charAt(0) || '')
                }
                size="lg"
                className="h-24 w-24 text-2xl"
              />
              <label className="absolute bottom-0 right-0 bg-amber-600 hover:bg-amber-700 text-white p-1.5 rounded-full cursor-pointer shadow-md transition-colors">
                <Camera className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onAvatarUpload(file);
                  }}
                />
              </label>
            </div>

            <h2 className="text-xl font-bold text-stone-800">{user.displayName}</h2>
            <p className="text-sm text-stone-500">{user.email}</p>
            {user.phone && <p className="text-sm text-stone-500">{user.phone}</p>}

            {/* Enrollment badge */}
            {user.reentry?.enrollmentStatus && (
              <Badge
                variant={enrollmentVariant(user.reentry.enrollmentStatus)}
                className="mt-2 capitalize"
              >
                {user.reentry.enrollmentStatus}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sobriety Counter */}
      {sobrietyDays !== null && (
        <Card>
          <CardContent className="p-6 text-center">
            <Heart className="h-6 w-6 text-amber-600 mx-auto mb-2" />
            <p className="text-4xl font-extrabold text-amber-700">{sobrietyDays}</p>
            <p className="text-sm font-medium text-stone-600 mt-1">
              {sobrietyDays === 1 ? 'day' : 'days'} strong
            </p>
            <p className="text-xs text-stone-400 mt-2">
              Since {formatDate(user.profile.sobrietyDate)}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-amber-600" /> My Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center p-3 rounded-lg bg-green-50">
              <Target className="h-5 w-5 text-green-600 mb-1" />
              <p className="text-lg font-bold text-stone-800">{completedGoals}</p>
              <p className="text-[10px] text-stone-500 text-center">Goals Done</p>
            </div>
            <div className="flex flex-col items-center p-3 rounded-lg bg-blue-50">
              <FileText className="h-5 w-5 text-blue-600 mb-1" />
              <p className="text-lg font-bold text-stone-800">{documents.length}</p>
              <p className="text-[10px] text-stone-500 text-center">Documents</p>
            </div>
            <div className="flex flex-col items-center p-3 rounded-lg bg-amber-50">
              <Calendar className="h-5 w-5 text-amber-600 mb-1" />
              <p className="text-lg font-bold text-stone-800">{memberDays}</p>
              <p className="text-[10px] text-stone-500 text-center">Days In</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Case Manager Info */}
      {caseManager && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Briefcase className="h-4 w-4 text-amber-600" /> Case Manager
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="flex items-center gap-3">
              <Avatar
                fallback={(caseManager.name || 'CM').charAt(0).toUpperCase()}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-stone-800">
                  {caseManager.name || 'Assigned Case Manager'}
                </p>
                {caseManager.email && (
                  <p className="text-xs text-stone-500">{caseManager.email}</p>
                )}
                {caseManager.phone && (
                  <p className="text-xs text-stone-500">{caseManager.phone}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Details */}
      <Card>
        <CardContent className="p-6 space-y-3">
          <DetailRow icon={<Calendar className="h-4 w-4 text-stone-400" />} label="Member since" value={formatDate(user.createdAt)} />
          {user.profile.dateOfBirth && (
            <DetailRow icon={<UserIcon className="h-4 w-4 text-stone-400" />} label="Date of birth" value={formatDate(user.profile.dateOfBirth)} />
          )}
          {user.profile.gender && (
            <DetailRow icon={<UserIcon className="h-4 w-4 text-stone-400" />} label="Gender" value={user.profile.gender} />
          )}
          {user.profile.bio && (
            <div className="pt-2 border-t border-stone-100">
              <p className="text-xs text-stone-400 mb-1">Bio</p>
              <p className="text-sm text-stone-700">{user.profile.bio}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Button onClick={onEditClick} className="w-full">
        <Edit className="h-4 w-4 mr-2" /> Edit Profile
      </Button>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-stone-500">{label}</span>
      </div>
      <span className="text-sm font-medium text-stone-800">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Settings Tab
// ---------------------------------------------------------------------------

function SettingsTab({ user, onSave }: { user: User; onSave: (settings: UserSettings) => void }) {
  const [settings, setSettings] = useState<UserSettings>(() => ({
    notifications: {
      push: user.settings?.notifications?.push ?? true,
      email: user.settings?.notifications?.email ?? true,
      sms: user.settings?.notifications?.sms ?? false,
      quietHoursStart: user.settings?.notifications?.quietHoursStart ?? '22:00',
      quietHoursEnd: user.settings?.notifications?.quietHoursEnd ?? '07:00',
    },
    privacy: {
      profileVisible: user.settings?.privacy?.profileVisible ?? true,
      showSobrietyDate: user.settings?.privacy?.showSobrietyDate ?? true,
      shareProgressWithMentor: user.settings?.privacy?.shareProgressWithMentor ?? true,
    },
  }));

  const [saving, setSaving] = useState(false);

  const toggleNotification = (key: 'push' | 'email' | 'sms') => {
    setSettings((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: !prev.notifications[key] },
    }));
  };

  const togglePrivacy = (key: 'profileVisible' | 'showSobrietyDate' | 'shareProgressWithMentor') => {
    setSettings((prev) => ({
      ...prev,
      privacy: { ...prev.privacy, [key]: !prev.privacy[key] },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(settings);
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4 text-amber-600" /> Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6 divide-y divide-stone-100">
          <Toggle label="Push notifications" on={settings.notifications.push} onToggle={() => toggleNotification('push')} />
          <Toggle label="Email notifications" on={settings.notifications.email} onToggle={() => toggleNotification('email')} />
          <Toggle label="SMS notifications" on={settings.notifications.sms} onToggle={() => toggleNotification('sms')} />
          <div className="pt-3 space-y-3">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Quiet Hours</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-stone-500">Start</label>
                <Input
                  type="time"
                  value={settings.notifications.quietHoursStart ?? '22:00'}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      notifications: { ...prev.notifications, quietHoursStart: e.target.value },
                    }))
                  }
                />
              </div>
              <div>
                <label className="text-xs text-stone-500">End</label>
                <Input
                  type="time"
                  value={settings.notifications.quietHoursEnd ?? '07:00'}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      notifications: { ...prev.notifications, quietHoursEnd: e.target.value },
                    }))
                  }
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-amber-600" /> Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6 divide-y divide-stone-100">
          <Toggle label="Profile visible to others" on={settings.privacy.profileVisible} onToggle={() => togglePrivacy('profileVisible')} />
          <Toggle label="Show sobriety date" on={settings.privacy.showSobrietyDate} onToggle={() => togglePrivacy('showSobrietyDate')} />
          <Toggle label="Share progress with mentor" on={settings.privacy.shareProgressWithMentor} onToggle={() => togglePrivacy('shareProgressWithMentor')} />
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        <Save className="h-4 w-4 mr-2" /> {saving ? 'Saving...' : 'Save Settings'}
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Achievements Tab
// ---------------------------------------------------------------------------

function AchievementsTab() {
  const placeholders = [
    { title: '30 Days Sober', icon: Heart },
    { title: 'First Goal Completed', icon: Award },
    { title: 'Step 1 Complete', icon: ChevronRight },
    { title: 'Resume Built', icon: UserIcon },
    { title: 'Community Connector', icon: Eye },
    { title: '90 Days Strong', icon: Calendar },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Award className="h-4 w-4 text-amber-600" /> Achievements
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="grid grid-cols-3 gap-3">
            {placeholders.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex flex-col items-center justify-center p-4 rounded-xl bg-stone-50 border border-stone-200 text-center"
                >
                  <div className="h-10 w-10 rounded-full bg-stone-200 flex items-center justify-center mb-2">
                    <Icon className="h-5 w-5 text-stone-400" />
                  </div>
                  <p className="text-xs text-stone-400 leading-tight">{item.title}</p>
                  <Badge variant="secondary" className="mt-1.5 text-[10px]">
                    Locked
                  </Badge>
                </div>
              );
            })}
          </div>
          <p className="text-center text-xs text-stone-400 mt-4">
            Complete goals and milestones to earn achievements
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Edit Profile Dialog
// ---------------------------------------------------------------------------

interface EditFormState {
  firstName: string;
  lastName: string;
  bio: string;
  dateOfBirth: string;
  gender: string;
  sobrietyDate: string;
}

function EditProfileDialog({
  open,
  onClose,
  user,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  user: User;
  onSave: (data: EditFormState) => Promise<void>;
}) {
  const [form, setForm] = useState<EditFormState>({
    firstName: user.profile.firstName ?? '',
    lastName: user.profile.lastName ?? '',
    bio: user.profile.bio ?? '',
    dateOfBirth: toInputDate(user.profile.dateOfBirth),
    gender: user.profile.gender ?? '',
    sobrietyDate: toInputDate(user.profile.sobrietyDate),
  });
  const [saving, setSaving] = useState(false);

  const update = (key: keyof EditFormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogHeader>
        <DialogTitle>Edit Profile</DialogTitle>
      </DialogHeader>
      <DialogContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-stone-500">First Name</label>
              <Input
                value={form.firstName}
                onChange={(e) => update('firstName', e.target.value)}
                placeholder="First name"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-500">Last Name</label>
              <Input
                value={form.lastName}
                onChange={(e) => update('lastName', e.target.value)}
                placeholder="Last name"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-stone-500">Bio</label>
            <Textarea
              value={form.bio}
              onChange={(e) => update('bio', e.target.value)}
              placeholder="Tell us a little about yourself..."
              rows={3}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-500">Date of Birth</label>
            <Input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => update('dateOfBirth', e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-500">Gender</label>
            <Input
              value={form.gender}
              onChange={(e) => update('gender', e.target.value)}
              placeholder="Gender"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-500">Sobriety Date</label>
            <Input
              type="date"
              value={form.sobrietyDate}
              onChange={(e) => update('sobrietyDate', e.target.value)}
            />
          </div>
        </div>
      </DialogContent>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={saving}>
          <Save className="h-4 w-4 mr-2" /> {saving ? 'Saving...' : 'Save'}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main Profile Page
// ---------------------------------------------------------------------------

export default function Profile() {
  const { user, signOut, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [editOpen, setEditOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Loading / null guard
  if (!user) {
    return (
      <PageContainer title="Profile">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-12 w-12 rounded-full border-4 border-amber-200 border-t-amber-600 animate-spin" />
          <p className="mt-4 text-sm text-stone-500">Loading profile...</p>
        </div>
      </PageContainer>
    );
  }

  // Handlers ---------------------------------------------------------------

  const handleAvatarUpload = async (file: File) => {
    setUploading(true);
    try {
      const path = `users/${user.uid}/avatar/${Date.now()}_${file.name}`;
      const url = await uploadFile(path, file);
      await updateDocument('users', user.uid, { photoURL: url });
      await refreshUser();
    } catch (err) {
      console.error('Avatar upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleEditSave = async (data: EditFormState) => {
    const updates: Record<string, unknown> = {
      'profile.firstName': data.firstName,
      'profile.lastName': data.lastName,
      'profile.bio': data.bio || null,
      'profile.gender': data.gender || null,
      displayName: `${data.firstName} ${data.lastName}`.trim(),
    };

    if (data.dateOfBirth) {
      updates['profile.dateOfBirth'] = Timestamp.fromDate(new Date(data.dateOfBirth));
    }
    if (data.sobrietyDate) {
      updates['profile.sobrietyDate'] = Timestamp.fromDate(new Date(data.sobrietyDate));
    }

    await updateDocument('users', user.uid, updates);
    await refreshUser();
  };

  const handleSettingsSave = async (settings: UserSettings) => {
    await updateDocument('users', user.uid, { settings });
    await refreshUser();
  };

  // Render -----------------------------------------------------------------

  return (
    <PageContainer title="Profile">
      {/* Upload indicator */}
      {uploading && (
        <div className="flex items-center gap-2 bg-amber-50 text-amber-700 text-sm px-4 py-2 rounded-lg border border-amber-200">
          <div className="h-4 w-4 rounded-full border-2 border-amber-300 border-t-amber-600 animate-spin" />
          Uploading photo...
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="profile">
            <UserIcon className="h-4 w-4 mr-1.5" /> Profile
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-1.5" /> Settings
          </TabsTrigger>
          <TabsTrigger value="achievements">
            <Award className="h-4 w-4 mr-1.5" /> Awards
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab
            user={user}
            onEditClick={() => setEditOpen(true)}
            onAvatarUpload={handleAvatarUpload}
          />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsTab user={user} onSave={handleSettingsSave} />
        </TabsContent>

        <TabsContent value="achievements">
          <AchievementsTab />
        </TabsContent>
      </Tabs>

      {/* Bottom section -- always visible */}
      <div className="mt-6 pt-6 border-t border-stone-200 space-y-3">
        <Button
          variant="destructive"
          className="w-full"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4 mr-2" /> Sign Out
        </Button>
        <p className="text-center text-xs text-stone-400">REPrieve v0.1.0</p>
      </div>

      {/* Edit dialog */}
      <EditProfileDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        user={user}
        onSave={handleEditSave}
      />
    </PageContainer>
  );
}
