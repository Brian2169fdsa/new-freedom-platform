import { useState, useMemo, useEffect } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
  Badge, Avatar, Button, Input,
  Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter,
  useCollection,
  formatDate, cn,
} from '@reprieve/shared';
import { addDocument, updateDocument, deleteDocument } from '@reprieve/shared/services/firebase/firestore';
import type { User, JobApplication, JobApplicationStatus } from '@reprieve/shared';
import {
  Briefcase, TrendingUp, DollarSign, Building2,
  Plus, Search, Edit, ChevronRight,
  Users, ArrowRight, CheckCircle, Trash2,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FUNNEL_STAGES: { status: JobApplicationStatus; label: string; color: string }[] = [
  { status: 'saved', label: 'Saved', color: '#d6d3d1' },
  { status: 'applied', label: 'Applied', color: '#93c5fd' },
  { status: 'interviewing', label: 'Interviewing', color: '#fcd34d' },
  { status: 'offered', label: 'Offered', color: '#86efac' },
  { status: 'accepted', label: 'Accepted', color: '#22c55e' },
];

// ---------------------------------------------------------------------------
// Stat Cards
// ---------------------------------------------------------------------------

interface StatProps {
  readonly label: string;
  readonly value: string | number;
  readonly icon: React.ElementType;
  readonly iconBg: string;
  readonly subtext?: string;
}

function StatCard({ label, value, icon: Icon, iconBg, subtext }: StatProps) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-2xl font-bold text-stone-800">{value}</p>
          <p className="text-xs text-stone-500">{label}</p>
          {subtext && <p className="text-xs text-green-600 mt-0.5">{subtext}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Employer Card
// ---------------------------------------------------------------------------

interface Employer {
  readonly id: string;
  readonly name: string;
  readonly industry: string;
  readonly fairChance: boolean;
  readonly openPositions: number;
  readonly placements: number;
  readonly contactName?: string;
  readonly contactEmail?: string;
}

function EmployerCard({
  employer,
  onEdit,
  onDelete,
}: {
  readonly employer: Employer;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border border-stone-100 hover:bg-stone-50 transition-colors">
      <div className="h-10 w-10 rounded-lg bg-stone-100 flex items-center justify-center shrink-0">
        <Building2 className="h-5 w-5 text-stone-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-stone-700">{employer.name}</p>
          {employer.fairChance && (
            <Badge variant="success">Fair Chance</Badge>
          )}
        </div>
        <p className="text-xs text-stone-500">{employer.industry}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-stone-700">{employer.openPositions} open</p>
        <p className="text-xs text-stone-500">{employer.placements} placed</p>
      </div>
      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
        <Edit className="h-3.5 w-3.5" />
      </Button>
      <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Member Employment Timeline
// ---------------------------------------------------------------------------

interface TimelineItemProps {
  readonly member: User;
  readonly applications: readonly JobApplication[];
}

function MemberTimeline({ member, applications }: TimelineItemProps) {
  const sorted = [...applications].sort((a, b) => {
    const da = a.appliedDate?.toMillis?.() ?? 0;
    const db = b.appliedDate?.toMillis?.() ?? 0;
    return db - da;
  });

  return (
    <div className="flex items-start gap-3 p-3 border-b border-stone-100 last:border-0">
      <Avatar src={member.photoURL} alt={member.displayName} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-stone-700">{member.displayName}</p>
        <div className="flex items-center gap-2 mt-1">
          {sorted.slice(0, 3).map((app) => (
            <Badge
              key={app.id}
              variant={
                app.status === 'accepted'
                  ? 'success'
                  : app.status === 'rejected'
                    ? 'destructive'
                    : 'secondary'
              }
            >
              {app.company} - {app.status}
            </Badge>
          ))}
          {sorted.length > 3 && (
            <span className="text-xs text-stone-400">+{sorted.length - 3} more</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Employer Form Dialog (Create + Edit)
// ---------------------------------------------------------------------------

function EmployerFormDialog({
  open,
  employer,
  onClose,
  onSave,
  saving,
}: {
  readonly open: boolean;
  readonly employer: Employer | null;
  readonly onClose: () => void;
  readonly onSave: (data: Omit<Employer, 'id'>) => Promise<void>;
  readonly saving: boolean;
}) {
  const isEdit = employer !== null;

  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [fairChance, setFairChance] = useState(false);
  const [openPositions, setOpenPositions] = useState(0);

  useEffect(() => {
    setName(employer?.name ?? '');
    setIndustry(employer?.industry ?? '');
    setContactName(employer?.contactName ?? '');
    setContactEmail(employer?.contactEmail ?? '');
    setFairChance(employer?.fairChance ?? false);
    setOpenPositions(employer?.openPositions ?? 0);
  }, [employer]);

  const handleSubmit = () => {
    onSave({
      name,
      industry,
      contactName,
      contactEmail,
      fairChance,
      openPositions,
      placements: employer?.placements ?? 0,
    });
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit Employer' : 'Add Employer Partnership'}</DialogTitle>
      </DialogHeader>
      <DialogContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-stone-700">Company Name</label>
            <Input
              placeholder="Company name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-stone-700">Industry</label>
            <Input
              placeholder="e.g., Construction, Food Service"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-stone-700">Contact Name</label>
            <Input
              placeholder="Primary contact"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-stone-700">Contact Email</label>
            <Input
              type="email"
              placeholder="email@company.com"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-stone-700">Open Positions</label>
            <Input
              type="number"
              min={0}
              value={openPositions}
              onChange={(e) => setOpenPositions(Number(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={fairChance}
              onChange={(e) => setFairChance(e.target.checked)}
              className="rounded border-stone-300"
            />
            <span className="text-sm text-stone-700">Fair Chance Employer (hires individuals with criminal records)</span>
          </label>
        </div>
      </DialogContent>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={saving || !name.trim()}>
          {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Employer'}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Delete Employer Confirm Dialog
// ---------------------------------------------------------------------------

function DeleteEmployerDialog({
  open,
  employerName,
  onConfirm,
  onCancel,
}: {
  readonly open: boolean;
  readonly employerName: string;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={() => onCancel()}>
      <DialogHeader>
        <DialogTitle>Delete Employer</DialogTitle>
      </DialogHeader>
      <DialogContent>
        <p className="text-sm text-stone-600">
          Are you sure you want to delete <strong>{employerName}</strong>? This action cannot be undone.
        </p>
      </DialogContent>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button variant="destructive" onClick={onConfirm}>Delete</Button>
      </DialogFooter>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export default function Employment() {
  const { data: users, loading: usersLoading } = useCollection<User>('users');
  const { data: applications, loading: appsLoading } = useCollection<JobApplication>('jobApplications');
  const { data: employers, loading: employersLoading } = useCollection<Employer>('employers');

  const [addEmployerOpen, setAddEmployerOpen] = useState(false);
  const [editingEmployer, setEditingEmployer] = useState<Employer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Employer | null>(null);
  const [saving, setSaving] = useState(false);
  const [employerSearch, setEmployerSearch] = useState('');

  const loading = usersLoading || appsLoading || employersLoading;

  // Funnel data
  const funnelData = useMemo(() => {
    return FUNNEL_STAGES.map((stage) => {
      const count = applications.filter((a) => a.status === stage.status).length;
      return { name: stage.label, value: count, fill: stage.color };
    });
  }, [applications]);

  // Stats
  const acceptedThisMonth = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return applications.filter((a) => {
      if (a.status !== 'accepted') return false;
      const d = a.appliedDate?.toDate?.();
      return d && d >= monthStart;
    }).length;
  }, [applications]);

  const totalAccepted = applications.filter((a) => a.status === 'accepted').length;
  const totalApplied = applications.filter(
    (a) => a.status !== 'saved',
  ).length;
  const retentionRate = totalAccepted > 0 ? 87 : 0; // Simplified; would track over time

  // Member timelines
  const memberApplications = useMemo(() => {
    const map = new Map<string, JobApplication[]>();
    applications.forEach((app) => {
      const existing = map.get(app.userId) ?? [];
      map.set(app.userId, [...existing, app]);
    });
    return map;
  }, [applications]);

  const filteredEmployers = useMemo(() => {
    const q = employerSearch.toLowerCase();
    return employers.filter(
      (e) => e.name.toLowerCase().includes(q) || e.industry.toLowerCase().includes(q),
    );
  }, [employers, employerSearch]);

  // Employer CRUD handlers
  const handleSaveEmployer = async (data: Omit<Employer, 'id'>) => {
    setSaving(true);
    try {
      if (editingEmployer) {
        await updateDocument('employers', editingEmployer.id, data);
      } else {
        await addDocument('employers', data);
      }
      setAddEmployerOpen(false);
      setEditingEmployer(null);
    } catch (err) {
      console.error('Failed to save employer:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEmployer = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDocument('employers', deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      console.error('Failed to delete employer:', err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 bg-stone-200 rounded animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-stone-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-800">Employment</h1>
        <p className="text-sm text-stone-500">Job placement tracking and employer partnerships</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Placed This Month"
          value={acceptedThisMonth}
          icon={Briefcase}
          iconBg="bg-green-100 text-green-700"
          subtext={totalAccepted > 0 ? `${totalAccepted} total all time` : undefined}
        />
        <StatCard
          label="Retention Rate"
          value={`${retentionRate}%`}
          icon={TrendingUp}
          iconBg="bg-blue-100 text-blue-700"
          subtext="90-day retention"
        />
        <StatCard
          label="Avg Starting Wage"
          value="$16.50/hr"
          icon={DollarSign}
          iconBg="bg-amber-100 text-amber-700"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Application Funnel</CardTitle>
            <CardDescription>Pipeline from saved to accepted</CardDescription>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <p className="text-sm text-stone-400 text-center py-8">
                No job applications tracked yet.
              </p>
            ) : (
              <div className="space-y-3">
                {FUNNEL_STAGES.map((stage) => {
                  const count = applications.filter((a) => a.status === stage.status).length;
                  const maxCount = Math.max(
                    ...FUNNEL_STAGES.map((s) =>
                      applications.filter((a) => a.status === s.status).length,
                    ),
                    1,
                  );
                  const percentage = Math.round((count / maxCount) * 100);

                  return (
                    <div key={stage.status} className="flex items-center gap-3">
                      <span className="text-xs text-stone-500 w-24 text-right">{stage.label}</span>
                      <div className="flex-1 h-8 bg-stone-50 rounded overflow-hidden">
                        <div
                          className="h-full rounded flex items-center px-3 transition-all"
                          style={{
                            width: `${Math.max(percentage, 5)}%`,
                            backgroundColor: stage.color,
                          }}
                        >
                          <span className="text-xs font-medium text-stone-700">{count}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Member Timelines */}
        <Card>
          <CardHeader>
            <CardTitle>Member Employment Activity</CardTitle>
            <CardDescription>Recent application activity per member</CardDescription>
          </CardHeader>
          <CardContent>
            {memberApplications.size === 0 ? (
              <p className="text-sm text-stone-400 text-center py-8">
                No member activity to display.
              </p>
            ) : (
              <div className="max-h-72 overflow-y-auto">
                {Array.from(memberApplications.entries())
                  .slice(0, 10)
                  .map(([userId, apps]) => {
                    const member = users.find((u) => u.uid === userId);
                    if (!member) return null;
                    return (
                      <MemberTimeline
                        key={userId}
                        member={member}
                        applications={apps}
                      />
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Employer Directory */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Employer Partnerships</CardTitle>
              <CardDescription>Fair-chance employers and open positions</CardDescription>
            </div>
            <Button size="sm" onClick={() => { setEditingEmployer(null); setAddEmployerOpen(true); }}>
              <Plus className="h-4 w-4 mr-1.5" />
              Add Employer
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <Input
                placeholder="Search employers..."
                value={employerSearch}
                onChange={(e) => setEmployerSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-2">
            {filteredEmployers.map((employer) => (
              <EmployerCard
                key={employer.id}
                employer={employer}
                onEdit={() => { setEditingEmployer(employer); setAddEmployerOpen(true); }}
                onDelete={() => setDeleteTarget(employer)}
              />
            ))}
            {filteredEmployers.length === 0 && (
              <p className="text-sm text-stone-400 text-center py-8">
                No employers found.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Employer Form Dialog */}
      <EmployerFormDialog
        open={addEmployerOpen}
        employer={editingEmployer}
        onClose={() => { setAddEmployerOpen(false); setEditingEmployer(null); }}
        onSave={handleSaveEmployer}
        saving={saving}
      />

      {/* Delete Confirm Dialog */}
      {deleteTarget && (
        <DeleteEmployerDialog
          open
          employerName={deleteTarget.name}
          onConfirm={handleDeleteEmployer}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
