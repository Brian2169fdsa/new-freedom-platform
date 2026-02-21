import { useState, useMemo } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
  Badge, Avatar, Button, Input,
  Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter,
  useCollection,
  formatDate, formatRelative, cn,
} from '@reprieve/shared';
import type { User } from '@reprieve/shared';
import {
  Search, UserPlus, MessageSquare, Calendar,
  ChevronRight, BarChart3, AlertCircle,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

// ---------------------------------------------------------------------------
// Constants & Helpers
// ---------------------------------------------------------------------------

const MAX_CASELOAD = 25;

function capacityColor(count: number): string {
  const ratio = count / MAX_CASELOAD;
  if (ratio >= 0.9) return 'bg-red-500';
  if (ratio >= 0.7) return 'bg-orange-500';
  return 'bg-green-500';
}

function capacityLabel(count: number): { text: string; variant: 'success' | 'warning' | 'destructive' } {
  const ratio = count / MAX_CASELOAD;
  if (ratio >= 0.9) return { text: 'At Capacity', variant: 'destructive' };
  if (ratio >= 0.7) return { text: 'High', variant: 'warning' };
  return { text: 'Available', variant: 'success' };
}

// ---------------------------------------------------------------------------
// Case Manager Card
// ---------------------------------------------------------------------------

interface CaseManagerCardProps {
  readonly manager: User;
  readonly caseloadCount: number;
  readonly onClick: () => void;
}

function CaseManagerCard({ manager, caseloadCount, onClick }: CaseManagerCardProps) {
  const cap = capacityLabel(caseloadCount);
  return (
    <Card
      className="hover:border-amber-300 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Avatar src={manager.photoURL} alt={manager.displayName} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-stone-800 truncate">{manager.displayName}</p>
              <Badge variant={cap.variant}>{cap.text}</Badge>
            </div>
            <p className="text-sm text-stone-500">{manager.email}</p>

            {/* Caseload bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-stone-500">Caseload</span>
                <span className="text-xs font-medium text-stone-700">
                  {caseloadCount} / {MAX_CASELOAD}
                </span>
              </div>
              <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${capacityColor(caseloadCount)}`}
                  style={{ width: `${Math.min((caseloadCount / MAX_CASELOAD) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex items-center gap-4 mt-3 text-xs text-stone-500">
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />
                Messages
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Appointments
              </span>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-stone-300 shrink-0 mt-1" />
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Assign Members Dialog
// ---------------------------------------------------------------------------

interface AssignDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly manager: User | null;
  readonly unassignedMembers: readonly User[];
}

function AssignDialog({ open, onClose, manager, unassignedMembers }: AssignDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return unassignedMembers.filter(
      (m) => m.displayName.toLowerCase().includes(q) || m.email.toLowerCase().includes(q),
    );
  }, [unassignedMembers, searchQuery]);

  const toggleMember = (uid: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) {
        next.delete(uid);
      } else {
        next.add(uid);
      }
      return next;
    });
  };

  const handleAssign = () => {
    // In production, this would call updateDocument for each selected member
    // to set reentry.caseManagerId = manager.uid
    onClose();
  };

  if (!manager) return null;

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogHeader>
        <DialogTitle>Assign Members to {manager.displayName}</DialogTitle>
      </DialogHeader>
      <DialogContent>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <Input
              placeholder="Search unassigned members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="max-h-60 overflow-y-auto space-y-1">
            {filtered.length === 0 ? (
              <p className="text-sm text-stone-400 text-center py-4">
                No unassigned members found.
              </p>
            ) : (
              filtered.map((m) => (
                <label
                  key={m.uid}
                  className={cn(
                    'flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors',
                    selected.has(m.uid) ? 'bg-amber-50' : 'hover:bg-stone-50',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(m.uid)}
                    onChange={() => toggleMember(m.uid)}
                    className="rounded border-stone-300"
                  />
                  <Avatar src={m.photoURL} alt={m.displayName} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-stone-700">{m.displayName}</p>
                    <p className="text-xs text-stone-500">{m.email}</p>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>
      </DialogContent>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleAssign} disabled={selected.size === 0}>
          Assign {selected.size > 0 ? `(${selected.size})` : ''}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Manager Detail View
// ---------------------------------------------------------------------------

interface ManagerDetailProps {
  readonly manager: User;
  readonly assignedMembers: readonly User[];
  readonly onBack: () => void;
  readonly onAssign: () => void;
}

function ManagerDetail({ manager, assignedMembers, onBack, onAssign }: ManagerDetailProps) {
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="text-sm text-stone-500 hover:text-stone-700 flex items-center gap-1"
      >
        &larr; Back to all managers
      </button>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar src={manager.photoURL} alt={manager.displayName} size="lg" />
          <div>
            <h2 className="text-xl font-bold text-stone-800">{manager.displayName}</h2>
            <p className="text-sm text-stone-500">{manager.email}</p>
          </div>
        </div>
        <Button onClick={onAssign}>
          <UserPlus className="h-4 w-4 mr-1.5" />
          Assign Members
        </Button>
      </div>

      {/* Assigned Members */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned Members ({assignedMembers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {assignedMembers.length === 0 ? (
            <p className="text-sm text-stone-400 text-center py-6">
              No members assigned yet.
            </p>
          ) : (
            <div className="space-y-2">
              {assignedMembers.map((m) => (
                <div
                  key={m.uid}
                  className="flex items-center gap-3 p-3 rounded-lg border border-stone-100 hover:bg-stone-50"
                >
                  <Avatar src={m.photoURL} alt={m.displayName} size="sm" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-stone-700">{m.displayName}</p>
                    <p className="text-xs text-stone-500">{m.email}</p>
                  </div>
                  <Badge variant={
                    m.reentry?.enrollmentStatus === 'active' ? 'success' :
                    m.reentry?.enrollmentStatus === 'intake' ? 'default' :
                    'secondary'
                  }>
                    {m.reentry?.enrollmentStatus ?? 'active'}
                  </Badge>
                  <span className="text-xs text-stone-400">
                    Joined {formatDate(m.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>Recent actions and engagement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <ActivityLogEntry
              icon={MessageSquare}
              text="Sent 3 messages to members"
              time="2 hours ago"
            />
            <ActivityLogEntry
              icon={Calendar}
              text="Held appointment with member"
              time="Yesterday"
            />
            <ActivityLogEntry
              icon={UserPlus}
              text="Assigned 2 new members"
              time="3 days ago"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ActivityLogEntry({
  icon: Icon,
  text,
  time,
}: {
  readonly icon: React.ElementType;
  readonly text: string;
  readonly time: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-stone-100 last:border-0">
      <div className="h-8 w-8 rounded-full bg-stone-100 flex items-center justify-center">
        <Icon className="h-4 w-4 text-stone-500" />
      </div>
      <p className="text-sm text-stone-700 flex-1">{text}</p>
      <span className="text-xs text-stone-400">{time}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export default function CaseManagers() {
  const { data: allUsers, loading } = useCollection<User>('users');

  const [search, setSearch] = useState('');
  const [selectedManager, setSelectedManager] = useState<User | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  const caseManagers = useMemo(
    () => allUsers.filter((u) => u.role === 'case_manager'),
    [allUsers],
  );

  const caseloadMap = useMemo(() => {
    const map = new Map<string, User[]>();
    allUsers.forEach((u) => {
      const cmId = u.reentry?.caseManagerId;
      if (cmId) {
        const existing = map.get(cmId) ?? [];
        map.set(cmId, [...existing, u]);
      }
    });
    return map;
  }, [allUsers]);

  const unassignedMembers = useMemo(
    () => allUsers.filter(
      (u) => u.role === 'member' && u.lanes.includes('lane1') && !u.reentry?.caseManagerId,
    ),
    [allUsers],
  );

  const filteredManagers = useMemo(() => {
    const q = search.toLowerCase();
    return caseManagers.filter(
      (cm) => cm.displayName.toLowerCase().includes(q) || cm.email.toLowerCase().includes(q),
    );
  }, [caseManagers, search]);

  const chartData = useMemo(() => {
    return filteredManagers.map((cm) => ({
      name: cm.displayName.split(' ')[0],
      caseload: caseloadMap.get(cm.uid)?.length ?? 0,
      max: MAX_CASELOAD,
    }));
  }, [filteredManagers, caseloadMap]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-stone-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 bg-stone-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Detail View
  if (selectedManager) {
    const assigned = caseloadMap.get(selectedManager.uid) ?? [];
    return (
      <div className="space-y-6">
        <ManagerDetail
          manager={selectedManager}
          assignedMembers={assigned}
          onBack={() => setSelectedManager(null)}
          onAssign={() => setAssignDialogOpen(true)}
        />
        <AssignDialog
          open={assignDialogOpen}
          onClose={() => setAssignDialogOpen(false)}
          manager={selectedManager}
          unassignedMembers={unassignedMembers}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Case Managers</h1>
          <p className="text-sm text-stone-500">
            {caseManagers.length} managers, {unassignedMembers.length} unassigned members
          </p>
        </div>
      </div>

      {/* Alert if unassigned */}
      {unassignedMembers.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-orange-600 shrink-0" />
          <p className="text-sm text-orange-800">
            {unassignedMembers.length} Lane 1 members need a case manager assignment.
          </p>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
        <Input
          placeholder="Search case managers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Caseload Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-stone-400" />
              Caseload Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#a8a29e" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#a8a29e" domain={[0, MAX_CASELOAD]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e7e5e4',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  />
                  <Bar dataKey="caseload" fill="#b45309" radius={[4, 4, 0, 0]} name="Active Cases" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manager Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredManagers.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center text-stone-400">
              No case managers found.
            </CardContent>
          </Card>
        ) : (
          filteredManagers.map((cm) => (
            <CaseManagerCard
              key={cm.uid}
              manager={cm}
              caseloadCount={caseloadMap.get(cm.uid)?.length ?? 0}
              onClick={() => setSelectedManager(cm)}
            />
          ))
        )}
      </div>
    </div>
  );
}
