import { useState, useCallback } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
  Badge, Button, Input, Textarea,
  Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter,
  cn,
} from '@reprieve/shared';
import {
  Settings, Building2, ToggleLeft, ToggleRight,
  Bell, ShieldCheck, Gauge, Database, Key,
  Save, AlertTriangle, Download, Eye, EyeOff, Copy,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CenterInfo {
  readonly name: string;
  readonly address: string;
  readonly phone: string;
  readonly email: string;
  readonly website: string;
}

interface FeatureToggle {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly enabled: boolean;
  readonly category: string;
}

interface ModerationThresholds {
  readonly autoFlagScore: number;
  readonly autoApproveScore: number;
}

interface SecuritySettings {
  readonly sessionTimeoutMinutes: number;
  readonly minPasswordLength: number;
  readonly requireUppercase: boolean;
  readonly requireNumbers: boolean;
  readonly twoFactorRequired: boolean;
}

interface ApiKeyEntry {
  readonly id: string;
  readonly name: string;
  readonly maskedKey: string;
  readonly createdAt: string;
  readonly lastUsed: string;
}

// ---------------------------------------------------------------------------
// Initial State
// ---------------------------------------------------------------------------

const INITIAL_CENTER: CenterInfo = {
  name: 'New Freedom AZ',
  address: '1234 E. McDowell Rd, Phoenix, AZ 85006',
  phone: '(602) 555-0199',
  email: 'admin@newfreedom.org',
  website: 'https://newfreedom.org',
};

const INITIAL_TOGGLES: readonly FeatureToggle[] = [
  { id: 'lane1', label: 'Lane 1: Re-Entry', description: 'Case management, employment, housing tools', enabled: true, category: 'Lanes' },
  { id: 'lane2', label: 'Lane 2: Step Experience', description: '12-step interactive curriculum', enabled: true, category: 'Lanes' },
  { id: 'lane3', label: 'Lane 3: My Struggle', description: 'Community support and resources', enabled: true, category: 'Lanes' },
  { id: 'anonymous_posting', label: 'Anonymous Posting', description: 'Allow members to post anonymously in Lane 3', enabled: true, category: 'Community' },
  { id: 'ai_chat', label: 'AI Chat (Claude)', description: 'AI-powered support chat for members', enabled: true, category: 'AI' },
  { id: 'ai_moderation', label: 'AI Auto-Moderation', description: 'Automatic toxicity screening via Perspective API', enabled: true, category: 'AI' },
  { id: 'donations', label: 'Donations', description: 'Accept donations via Stripe', enabled: true, category: 'Financial' },
  { id: 'sms_notifications', label: 'SMS Notifications', description: 'Send SMS reminders to members', enabled: false, category: 'Notifications' },
];

const INITIAL_THRESHOLDS: ModerationThresholds = {
  autoFlagScore: 0.7,
  autoApproveScore: 0.2,
};

const INITIAL_SECURITY: SecuritySettings = {
  sessionTimeoutMinutes: 60,
  minPasswordLength: 8,
  requireUppercase: true,
  requireNumbers: true,
  twoFactorRequired: false,
};

const MOCK_API_KEYS: readonly ApiKeyEntry[] = [
  { id: '1', name: 'Perspective API', maskedKey: 'AIza...7x9Q', createdAt: '2026-01-10', lastUsed: '2026-02-19' },
  { id: '2', name: 'Stripe Secret', maskedKey: 'sk_live_...4hBk', createdAt: '2026-01-10', lastUsed: '2026-02-20' },
  { id: '3', name: 'Claude API', maskedKey: 'sk-ant-...mN2p', createdAt: '2026-01-10', lastUsed: '2026-02-20' },
];

// ---------------------------------------------------------------------------
// Section Components
// ---------------------------------------------------------------------------

function CenterInfoSection({
  center,
  onChange,
}: {
  readonly center: CenterInfo;
  readonly onChange: (updated: CenterInfo) => void;
}) {
  const update = (field: keyof CenterInfo, value: string) => {
    onChange({ ...center, [field]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-slate-400" />
          Center Information
        </CardTitle>
        <CardDescription>Basic information about your organization</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Center Name</label>
            <Input
              value={center.name}
              onChange={(e) => update('name', e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Address</label>
            <Input
              value={center.address}
              onChange={(e) => update('address', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Phone</label>
            <Input
              value={center.phone}
              onChange={(e) => update('phone', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <Input
              type="email"
              value={center.email}
              onChange={(e) => update('email', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Website</label>
            <Input
              value={center.website}
              onChange={(e) => update('website', e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FeatureTogglesSection({
  toggles,
  onToggle,
}: {
  readonly toggles: readonly FeatureToggle[];
  readonly onToggle: (id: string) => void;
}) {
  const categories = Array.from(new Set(toggles.map((t) => t.category)));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ToggleLeft className="h-5 w-5 text-slate-400" />
          Feature Toggles
        </CardTitle>
        <CardDescription>Enable or disable platform features</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {categories.map((cat) => (
            <div key={cat}>
              <p className="text-xs font-semibold text-slate-400 uppercase mb-3">{cat}</p>
              <div className="space-y-3">
                {toggles
                  .filter((t) => t.category === cat)
                  .map((toggle) => (
                    <div
                      key={toggle.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-700">{toggle.label}</p>
                        <p className="text-xs text-slate-500">{toggle.description}</p>
                      </div>
                      <button
                        onClick={() => onToggle(toggle.id)}
                        className={cn(
                          'relative h-6 w-11 rounded-full transition-colors',
                          toggle.enabled ? 'bg-blue-600' : 'bg-slate-300',
                        )}
                      >
                        <div
                          className={cn(
                            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                            toggle.enabled ? 'left-[22px]' : 'left-0.5',
                          )}
                        />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function NotificationTemplatesSection() {
  const [templates] = useState([
    { id: 'welcome', label: 'Welcome Message', preview: 'Welcome to REPrieve! We are here to support your journey...' },
    { id: 'appointment', label: 'Appointment Reminder', preview: 'Reminder: You have an appointment on {date} at {time}...' },
    { id: 'milestone', label: 'Milestone Achievement', preview: 'Congratulations on reaching {milestone}!' },
    { id: 'flagged', label: 'Content Flagged Warning', preview: 'Your post has been flagged for review...' },
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-slate-400" />
          Notification Templates
        </CardTitle>
        <CardDescription>Customize system notification messages</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {templates.map((tmpl) => (
            <div
              key={tmpl.id}
              className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700">{tmpl.label}</p>
                <p className="text-xs text-slate-500 truncate">{tmpl.preview}</p>
              </div>
              <Button size="sm" variant="ghost">Edit</Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SecuritySection({
  security,
  onChange,
}: {
  readonly security: SecuritySettings;
  readonly onChange: (updated: SecuritySettings) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-slate-400" />
          Security Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Session Timeout (minutes)</label>
              <Input
                type="number"
                value={security.sessionTimeoutMinutes}
                onChange={(e) =>
                  onChange({ ...security, sessionTimeoutMinutes: parseInt(e.target.value, 10) || 60 })
                }
                min={5}
                max={1440}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Min Password Length</label>
              <Input
                type="number"
                value={security.minPasswordLength}
                onChange={(e) =>
                  onChange({ ...security, minPasswordLength: parseInt(e.target.value, 10) || 8 })
                }
                min={6}
                max={32}
                className="mt-1"
              />
            </div>
          </div>

          <div className="space-y-3">
            <ToggleRow
              label="Require uppercase letters"
              enabled={security.requireUppercase}
              onToggle={() => onChange({ ...security, requireUppercase: !security.requireUppercase })}
            />
            <ToggleRow
              label="Require numbers"
              enabled={security.requireNumbers}
              onToggle={() => onChange({ ...security, requireNumbers: !security.requireNumbers })}
            />
            <ToggleRow
              label="Require two-factor authentication"
              enabled={security.twoFactorRequired}
              onToggle={() => onChange({ ...security, twoFactorRequired: !security.twoFactorRequired })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ModerationThresholdsSection({
  thresholds,
  onChange,
}: {
  readonly thresholds: ModerationThresholds;
  readonly onChange: (updated: ModerationThresholds) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="h-5 w-5 text-slate-400" />
          Moderation Thresholds
        </CardTitle>
        <CardDescription>Configure automatic content moderation behavior</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-700">
                Auto-Flag Toxicity Score
              </label>
              <span className="text-sm font-mono text-slate-600">
                {thresholds.autoFlagScore.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={thresholds.autoFlagScore}
              onChange={(e) =>
                onChange({ ...thresholds, autoFlagScore: parseFloat(e.target.value) })
              }
              className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-blue-600"
            />
            <p className="text-xs text-slate-500 mt-1">
              Posts with toxicity score above this threshold will be automatically flagged for review.
            </p>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-700">
                Auto-Approve Threshold
              </label>
              <span className="text-sm font-mono text-slate-600">
                {thresholds.autoApproveScore.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.05"
              value={thresholds.autoApproveScore}
              onChange={(e) =>
                onChange({ ...thresholds, autoApproveScore: parseFloat(e.target.value) })
              }
              className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-green-600"
            />
            <p className="text-xs text-slate-500 mt-1">
              Posts with toxicity score below this threshold will be automatically approved.
            </p>
          </div>

          {thresholds.autoApproveScore >= thresholds.autoFlagScore && (
            <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-orange-600 shrink-0" />
              <p className="text-xs text-orange-800">
                Auto-approve threshold should be lower than auto-flag threshold.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DataExportSection() {
  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => setExporting(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-slate-400" />
          Data Export
        </CardTitle>
        <CardDescription>Download a full backup of platform data</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-600 mb-4">
          Export all platform data including user profiles, progress records, posts, and configuration.
          This may take several minutes for large datasets.
        </p>
        <Button variant="outline" onClick={handleExport} disabled={exporting}>
          {exporting ? (
            <>
              <div className="h-4 w-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mr-2" />
              Preparing Export...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-1.5" />
              Download Full Export
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function ApiKeysSection() {
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  const toggleVisibility = (id: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5 text-slate-400" />
          API Keys
        </CardTitle>
        <CardDescription>Manage third-party API integrations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {MOCK_API_KEYS.map((apiKey) => (
            <div
              key={apiKey.id}
              className="flex items-center gap-4 p-3 rounded-lg border border-slate-100"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700">{apiKey.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <code className="text-xs font-mono text-slate-500">
                    {visibleKeys.has(apiKey.id) ? apiKey.maskedKey.replace('...', '••••••••') : apiKey.maskedKey}
                  </code>
                  <button
                    onClick={() => toggleVisibility(apiKey.id)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    {visibleKeys.has(apiKey.id)
                      ? <EyeOff className="h-3.5 w-3.5" />
                      : <Eye className="h-3.5 w-3.5" />
                    }
                  </button>
                </div>
              </div>
              <div className="text-right text-xs text-slate-500">
                <p>Created: {apiKey.createdAt}</p>
                <p>Last used: {apiKey.lastUsed}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Toggle Row Helper
// ---------------------------------------------------------------------------

function ToggleRow({
  label,
  enabled,
  onToggle,
}: {
  readonly label: string;
  readonly enabled: boolean;
  readonly onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-slate-700">{label}</span>
      <button
        onClick={onToggle}
        className={cn(
          'relative h-6 w-11 rounded-full transition-colors',
          enabled ? 'bg-blue-600' : 'bg-slate-300',
        )}
      >
        <div
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
            enabled ? 'left-[22px]' : 'left-0.5',
          )}
        />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Confirm Save Dialog
// ---------------------------------------------------------------------------

function ConfirmSaveDialog({
  open,
  onConfirm,
  onCancel,
}: {
  readonly open: boolean;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={() => onCancel()}>
      <DialogHeader>
        <DialogTitle>Save Settings</DialogTitle>
      </DialogHeader>
      <DialogContent>
        <p className="text-sm text-slate-600">
          Are you sure you want to save all settings changes? This will immediately affect platform behavior.
        </p>
      </DialogContent>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={onConfirm}>Save All Changes</Button>
      </DialogFooter>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export default function AdminSettings() {
  const [center, setCenter] = useState<CenterInfo>(INITIAL_CENTER);
  const [toggles, setToggles] = useState<readonly FeatureToggle[]>(INITIAL_TOGGLES);
  const [security, setSecurity] = useState<SecuritySettings>(INITIAL_SECURITY);
  const [thresholds, setThresholds] = useState<ModerationThresholds>(INITIAL_THRESHOLDS);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleToggle = useCallback((id: string) => {
    setToggles((prev) =>
      prev.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t)),
    );
  }, []);

  const handleSave = () => {
    setSaving(true);
    // In production, this would batch-update Firestore documents
    setTimeout(() => {
      setSaving(false);
      setConfirmOpen(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
          <p className="text-sm text-slate-500">Platform configuration and management</p>
        </div>
        <Button onClick={() => setConfirmOpen(true)} disabled={saving}>
          {saving ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-1.5" />
              Save All Changes
            </>
          )}
        </Button>
      </div>

      {/* Sections */}
      <CenterInfoSection center={center} onChange={setCenter} />
      <FeatureTogglesSection toggles={toggles} onToggle={handleToggle} />
      <NotificationTemplatesSection />
      <SecuritySection security={security} onChange={setSecurity} />
      <ModerationThresholdsSection thresholds={thresholds} onChange={setThresholds} />
      <DataExportSection />
      <ApiKeysSection />

      {/* Confirm Dialog */}
      <ConfirmSaveDialog
        open={confirmOpen}
        onConfirm={handleSave}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
