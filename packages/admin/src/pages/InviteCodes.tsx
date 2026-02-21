import { useState, useMemo, useCallback } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
  Badge, Button, Input,
  Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter,
  useCollection,
  formatDate, formatDateTime, cn, LANE_NAMES,
} from '@reprieve/shared';
import type { Lane } from '@reprieve/shared';
import {
  Ticket, Plus, Copy, Power, PowerOff,
  Search, Calendar, Users, ChevronDown, ChevronUp,
  Download, Zap, Clock, Hash,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface InviteCode {
  readonly id: string;
  readonly code: string;
  readonly createdBy: string;
  readonly createdByName: string;
  readonly maxUses: number;
  readonly usesRemaining: number;
  readonly expiresAt: Date | null;
  readonly allowedLanes: Lane[];
  readonly active: boolean;
  readonly createdAt: Date;
  readonly usageHistory: readonly {
    readonly userId: string;
    readonly userName: string;
    readonly usedAt: Date;
  }[];
}

// ---------------------------------------------------------------------------
// Mock data (would come from Firestore in production)
// ---------------------------------------------------------------------------

const MOCK_CODES: readonly InviteCode[] = [
  {
    id: '1',
    code: 'NFREE-2026-A',
    createdBy: 'admin1',
    createdByName: 'Admin User',
    maxUses: 50,
    usesRemaining: 32,
    expiresAt: new Date('2026-06-30'),
    allowedLanes: ['lane1', 'lane2', 'lane3'],
    active: true,
    createdAt: new Date('2026-01-15'),
    usageHistory: [
      { userId: 'u1', userName: 'John D.', usedAt: new Date('2026-02-10') },
      { userId: 'u2', userName: 'Maria S.', usedAt: new Date('2026-02-12') },
      { userId: 'u3', userName: 'James W.', usedAt: new Date('2026-02-14') },
    ],
  },
  {
    id: '2',
    code: 'EVENT-FEB-01',
    createdBy: 'admin1',
    createdByName: 'Admin User',
    maxUses: 20,
    usesRemaining: 15,
    expiresAt: new Date('2026-03-01'),
    allowedLanes: ['lane1'],
    active: true,
    createdAt: new Date('2026-02-01'),
    usageHistory: [
      { userId: 'u4', userName: 'Sarah L.', usedAt: new Date('2026-02-05') },
    ],
  },
  {
    id: '3',
    code: 'COURT-REF-01',
    createdBy: 'admin2',
    createdByName: 'Case Manager A',
    maxUses: 10,
    usesRemaining: 0,
    expiresAt: null,
    allowedLanes: ['lane1'],
    active: false,
    createdAt: new Date('2025-11-01'),
    usageHistory: [],
  },
  {
    id: '4',
    code: 'STEP-SPRING',
    createdBy: 'admin1',
    createdByName: 'Admin User',
    maxUses: 100,
    usesRemaining: 88,
    expiresAt: new Date('2026-05-01'),
    allowedLanes: ['lane2'],
    active: true,
    createdAt: new Date('2026-02-15'),
    usageHistory: [],
  },
];

// ---------------------------------------------------------------------------
// Sort helpers
// ---------------------------------------------------------------------------

type SortField = 'code' | 'uses' | 'expiry' | 'created';
type SortDir = 'asc' | 'desc';

function compareCode(a: InviteCode, b: InviteCode, field: SortField, dir: SortDir): number {
  let cmp = 0;
  switch (field) {
    case 'code':
      cmp = a.code.localeCompare(b.code);
      break;
    case 'uses':
      cmp = a.usesRemaining - b.usesRemaining;
      break;
    case 'expiry': {
      const da = a.expiresAt?.getTime() ?? Infinity;
      const db = b.expiresAt?.getTime() ?? Infinity;
      cmp = da - db;
      break;
    }
    case 'created':
      cmp = a.createdAt.getTime() - b.createdAt.getTime();
      break;
  }
  return dir === 'asc' ? cmp : -cmp;
}

// ---------------------------------------------------------------------------
// Generate Code Dialog
// ---------------------------------------------------------------------------

function GenerateCodeDialog({
  open,
  onClose,
}: {
  readonly open: boolean;
  readonly onClose: () => void;
}) {
  const [maxUses, setMaxUses] = useState('50');
  const [expiryDate, setExpiryDate] = useState('');
  const [lanes, setLanes] = useState<Set<Lane>>(new Set(['lane1', 'lane2', 'lane3']));

  const toggleLane = (lane: Lane) => {
    setLanes((prev) => {
      const next = new Set(prev);
      if (next.has(lane)) {
        next.delete(lane);
      } else {
        next.add(lane);
      }
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogHeader>
        <DialogTitle>Generate Invite Code</DialogTitle>
      </DialogHeader>
      <DialogContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-stone-700">Max Uses</label>
            <Input
              type="number"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              min="1"
              max="1000"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-stone-700">Expiry Date (optional)</label>
            <Input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-stone-700 block mb-2">Allowed Lanes</label>
            <div className="flex gap-3">
              {(['lane1', 'lane2', 'lane3'] as Lane[]).map((lane) => (
                <label key={lane} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={lanes.has(lane)}
                    onChange={() => toggleLane(lane)}
                    className="rounded border-stone-300"
                  />
                  <span className="text-sm text-stone-700">{LANE_NAMES[lane]}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={onClose} disabled={lanes.size === 0}>
          <Ticket className="h-4 w-4 mr-1.5" />
          Generate
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Bulk Generate Dialog
// ---------------------------------------------------------------------------

function BulkGenerateDialog({
  open,
  onClose,
}: {
  readonly open: boolean;
  readonly onClose: () => void;
}) {
  const [count, setCount] = useState('10');
  const [prefix, setPrefix] = useState('EVENT');
  const [maxUses, setMaxUses] = useState('1');

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogHeader>
        <DialogTitle>Bulk Generate Codes</DialogTitle>
      </DialogHeader>
      <DialogContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-stone-700">Number of Codes</label>
            <Input
              type="number"
              value={count}
              onChange={(e) => setCount(e.target.value)}
              min="1"
              max="100"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-stone-700">Code Prefix</label>
            <Input
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="EVENT"
              className="mt-1"
            />
            <p className="text-xs text-stone-400 mt-1">
              Codes will be: {prefix}-001, {prefix}-002, etc.
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-stone-700">Max Uses per Code</label>
            <Input
              type="number"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              min="1"
              className="mt-1"
            />
          </div>
        </div>
      </DialogContent>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={onClose}>
          <Zap className="h-4 w-4 mr-1.5" />
          Generate {count} Codes
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Usage History Panel
// ---------------------------------------------------------------------------

function UsageHistoryPanel({
  code,
  onClose,
}: {
  readonly code: InviteCode;
  readonly onClose: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            Usage History: <span className="font-mono">{code.code}</span>
          </CardTitle>
          <Button size="sm" variant="ghost" onClick={onClose}>Close</Button>
        </div>
        <CardDescription>
          {code.maxUses - code.usesRemaining} of {code.maxUses} uses consumed
        </CardDescription>
      </CardHeader>
      <CardContent>
        {code.usageHistory.length === 0 ? (
          <p className="text-sm text-stone-400 text-center py-6">
            No one has used this code yet.
          </p>
        ) : (
          <div className="space-y-2">
            {code.usageHistory.map((usage) => (
              <div
                key={usage.userId}
                className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-stone-400" />
                  <span className="text-sm text-stone-700">{usage.userName}</span>
                </div>
                <span className="text-xs text-stone-500">
                  {usage.usedAt.toLocaleDateString()} at{' '}
                  {usage.usedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
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
      className="flex items-center gap-1 text-xs font-semibold text-stone-500 uppercase hover:text-stone-700"
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

export default function InviteCodes() {
  const [codes] = useState<readonly InviteCode[]>(MOCK_CODES);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('created');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [generateOpen, setGenerateOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [selectedCode, setSelectedCode] = useState<InviteCode | null>(null);

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
    return [...codes]
      .filter((c) => c.code.toLowerCase().includes(q) || c.createdByName.toLowerCase().includes(q))
      .sort((a, b) => compareCode(a, b, sortField, sortDir));
  }, [codes, search, sortField, sortDir]);

  const activeCodes = codes.filter((c) => c.active).length;
  const totalUses = codes.reduce((sum, c) => sum + (c.maxUses - c.usesRemaining), 0);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {
      // Fallback: silently fail
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Invite Codes</h1>
          <p className="text-sm text-stone-500">
            {activeCodes} active codes, {totalUses} total uses
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setBulkOpen(true)}>
            <Zap className="h-4 w-4 mr-1.5" />
            Bulk Generate
          </Button>
          <Button size="sm" onClick={() => setGenerateOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Generate Code
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Ticket className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <p className="text-xl font-bold text-stone-800">{codes.length}</p>
              <p className="text-xs text-stone-500">Total Codes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Power className="h-5 w-5 text-green-700" />
            </div>
            <div>
              <p className="text-xl font-bold text-stone-800">{activeCodes}</p>
              <p className="text-xs text-stone-500">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <p className="text-xl font-bold text-stone-800">{totalUses}</p>
              <p className="text-xs text-stone-500">Total Uses</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-stone-100 flex items-center justify-center">
              <Hash className="h-5 w-5 text-stone-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-stone-800">
                {codes.reduce((s, c) => s + c.usesRemaining, 0)}
              </p>
              <p className="text-xs text-stone-500">Uses Remaining</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
        <Input
          placeholder="Search codes or creators..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="p-4 text-left">
                    <SortHeader label="Code" field="code" currentField={sortField} dir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="p-4 text-left">
                    <span className="text-xs font-semibold text-stone-500 uppercase">Created By</span>
                  </th>
                  <th className="p-4 text-left">
                    <SortHeader label="Uses" field="uses" currentField={sortField} dir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="p-4 text-left">
                    <SortHeader label="Expires" field="expiry" currentField={sortField} dir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="p-4 text-left">
                    <span className="text-xs font-semibold text-stone-500 uppercase">Lanes</span>
                  </th>
                  <th className="p-4 text-left">
                    <span className="text-xs font-semibold text-stone-500 uppercase">Status</span>
                  </th>
                  <th className="p-4 w-32" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-stone-400">
                      No invite codes found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((code) => {
                    const isExpired = code.expiresAt && code.expiresAt < new Date();
                    const isExhausted = code.usesRemaining <= 0;

                    return (
                      <tr
                        key={code.id}
                        className="border-b border-stone-100 hover:bg-stone-50 transition-colors cursor-pointer"
                        onClick={() => setSelectedCode(code)}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono font-medium text-stone-800">
                              {code.code}
                            </code>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(code.code);
                              }}
                              className="text-stone-400 hover:text-stone-600"
                              title="Copy code"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-stone-600">{code.createdByName}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-stone-700">
                              {code.usesRemaining}/{code.maxUses}
                            </span>
                            <div className="w-16 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-600 rounded-full"
                                style={{
                                  width: `${((code.maxUses - code.usesRemaining) / code.maxUses) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-stone-600">
                          {code.expiresAt ? (
                            <span className={isExpired ? 'text-red-600' : ''}>
                              {code.expiresAt.toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-stone-400">No expiry</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-1">
                            {code.allowedLanes.map((l) => (
                              <Badge key={l} variant="secondary">{LANE_NAMES[l]}</Badge>
                            ))}
                          </div>
                        </td>
                        <td className="p-4">
                          {!code.active || isExhausted ? (
                            <Badge variant="destructive">
                              {isExhausted ? 'Exhausted' : 'Inactive'}
                            </Badge>
                          ) : isExpired ? (
                            <Badge variant="warning">Expired</Badge>
                          ) : (
                            <Badge variant="success">Active</Badge>
                          )}
                        </td>
                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              // Toggle active/inactive
                            }}
                            title={code.active ? 'Deactivate' : 'Reactivate'}
                          >
                            {code.active ? (
                              <PowerOff className="h-3.5 w-3.5 text-red-500" />
                            ) : (
                              <Power className="h-3.5 w-3.5 text-green-500" />
                            )}
                          </Button>
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

      {/* Usage History */}
      {selectedCode && (
        <UsageHistoryPanel
          code={selectedCode}
          onClose={() => setSelectedCode(null)}
        />
      )}

      {/* Dialogs */}
      <GenerateCodeDialog
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
      />
      <BulkGenerateDialog
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
      />
    </div>
  );
}
