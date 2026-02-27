import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
  Badge, Button, Input,
  cn,
} from '@reprieve/shared';
import {
  getAuditLogFn, exportAuditLogFn,
} from '@reprieve/shared/services/firebase/functions';
import type {
  AuditLogEntry, AuditLogFilters,
} from '@reprieve/shared/services/firebase/functions';
import {
  ShieldCheck, Download, Search, ChevronDown, ChevronUp,
  ChevronLeft, ChevronRight, Clock, AlertTriangle, Info,
  AlertOctagon, Filter, Users, BarChart3, RefreshCw,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 25;

const ACTION_CATEGORIES = [
  'All',
  'User Management',
  'Moderation',
  'Content',
  'Settings',
  'Access',
  'Data Export',
] as const;

const SEVERITY_OPTIONS = ['All', 'info', 'warning', 'critical'] as const;

const SEVERITY_CONFIG: Record<string, {
  label: string;
  bg: string;
  text: string;
  icon: React.ElementType;
}> = {
  info: { label: 'Info', bg: 'bg-blue-100', text: 'text-blue-800', icon: Info },
  warning: { label: 'Warning', bg: 'bg-blue-100', text: 'text-blue-800', icon: AlertTriangle },
  critical: { label: 'Critical', bg: 'bg-red-100', text: 'text-red-800', icon: AlertOctagon },
};

const CATEGORY_COLORS: Record<string, string> = {
  'User Management': '#6366f1',
  'Moderation': '#3b82f6',
  'Content': '#10b981',
  'Settings': '#78716c',
  'Access': '#0ea5e9',
  'Data Export': '#a855f7',
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FilterState {
  dateFrom: string;
  dateTo: string;
  actionCategory: string;
  actorSearch: string;
  severity: string;
}

const INITIAL_FILTERS: FilterState = {
  dateFrom: '',
  dateTo: '',
  actionCategory: 'All',
  actorSearch: '',
  severity: 'All',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimestamp(createdAt: unknown): string {
  if (!createdAt) return 'N/A';

  // Firestore Timestamp serialized via onCall has _seconds + _nanoseconds
  const ts = createdAt as Record<string, unknown>;
  if (typeof ts._seconds === 'number') {
    return new Date(ts._seconds * 1000).toLocaleString();
  }

  // ISO string fallback
  if (typeof createdAt === 'string') {
    const d = new Date(createdAt);
    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleString();
  }

  return 'N/A';
}

function formatTimestampISO(createdAt: unknown): string {
  if (!createdAt) return '';
  const ts = createdAt as Record<string, unknown>;
  if (typeof ts._seconds === 'number') {
    return new Date(ts._seconds * 1000).toISOString();
  }
  if (typeof createdAt === 'string') {
    return createdAt;
  }
  return '';
}

function isToday(createdAt: unknown): boolean {
  const ts = createdAt as Record<string, unknown>;
  let d: Date | null = null;
  if (typeof ts?._seconds === 'number') {
    d = new Date(ts._seconds * 1000);
  } else if (typeof createdAt === 'string') {
    d = new Date(createdAt);
  }
  if (!d || isNaN(d.getTime())) return false;
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function isThisWeek(createdAt: unknown): boolean {
  const ts = createdAt as Record<string, unknown>;
  let d: Date | null = null;
  if (typeof ts?._seconds === 'number') {
    d = new Date(ts._seconds * 1000);
  } else if (typeof createdAt === 'string') {
    d = new Date(createdAt);
  }
  if (!d || isNaN(d.getTime())) return false;
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return d >= weekAgo && d <= now;
}

function buildFilterParams(filters: FilterState): AuditLogFilters {
  const params: AuditLogFilters = {};
  if (filters.dateFrom) params.dateFrom = filters.dateFrom;
  if (filters.dateTo) params.dateTo = filters.dateTo;
  if (filters.actionCategory !== 'All') {
    params.actionCategory = filters.actionCategory;
  }
  if (filters.actorSearch.trim()) {
    params.actorSearch = filters.actorSearch.trim();
  }
  if (filters.severity !== 'All') {
    params.severity = filters.severity;
  }
  return params;
}

function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Severity Badge
// ---------------------------------------------------------------------------

function SeverityBadge({ severity }: { readonly severity: string }) {
  const config = SEVERITY_CONFIG[severity];
  if (!config) return <Badge variant="secondary">{severity}</Badge>;

  const Icon = config.icon;
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
      config.bg, config.text,
    )}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// CSS-only Pie Chart
// ---------------------------------------------------------------------------

interface PieSlice {
  readonly label: string;
  readonly count: number;
  readonly color: string;
}

function PieChart({ slices }: { readonly slices: readonly PieSlice[] }) {
  const total = slices.reduce((sum, s) => sum + s.count, 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-slate-400">
        No data to display
      </div>
    );
  }

  // Build conic gradient
  let accumulated = 0;
  const gradientStops: string[] = [];
  for (const slice of slices) {
    if (slice.count === 0) continue;
    const startPct = (accumulated / total) * 100;
    accumulated += slice.count;
    const endPct = (accumulated / total) * 100;
    gradientStops.push(`${slice.color} ${startPct}% ${endPct}%`);
  }
  const gradient = `conic-gradient(${gradientStops.join(', ')})`;

  return (
    <div className="flex items-center gap-6">
      <div
        className="h-28 w-28 rounded-full shrink-0"
        style={{ background: gradient }}
        aria-label="Actions by category pie chart"
      />
      <div className="space-y-1.5">
        {slices
          .filter((s) => s.count > 0)
          .map((s) => (
            <div key={s.label} className="flex items-center gap-2 text-xs">
              <div
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-slate-600">{s.label}</span>
              <span className="text-slate-400">({s.count})</span>
            </div>
          ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Expandable Row Detail
// ---------------------------------------------------------------------------

function RowDetail({ entry }: { readonly entry: AuditLogEntry }) {
  return (
    <tr>
      <td colSpan={6} className="px-4 py-3 bg-slate-50 border-b border-slate-100">
        <div className="text-xs font-mono text-slate-600 whitespace-pre-wrap max-h-64 overflow-y-auto">
          {JSON.stringify(
            {
              id: entry.id,
              actor: entry.actor,
              action: entry.action,
              category: entry.category,
              target: entry.target ?? null,
              severity: entry.severity,
              details: entry.details ?? null,
              ip: entry.ip ?? null,
              createdAt: formatTimestampISO(entry.createdAt),
            },
            null,
            2,
          )}
        </div>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Summary Stats Section
// ---------------------------------------------------------------------------

interface SummaryStatsProps {
  readonly entries: readonly AuditLogEntry[];
  readonly totalEstimate: number;
}

function SummaryStats({ entries, totalEstimate }: SummaryStatsProps) {
  const todayCount = entries.filter((e) => isToday(e.createdAt)).length;
  const weekCount = entries.filter((e) => isThisWeek(e.createdAt)).length;

  // Category distribution
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const entry of entries) {
      const cat = entry.category ?? 'Unknown';
      counts[cat] = (counts[cat] ?? 0) + 1;
    }
    return counts;
  }, [entries]);

  const pieSlices: PieSlice[] = useMemo(() => {
    return Object.entries(CATEGORY_COLORS).map(([label, color]) => ({
      label,
      count: categoryCounts[label] ?? 0,
      color,
    }));
  }, [categoryCounts]);

  // Most active admins
  const topAdmins = useMemo(() => {
    const adminCounts: Record<string, { name: string; email: string; count: number }> = {};
    for (const entry of entries) {
      const uid = entry.actor.uid;
      if (!adminCounts[uid]) {
        adminCounts[uid] = {
          name: entry.actor.displayName,
          email: entry.actor.email,
          count: 0,
        };
      }
      adminCounts[uid] = {
        ...adminCounts[uid],
        count: adminCounts[uid].count + 1,
      };
    }
    return Object.values(adminCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [entries]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Action Counts */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400" />
            Activity Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-2 bg-slate-50 rounded-lg">
              <p className="text-xl font-bold text-slate-800">{todayCount}</p>
              <p className="text-xs text-slate-500">Today</p>
            </div>
            <div className="text-center p-2 bg-slate-50 rounded-lg">
              <p className="text-xl font-bold text-slate-800">{weekCount}</p>
              <p className="text-xs text-slate-500">This Week</p>
            </div>
            <div className="text-center p-2 bg-slate-50 rounded-lg">
              <p className="text-xl font-bold text-slate-800">{totalEstimate}</p>
              <p className="text-xs text-slate-500">Total</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Pie */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-slate-400" />
            Actions by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PieChart slices={pieSlices} />
        </CardContent>
      </Card>

      {/* Most Active Admins */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-400" />
            Most Active Admins
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topAdmins.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No data</p>
          ) : (
            <div className="space-y-2">
              {topAdmins.map((admin) => (
                <div
                  key={admin.email}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-700 truncate">
                      {admin.name}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {admin.email}
                    </p>
                  </div>
                  <Badge variant="secondary" className="ml-2 shrink-0">
                    {admin.count}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filter Panel
// ---------------------------------------------------------------------------

interface FilterPanelProps {
  readonly filters: FilterState;
  readonly onFilterChange: (filters: FilterState) => void;
  readonly onApply: () => void;
  readonly onReset: () => void;
}

function FilterPanel({ filters, onFilterChange, onApply, onReset }: FilterPanelProps) {
  const updateFilter = useCallback(
    <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
      onFilterChange({ ...filters, [key]: value });
    },
    [filters, onFilterChange],
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Date From */}
          <div>
            <label className="text-xs font-medium text-slate-600">Date From</label>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => updateFilter('dateFrom', e.target.value)}
              className="mt-1 h-9 text-sm"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="text-xs font-medium text-slate-600">Date To</label>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => updateFilter('dateTo', e.target.value)}
              className="mt-1 h-9 text-sm"
            />
          </div>

          {/* Action Category */}
          <div>
            <label className="text-xs font-medium text-slate-600">Action Type</label>
            <select
              value={filters.actionCategory}
              onChange={(e) => updateFilter('actionCategory', e.target.value)}
              className="mt-1 w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm"
            >
              {ACTION_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Actor Search */}
          <div>
            <label className="text-xs font-medium text-slate-600">Actor</label>
            <div className="relative mt-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search name or email"
                value={filters.actorSearch}
                onChange={(e) => updateFilter('actorSearch', e.target.value)}
                className="h-9 pl-8 text-sm"
              />
            </div>
          </div>

          {/* Severity */}
          <div>
            <label className="text-xs font-medium text-slate-600">Severity</label>
            <select
              value={filters.severity}
              onChange={(e) => updateFilter('severity', e.target.value)}
              className="mt-1 w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm"
            >
              {SEVERITY_OPTIONS.map((sev) => (
                <option key={sev} value={sev}>
                  {sev === 'All' ? 'All' : sev.charAt(0).toUpperCase() + sev.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <Button size="sm" onClick={onApply}>
            Apply Filters
          </Button>
          <Button size="sm" variant="outline" onClick={onReset}>
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main AuditLog Page
// ---------------------------------------------------------------------------

export default function AuditLog() {
  // State
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalEstimate, setTotalEstimate] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [sortAsc, setSortAsc] = useState(false);
  const [pageCursors, setPageCursors] = useState<string[]>(['']);

  // Fetch audit log entries
  const fetchEntries = useCallback(async (
    filterState: FilterState,
    cursor: string,
  ) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAuditLogFn({
        pageSize: PAGE_SIZE,
        startAfterTimestamp: cursor || undefined,
        filters: buildFilterParams(filterState),
      });
      setEntries(result.data.entries);
      setHasMore(result.data.hasMore);
      setTotalEstimate(result.data.totalEstimate);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load audit log';
      setError(message);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchEntries(INITIAL_FILTERS, '');
  }, [fetchEntries]);

  // Apply filters
  const handleApplyFilters = useCallback(() => {
    setAppliedFilters({ ...filters });
    setCurrentPage(0);
    setPageCursors(['']);
    fetchEntries(filters, '');
  }, [filters, fetchEntries]);

  // Reset filters
  const handleResetFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
    setAppliedFilters(INITIAL_FILTERS);
    setCurrentPage(0);
    setPageCursors(['']);
    fetchEntries(INITIAL_FILTERS, '');
  }, [fetchEntries]);

  // Pagination
  const handleNextPage = useCallback(() => {
    if (!hasMore || entries.length === 0) return;
    const lastEntry = entries[entries.length - 1];
    const cursor = formatTimestampISO(lastEntry.createdAt);
    const nextPage = currentPage + 1;
    const updatedCursors = [...pageCursors];
    if (updatedCursors.length <= nextPage) {
      updatedCursors.push(cursor);
    }
    setPageCursors(updatedCursors);
    setCurrentPage(nextPage);
    fetchEntries(appliedFilters, cursor);
  }, [hasMore, entries, currentPage, pageCursors, appliedFilters, fetchEntries]);

  const handlePrevPage = useCallback(() => {
    if (currentPage <= 0) return;
    const prevPage = currentPage - 1;
    setCurrentPage(prevPage);
    fetchEntries(appliedFilters, pageCursors[prevPage]);
  }, [currentPage, pageCursors, appliedFilters, fetchEntries]);

  // Sort toggle (client-side sort of current page)
  const sortedEntries = useMemo(() => {
    if (!sortAsc) return entries;
    return [...entries].reverse();
  }, [entries, sortAsc]);

  // Export CSV
  const handleExportCSV = useCallback(async () => {
    setExporting(true);
    try {
      const result = await exportAuditLogFn({
        filters: buildFilterParams(appliedFilters),
      });
      const exportEntries = result.data.entries;
      if (exportEntries.length === 0) {
        setError('No entries to export.');
        return;
      }

      // Build CSV
      const headers = [
        'Timestamp', 'Actor UID', 'Actor Email', 'Actor Name',
        'Action', 'Category', 'Severity', 'Target Type',
        'Target ID', 'Target Name', 'Details', 'IP',
      ];
      const rows = exportEntries.map((e) => [
        e.timestamp,
        e.actorUid,
        `"${(e.actorEmail ?? '').replace(/"/g, '""')}"`,
        `"${(e.actorName ?? '').replace(/"/g, '""')}"`,
        e.action,
        e.category,
        e.severity,
        e.targetType ?? '',
        e.targetId ?? '',
        `"${(e.targetName ?? '').replace(/"/g, '""')}"`,
        `"${(e.details ?? '').replace(/"/g, '""')}"`,
        e.ip ?? '',
      ]);
      const csvContent = [
        headers.join(','),
        ...rows.map((r) => r.join(',')),
      ].join('\n');

      const filename = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
      downloadCSV(csvContent, filename);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Export failed';
      setError(message);
    } finally {
      setExporting(false);
    }
  }, [appliedFilters]);

  // Toggle row expansion
  const handleRowClick = useCallback((id: string) => {
    setExpandedRowId((prev) => (prev === id ? null : id));
  }, []);

  // Loading skeleton
  if (loading && entries.length === 0) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-52 bg-slate-200 rounded animate-pulse" />
        <div className="h-4 w-80 bg-slate-100 rounded animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-36 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-20 bg-slate-100 rounded-xl animate-pulse" />
        <div className="h-80 bg-slate-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-blue-600" />
            Audit Log
          </h1>
          <p className="text-sm text-slate-500">
            Track all administrative actions for compliance and accountability
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchEntries(appliedFilters, pageCursors[currentPage])}
            disabled={loading}
          >
            <RefreshCw className={cn('h-4 w-4 mr-1.5', loading && 'animate-spin')} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleExportCSV}
            disabled={exporting}
          >
            {exporting ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-1.5" />
                Export CSV
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-center gap-2">
          <AlertOctagon className="h-4 w-4 shrink-0" />
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700 text-xs underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Summary Stats */}
      <SummaryStats entries={entries} totalEstimate={totalEstimate} />

      {/* Filters */}
      <FilterPanel
        filters={filters}
        onFilterChange={setFilters}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      {/* Log Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Log Entries</CardTitle>
              <CardDescription>
                Showing page {currentPage + 1} ({sortedEntries.length} entries)
                {totalEstimate > 0 && ` of ~${totalEstimate} total`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {sortedEntries.length === 0 ? (
            <div className="p-12 text-center">
              <ShieldCheck className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No audit log entries match your filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th
                      className="text-left px-4 py-2.5 font-medium text-slate-600 cursor-pointer select-none"
                      onClick={() => setSortAsc((prev) => !prev)}
                    >
                      <span className="flex items-center gap-1">
                        Timestamp
                        {sortAsc ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </span>
                    </th>
                    <th className="text-left px-4 py-2.5 font-medium text-slate-600">
                      Actor
                    </th>
                    <th className="text-left px-4 py-2.5 font-medium text-slate-600">
                      Action
                    </th>
                    <th className="text-left px-4 py-2.5 font-medium text-slate-600">
                      Target
                    </th>
                    <th className="text-left px-4 py-2.5 font-medium text-slate-600">
                      Severity
                    </th>
                    <th className="text-left px-4 py-2.5 font-medium text-slate-600">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEntries.map((entry) => (
                    <>
                      <tr
                        key={entry.id}
                        onClick={() => handleRowClick(entry.id)}
                        className={cn(
                          'border-b border-slate-100 cursor-pointer transition-colors',
                          expandedRowId === entry.id
                            ? 'bg-slate-50'
                            : 'hover:bg-slate-50/50',
                        )}
                      >
                        <td className="px-4 py-2.5 whitespace-nowrap text-slate-500 text-xs">
                          {formatTimestamp(entry.createdAt)}
                        </td>
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-slate-700 text-xs">
                            {entry.actor.displayName}
                          </p>
                          <p className="text-xs text-slate-400">
                            {entry.actor.email}
                          </p>
                        </td>
                        <td className="px-4 py-2.5">
                          <p className="font-mono text-xs text-slate-700">
                            {entry.action}
                          </p>
                          <p className="text-xs text-slate-400">
                            {entry.category}
                          </p>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-600">
                          {entry.target ? (
                            <span>
                              <span className="text-slate-400">
                                {entry.target.type}:
                              </span>{' '}
                              {entry.target.name ?? entry.target.id}
                            </span>
                          ) : (
                            <span className="text-slate-300">--</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <SeverityBadge severity={entry.severity} />
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-500 max-w-[200px] truncate">
                          {entry.details
                            ? JSON.stringify(entry.details).slice(0, 60) + '...'
                            : '--'}
                        </td>
                      </tr>
                      {expandedRowId === entry.id && (
                        <RowDetail key={`${entry.id}-detail`} entry={entry} />
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {sortedEntries.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
              <p className="text-xs text-slate-500">
                Page {currentPage + 1}
                {totalEstimate > 0 && (
                  <> of ~{Math.ceil(totalEstimate / PAGE_SIZE)}</>
                )}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePrevPage}
                  disabled={currentPage === 0 || loading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleNextPage}
                  disabled={!hasMore || loading}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
