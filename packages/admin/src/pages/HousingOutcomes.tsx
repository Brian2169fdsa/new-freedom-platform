import { useState, useMemo, useCallback } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
  Badge, Button, Input,
  useCollection,
  formatRelative,
  toDate,
} from '@reprieve/shared';
import type { HousingPlacement, HousingType, HousingStatus, User } from '@reprieve/shared';
import { orderBy } from 'firebase/firestore';
import {
  Home, Building2, Users, TrendingUp, ShieldCheck,
  Search, Download, RefreshCw, ArrowUpDown,
} from 'lucide-react';
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

// ---------------------------------------------------------------------------
// Stat Card (mirrors AdminDashboard pattern)
// ---------------------------------------------------------------------------

interface StatCardProps {
  readonly label: string;
  readonly value: string | number;
  readonly change?: string;
  readonly changeType?: 'positive' | 'negative' | 'neutral';
  readonly icon: React.ElementType;
  readonly iconBg: string;
}

function StatCard({ label, value, change, changeType = 'neutral', icon: Icon, iconBg }: StatCardProps) {
  const changeColor = changeType === 'positive'
    ? 'text-green-600'
    : changeType === 'negative'
      ? 'text-red-600'
      : 'text-stone-500';

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${iconBg}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-3xl font-bold text-stone-800">{value}</p>
            <p className="text-sm text-stone-500">{label}</p>
          </div>
          {change && (
            <span className={`text-xs font-medium ${changeColor}`}>{change}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HOUSING_TYPE_LABELS: Record<HousingType, string> = {
  emergency_shelter: 'Emergency Shelter',
  transitional: 'Transitional',
  sober_living: 'Sober Living',
  permanent: 'Permanent',
};

const HOUSING_TYPE_COLORS: Record<HousingType, string> = {
  emergency_shelter: '#f97316',
  transitional: '#3b82f6',
  sober_living: '#8b5cf6',
  permanent: '#22c55e',
};

const STATUS_BADGE_VARIANT: Record<HousingStatus, 'success' | 'warning' | 'destructive'> = {
  stable: 'success',
  at_risk: 'warning',
  lost: 'destructive',
};

const STATUS_LABELS: Record<HousingStatus, string> = {
  stable: 'Stable',
  at_risk: 'At Risk',
  lost: 'Lost',
};

type SortField = 'memberName' | 'housingType' | 'moveInDate' | 'status';
type SortDir = 'asc' | 'desc';

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function HousingOutcomes() {
  const { data: placements, loading } = useCollection<HousingPlacement>(
    'housing_placements',
    orderBy('moveInDate', 'desc')
  );
  const { data: members } = useCollection<User>('users');

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<HousingType | ''>('');
  const [statusFilter, setStatusFilter] = useState<HousingStatus | ''>('');
  const [sortField, setSortField] = useState<SortField>('moveInDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Computed metrics
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
  const ninetyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90);

  const housedThisMonth = useMemo(
    () => placements.filter((p) => {
      const date = toDate(p.moveInDate);
      return date && date >= thirtyDaysAgo;
    }).length,
    [placements],
  );

  const totalPlacements = placements.length;

  const ninetyDayStability = useMemo(() => {
    const eligible = placements.filter((p) => {
      const date = toDate(p.moveInDate);
      return date && date <= ninetyDaysAgo;
    });
    if (eligible.length === 0) return 0;
    const stable = eligible.filter((p) => p.status === 'stable').length;
    return Math.round((stable / eligible.length) * 100);
  }, [placements]);

  const partnerOrgs = useMemo(
    () => new Set(placements.map((p) => p.partnerOrganization)).size,
    [placements],
  );

  // Housing type breakdown
  const typeBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of placements) {
      counts[p.housingType] = (counts[p.housingType] || 0) + 1;
    }
    return (Object.keys(HOUSING_TYPE_LABELS) as HousingType[]).map((type) => ({
      type,
      label: HOUSING_TYPE_LABELS[type],
      count: counts[type] || 0,
      fill: HOUSING_TYPE_COLORS[type],
    }));
  }, [placements]);

  // Placements over time (last 6 months)
  const placementsOverTime = useMemo(() => {
    const months: { month: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const count = placements.filter((p) => {
        const date = toDate(p.moveInDate);
        return date && date >= d && date <= end;
      }).length;
      months.push({ month: label, count });
    }
    return months;
  }, [placements]);

  // Filtered + sorted table data
  const filtered = useMemo(() => {
    let result = [...placements];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.memberName.toLowerCase().includes(q) ||
          p.partnerOrganization.toLowerCase().includes(q),
      );
    }
    if (typeFilter) result = result.filter((p) => p.housingType === typeFilter);
    if (statusFilter) result = result.filter((p) => p.status === statusFilter);

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'memberName':
          cmp = a.memberName.localeCompare(b.memberName);
          break;
        case 'housingType':
          cmp = a.housingType.localeCompare(b.housingType);
          break;
        case 'moveInDate': {
          const da = toDate(a.moveInDate)?.getTime() ?? 0;
          const db = toDate(b.moveInDate)?.getTime() ?? 0;
          cmp = da - db;
          break;
        }
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [placements, search, typeFilter, statusFilter, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  // CSV export
  const handleExport = useCallback(() => {
    const headers = ['Member Name', 'Housing Type', 'Partner Organization', 'Move-In Date', 'Status'];
    const rows = filtered.map((p) => [
      p.memberName,
      HOUSING_TYPE_LABELS[p.housingType],
      p.partnerOrganization,
      toDate(p.moveInDate)?.toLocaleDateString() ?? '',
      STATUS_LABELS[p.status],
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `housing-outcomes-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-stone-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><div className="h-16 bg-stone-100 rounded animate-pulse" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Housing Outcomes</h1>
          <p className="text-stone-500 text-sm">Track housing placements and stability metrics</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-1.5" />
          Export CSV
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Housed This Month"
          value={housedThisMonth}
          icon={Home}
          iconBg="bg-green-100 text-green-700"
          change={housedThisMonth > 0 ? `+${housedThisMonth}` : undefined}
          changeType="positive"
        />
        <StatCard
          label="Total Placements"
          value={totalPlacements}
          icon={Building2}
          iconBg="bg-blue-100 text-blue-700"
        />
        <StatCard
          label="90-Day Stability Rate"
          value={`${ninetyDayStability}%`}
          icon={ShieldCheck}
          iconBg="bg-amber-100 text-amber-700"
          change={ninetyDayStability >= 80 ? 'On target' : 'Below target'}
          changeType={ninetyDayStability >= 80 ? 'positive' : 'negative'}
        />
        <StatCard
          label="Partner Organizations"
          value={partnerOrgs}
          icon={Users}
          iconBg="bg-purple-100 text-purple-700"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Housing Type Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Housing Type Breakdown</CardTitle>
            <CardDescription>Placements by housing category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeBreakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="#a8a29e" />
                  <YAxis dataKey="label" type="category" tick={{ fontSize: 11 }} stroke="#a8a29e" width={120} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e7e5e4',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  />
                  <Bar dataKey="count" name="Placements" radius={[0, 4, 4, 0]}>
                    {typeBreakdown.map((entry) => (
                      <Cell key={entry.type} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Placements Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Placements Over Time</CardTitle>
            <CardDescription>Monthly housing placements (last 6 months)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={placementsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#a8a29e" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#a8a29e" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e7e5e4',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#b45309"
                    fill="#fef3c7"
                    strokeWidth={2}
                    name="Placements"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <Input
                placeholder="Search member or organization..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as HousingType | '')}
              className="h-10 rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-700"
            >
              <option value="">All Types</option>
              {(Object.keys(HOUSING_TYPE_LABELS) as HousingType[]).map((t) => (
                <option key={t} value={t}>{HOUSING_TYPE_LABELS[t]}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as HousingStatus | '')}
              className="h-10 rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-700"
            >
              <option value="">All Statuses</option>
              {(Object.keys(STATUS_LABELS) as HousingStatus[]).map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Placements Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Housing Placements</CardTitle>
          <CardDescription>{filtered.length} placement{filtered.length !== 1 ? 's' : ''}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="p-4 text-left">
                    <button onClick={() => toggleSort('memberName')} className="flex items-center gap-1 text-xs font-semibold text-stone-500 uppercase tracking-wide">
                      Member <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="p-4 text-left">
                    <button onClick={() => toggleSort('housingType')} className="flex items-center gap-1 text-xs font-semibold text-stone-500 uppercase tracking-wide">
                      Housing Type <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="p-4 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Organization</th>
                  <th className="p-4 text-left">
                    <button onClick={() => toggleSort('moveInDate')} className="flex items-center gap-1 text-xs font-semibold text-stone-500 uppercase tracking-wide">
                      Move-In Date <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="p-4 text-left">
                    <button onClick={() => toggleSort('status')} className="flex items-center gap-1 text-xs font-semibold text-stone-500 uppercase tracking-wide">
                      Status <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-sm text-stone-400">
                      No housing placements found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.id} className="border-b border-stone-100 hover:bg-stone-50">
                      <td className="p-4">
                        <p className="text-sm font-medium text-stone-800">{p.memberName}</p>
                      </td>
                      <td className="p-4">
                        <Badge variant="secondary">{HOUSING_TYPE_LABELS[p.housingType]}</Badge>
                      </td>
                      <td className="p-4 text-sm text-stone-600">{p.partnerOrganization}</td>
                      <td className="p-4 text-sm text-stone-600">
                        {toDate(p.moveInDate)?.toLocaleDateString() ?? '—'}
                      </td>
                      <td className="p-4">
                        <Badge variant={STATUS_BADGE_VARIANT[p.status]}>
                          {STATUS_LABELS[p.status]}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
