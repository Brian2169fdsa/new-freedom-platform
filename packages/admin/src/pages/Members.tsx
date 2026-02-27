import { useState, useMemo, useCallback } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle,
  Badge, Avatar, Button, Input,
  Sheet, SheetHeader, SheetTitle, SheetContent,
  useCollection,
  formatDate,
  cn, LANE_NAMES,
} from '@reprieve/shared';
import type { User, Lane, UserRole } from '@reprieve/shared';
import {
  Search, Filter, Download, ChevronDown, ChevronUp,
  UserCog, MoreHorizontal, X,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_BADGES: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'secondary' | 'destructive' }> = {
  intake: { label: 'Intake', variant: 'default' },
  active: { label: 'Active', variant: 'success' },
  graduated: { label: 'Graduated', variant: 'secondary' },
  inactive: { label: 'Inactive', variant: 'warning' },
};

const ROLE_OPTIONS: { value: UserRole | ''; label: string }[] = [
  { value: '', label: 'All Roles' },
  { value: 'member', label: 'Member' },
  { value: 'mentor', label: 'Mentor' },
  { value: 'case_manager', label: 'Case Manager' },
  { value: 'admin', label: 'Admin' },
];

const LANE_OPTIONS: { value: Lane | ''; label: string }[] = [
  { value: '', label: 'All Lanes' },
  { value: 'lane1', label: 'Re-Entry' },
  { value: 'lane2', label: 'Step Experience' },
  { value: 'lane3', label: 'My Struggle' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'intake', label: 'Intake' },
  { value: 'active', label: 'Active' },
  { value: 'graduated', label: 'Graduated' },
  { value: 'inactive', label: 'Inactive' },
];

// ---------------------------------------------------------------------------
// Sort helpers
// ---------------------------------------------------------------------------

type SortField = 'name' | 'email' | 'role' | 'status' | 'joinDate';
type SortDir = 'asc' | 'desc';

function compareMember(a: User, b: User, field: SortField, dir: SortDir): number {
  let cmp = 0;
  switch (field) {
    case 'name':
      cmp = a.displayName.localeCompare(b.displayName);
      break;
    case 'email':
      cmp = a.email.localeCompare(b.email);
      break;
    case 'role':
      cmp = a.role.localeCompare(b.role);
      break;
    case 'status': {
      const sa = a.reentry?.enrollmentStatus ?? '';
      const sb = b.reentry?.enrollmentStatus ?? '';
      cmp = sa.localeCompare(sb);
      break;
    }
    case 'joinDate': {
      const da = a.createdAt?.toMillis?.() ?? 0;
      const db = b.createdAt?.toMillis?.() ?? 0;
      cmp = da - db;
      break;
    }
  }
  return dir === 'asc' ? cmp : -cmp;
}

// ---------------------------------------------------------------------------
// Member Detail Drawer
// ---------------------------------------------------------------------------

function MemberDrawer({
  member,
  caseManager,
  onClose,
}: {
  readonly member: User;
  readonly caseManager: User | null;
  readonly onClose: () => void;
}) {
  const status = member.reentry?.enrollmentStatus ?? 'active';
  const badge = STATUS_BADGES[status] ?? STATUS_BADGES.active;

  return (
    <Sheet open onOpenChange={() => onClose()} side="right">
      <SheetHeader>
        <SheetTitle>Member Details</SheetTitle>
      </SheetHeader>
      <SheetContent className="space-y-6 overflow-y-auto max-h-[calc(100vh-80px)]">
        {/* Profile */}
        <div className="flex items-center gap-3">
          <Avatar src={member.photoURL} alt={member.displayName} size="lg" />
          <div>
            <p className="font-semibold text-slate-800">{member.displayName}</p>
            <p className="text-sm text-slate-500">{member.email}</p>
            <Badge variant={badge.variant} className="mt-1">{badge.label}</Badge>
          </div>
        </div>

        {/* Info Rows */}
        <div className="space-y-3 text-sm">
          <InfoRow label="Role" value={member.role} />
          <InfoRow label="Phone" value={member.phone ?? 'N/A'} />
          <InfoRow label="Joined" value={formatDate(member.createdAt)} />
          <InfoRow label="Last Login" value={formatDate(member.lastLoginAt)} />
          <InfoRow
            label="Lanes"
            value={member.lanes.map((l) => LANE_NAMES[l]).join(', ') || 'None'}
          />
        </div>

        {/* Lane 1: Re-Entry Details */}
        {member.reentry && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Re-Entry Details</p>
            <div className="space-y-2 text-sm">
              <InfoRow label="Facility" value={member.reentry.facilityName ?? 'N/A'} />
              <InfoRow label="Release Date" value={formatDate(member.reentry.releaseDate)} />
              <InfoRow label="Parole Officer" value={member.reentry.paroleOfficer ?? 'N/A'} />
            </div>
          </div>
        )}

        {/* Lane 2: Step Progress */}
        {member.stepExperience && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Step Progress</p>
            <div className="space-y-2 text-sm">
              <InfoRow label="Current Step" value={`Step ${member.stepExperience.currentStep}`} />
              <InfoRow label="Enrolled" value={formatDate(member.stepExperience.enrollmentDate)} />
            </div>
          </div>
        )}

        {/* Case Manager */}
        {caseManager && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Case Manager</p>
            <div className="flex items-center gap-2">
              <Avatar src={caseManager.photoURL} alt={caseManager.displayName} size="sm" />
              <span className="text-sm text-slate-700">{caseManager.displayName}</span>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function InfoRow({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-700 font-medium">{value || 'N/A'}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sortable Header
// ---------------------------------------------------------------------------

function SortHeader({
  label,
  field,
  currentField,
  dir,
  onSort,
}: {
  readonly label: string;
  readonly field: SortField;
  readonly currentField: SortField;
  readonly dir: SortDir;
  readonly onSort: (f: SortField) => void;
}) {
  const isActive = currentField === field;
  return (
    <button
      className="flex items-center gap-1 text-xs font-semibold text-slate-500 uppercase hover:text-slate-700"
      onClick={() => onSort(field)}
    >
      {label}
      {isActive && (dir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export default function Members() {
  const { data: allUsers, loading } = useCollection<User>('users');

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [laneFilter, setLaneFilter] = useState<Lane | ''>('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('joinDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleSort = useCallback((field: SortField) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortDir('asc');
      return field;
    });
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allUsers
      .filter((u) => {
        if (q && !u.displayName.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
        if (roleFilter && u.role !== roleFilter) return false;
        if (laneFilter && !u.lanes.includes(laneFilter)) return false;
        if (statusFilter && u.reentry?.enrollmentStatus !== statusFilter) return false;
        return true;
      })
      .sort((a, b) => compareMember(a, b, sortField, sortDir));
  }, [allUsers, search, roleFilter, laneFilter, statusFilter, sortField, sortDir]);

  const toggleSelect = useCallback((uid: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) {
        next.delete(uid);
      } else {
        next.add(uid);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === filtered.length) return new Set();
      return new Set(filtered.map((m) => m.uid));
    });
  }, [filtered]);

  const caseManagerForSelected = useMemo(() => {
    if (!selectedMember?.reentry?.caseManagerId) return null;
    return allUsers.find((u) => u.uid === selectedMember.reentry?.caseManagerId) ?? null;
  }, [selectedMember, allUsers]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 bg-slate-200 rounded animate-pulse" />
        <div className="h-96 bg-slate-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Members</h1>
          <p className="text-sm text-slate-500">{allUsers.length} total members</p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-1.5" />
          Export
        </Button>
      </div>

      {/* Search + Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | '')}
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700"
            >
              {ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select
              value={laneFilter}
              onChange={(e) => setLaneFilter(e.target.value as Lane | '')}
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700"
            >
              {LANE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm font-medium text-blue-800">
            {selectedIds.size} selected
          </span>
          <Button size="sm" variant="outline">
            <UserCog className="h-3.5 w-3.5 mr-1" />
            Assign Case Manager
          </Button>
          <Button size="sm" variant="outline">Change Status</Button>
          <Button size="sm" variant="outline">
            <Download className="h-3.5 w-3.5 mr-1" />
            Export Selected
          </Button>
          <button
            className="ml-auto text-slate-500 hover:text-slate-700"
            onClick={() => setSelectedIds(new Set())}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="p-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filtered.length && filtered.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300"
                    />
                  </th>
                  <th className="p-4 text-left">
                    <SortHeader label="Member" field="name" currentField={sortField} dir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="p-4 text-left">
                    <SortHeader label="Email" field="email" currentField={sortField} dir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="p-4 text-left">
                    <SortHeader label="Role" field="role" currentField={sortField} dir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="p-4 text-left">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Lanes</span>
                  </th>
                  <th className="p-4 text-left">
                    <SortHeader label="Status" field="status" currentField={sortField} dir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="p-4 text-left">
                    <SortHeader label="Joined" field="joinDate" currentField={sortField} dir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="p-4 w-10" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No members match your filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((member) => {
                    const status = member.reentry?.enrollmentStatus ?? 'active';
                    const badge = STATUS_BADGES[status] ?? STATUS_BADGES.active;
                    return (
                      <tr
                        key={member.uid}
                        className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => setSelectedMember(member)}
                      >
                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(member.uid)}
                            onChange={() => toggleSelect(member.uid)}
                            className="rounded border-slate-300"
                          />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar src={member.photoURL} alt={member.displayName} size="sm" />
                            <span className="text-sm font-medium text-slate-700">
                              {member.displayName}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-slate-600">{member.email}</td>
                        <td className="p-4">
                          <Badge variant="outline">{member.role}</Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-1">
                            {member.lanes.map((l) => (
                              <Badge key={l} variant="secondary">{LANE_NAMES[l]}</Badge>
                            ))}
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </td>
                        <td className="p-4 text-sm text-slate-600">
                          {formatDate(member.createdAt)}
                        </td>
                        <td className="p-4">
                          <button className="text-slate-400 hover:text-slate-600">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Member Detail Drawer */}
      {selectedMember && (
        <MemberDrawer
          member={selectedMember}
          caseManager={caseManagerForSelected}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </div>
  );
}
