import { useState, useMemo } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
  Badge, Button, Input,
  Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter,
  useCollection,
  formatDate, cn,
} from '@reprieve/shared';
import type { Donation, User } from '@reprieve/shared';
import {
  Heart, DollarSign, TrendingUp, Repeat, Users,
  Plus, Search, Edit, Eye, Calendar,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

interface StatProps {
  readonly label: string;
  readonly value: string;
  readonly change?: string;
  readonly changeType?: 'positive' | 'negative';
  readonly icon: React.ElementType;
  readonly iconBg: string;
}

function StatCard({ label, value, change, changeType, icon: Icon, iconBg }: StatProps) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <p className="text-2xl font-bold text-stone-800">{value}</p>
          <p className="text-xs text-stone-500">{label}</p>
        </div>
        {change && (
          <div className={cn(
            'flex items-center gap-0.5 text-xs font-medium',
            changeType === 'positive' ? 'text-green-600' : 'text-red-600',
          )}>
            {changeType === 'positive'
              ? <ArrowUpRight className="h-3.5 w-3.5" />
              : <ArrowDownRight className="h-3.5 w-3.5" />
            }
            {change}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Campaign types
// ---------------------------------------------------------------------------

interface Campaign {
  readonly id: string;
  readonly name: string;
  readonly goal: number;
  readonly raised: number;
  readonly donorCount: number;
  readonly active: boolean;
  readonly startDate: string;
  readonly endDate: string | null;
}

const MOCK_CAMPAIGNS: readonly Campaign[] = [
  {
    id: '1',
    name: 'Spring Re-Entry Fund',
    goal: 10000,
    raised: 7250,
    donorCount: 42,
    active: true,
    startDate: '2026-02-01',
    endDate: '2026-04-30',
  },
  {
    id: '2',
    name: 'Employment Training',
    goal: 5000,
    raised: 5000,
    donorCount: 28,
    active: false,
    startDate: '2025-11-01',
    endDate: '2026-01-31',
  },
  {
    id: '3',
    name: 'General Operations',
    goal: 25000,
    raised: 12480,
    donorCount: 96,
    active: true,
    startDate: '2026-01-01',
    endDate: null,
  },
];

// ---------------------------------------------------------------------------
// Campaign Card
// ---------------------------------------------------------------------------

function CampaignCard({ campaign }: { readonly campaign: Campaign }) {
  const progress = Math.min(Math.round((campaign.raised / campaign.goal) * 100), 100);
  const isComplete = campaign.raised >= campaign.goal;

  return (
    <div className="p-4 rounded-lg border border-stone-100 hover:bg-stone-50 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-stone-700">{campaign.name}</p>
        <Badge variant={campaign.active ? (isComplete ? 'success' : 'default') : 'secondary'}>
          {isComplete ? 'Goal Met' : campaign.active ? 'Active' : 'Ended'}
        </Badge>
      </div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg font-bold text-stone-800">
          ${campaign.raised.toLocaleString()}
        </span>
        <span className="text-sm text-stone-500">
          of ${campaign.goal.toLocaleString()}
        </span>
      </div>
      <div className="h-2 bg-stone-100 rounded-full overflow-hidden mb-2">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            isComplete ? 'bg-green-500' : 'bg-amber-600',
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-stone-500">
        <span>{campaign.donorCount} donors</span>
        <span>{progress}% of goal</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create Campaign Dialog
// ---------------------------------------------------------------------------

function CreateCampaignDialog({
  open,
  onClose,
}: {
  readonly open: boolean;
  readonly onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogHeader>
        <DialogTitle>Create Campaign</DialogTitle>
      </DialogHeader>
      <DialogContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-stone-700">Campaign Name</label>
            <Input placeholder="e.g., Spring Re-Entry Fund" className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-stone-700">Goal Amount ($)</label>
            <Input type="number" placeholder="10000" className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-stone-700">Start Date</label>
              <Input type="date" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-stone-700">End Date (optional)</label>
              <Input type="date" className="mt-1" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-stone-700">Description</label>
            <Input placeholder="Campaign description..." className="mt-1" />
          </div>
        </div>
      </DialogContent>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={onClose}>Create Campaign</Button>
      </DialogFooter>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Monthly Chart Data Builder
// ---------------------------------------------------------------------------

function buildMonthlyData(donations: readonly Donation[]): readonly { month: string; total: number }[] {
  const now = new Date();
  const months: { month: string; total: number }[] = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString('en-US', { month: 'short' });
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);

    const total = donations
      .filter((don) => {
        if (don.status !== 'completed') return false;
        const created = don.createdAt?.toDate?.();
        return created && created >= d && created <= monthEnd;
      })
      .reduce((sum, don) => sum + don.amount, 0);

    months.push({ month: label, total: Math.round(total) });
  }

  return months;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export default function Donations() {
  const { data: donations, loading: donationsLoading } = useCollection<Donation>('donations');
  const { data: users } = useCollection<User>('users');

  const [search, setSearch] = useState('');
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);

  const userMap = useMemo(() => {
    const map = new Map<string, User>();
    users.forEach((u) => map.set(u.uid, u));
    return map;
  }, [users]);

  // Computed stats
  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const completed = donations.filter((d) => d.status === 'completed');

    const thisMonth = completed
      .filter((d) => {
        const dt = d.createdAt?.toDate?.();
        return dt && dt >= monthStart;
      })
      .reduce((s, d) => s + d.amount, 0);

    const thisYear = completed
      .filter((d) => {
        const dt = d.createdAt?.toDate?.();
        return dt && dt >= yearStart;
      })
      .reduce((s, d) => s + d.amount, 0);

    const allTime = completed.reduce((s, d) => s + d.amount, 0);
    const recurring = donations.filter((d) => d.isRecurring && d.status === 'completed').length;

    return { thisMonth, thisYear, allTime, recurring };
  }, [donations]);

  const monthlyData = useMemo(() => buildMonthlyData(donations), [donations]);

  // Recent donations table
  const recentDonations = useMemo(() => {
    return [...donations]
      .sort((a, b) => {
        const da = a.createdAt?.toMillis?.() ?? 0;
        const db = b.createdAt?.toMillis?.() ?? 0;
        return db - da;
      })
      .filter((d) => {
        if (!search) return true;
        const q = search.toLowerCase();
        const donor = d.donorId ? userMap.get(d.donorId) : null;
        const name = donor?.displayName?.toLowerCase() ?? 'anonymous';
        return name.includes(q) || d.amount.toString().includes(q);
      })
      .slice(0, 50);
  }, [donations, search, userMap]);

  // Recurring subscribers
  const recurringDonors = useMemo(
    () => donations.filter((d) => d.isRecurring && d.status === 'completed'),
    [donations],
  );

  if (donationsLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 bg-stone-200 rounded animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
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
        <h1 className="text-2xl font-bold text-stone-800">Donations</h1>
        <p className="text-sm text-stone-500">Financial overview and campaign management</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="This Month"
          value={`$${stats.thisMonth.toLocaleString()}`}
          icon={DollarSign}
          iconBg="bg-green-100 text-green-700"
          change="+12%"
          changeType="positive"
        />
        <StatCard
          label="This Year"
          value={`$${stats.thisYear.toLocaleString()}`}
          icon={Calendar}
          iconBg="bg-blue-100 text-blue-700"
        />
        <StatCard
          label="All Time"
          value={`$${stats.allTime.toLocaleString()}`}
          icon={Heart}
          iconBg="bg-amber-100 text-amber-700"
        />
        <StatCard
          label="Recurring Donors"
          value={stats.recurring.toString()}
          icon={Repeat}
          iconBg="bg-purple-100 text-purple-700"
        />
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Donations</CardTitle>
          <CardDescription>Donation totals over the last 12 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData as { month: string; total: number }[]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#a8a29e" />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="#a8a29e"
                  tickFormatter={(v: number) => `$${v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e7e5e4',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Total']}
                />
                <Bar dataKey="total" fill="#b45309" radius={[4, 4, 0, 0]} name="Donations" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Donations Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Donations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <Input
                placeholder="Search donors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="max-h-80 overflow-y-auto">
              {recentDonations.length === 0 ? (
                <p className="text-sm text-stone-400 text-center py-6">No donations found.</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-stone-200">
                      <th className="py-2 text-left text-xs font-semibold text-stone-500 uppercase">Donor</th>
                      <th className="py-2 text-left text-xs font-semibold text-stone-500 uppercase">Amount</th>
                      <th className="py-2 text-left text-xs font-semibold text-stone-500 uppercase">Date</th>
                      <th className="py-2 text-left text-xs font-semibold text-stone-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentDonations.map((don) => {
                      const donor = don.donorId ? userMap.get(don.donorId) : null;
                      return (
                        <tr key={don.id} className="border-b border-stone-100">
                          <td className="py-2.5 text-sm text-stone-700">
                            {donor?.displayName ?? 'Anonymous'}
                            {don.isRecurring && (
                              <Repeat className="h-3 w-3 inline ml-1 text-purple-500" />
                            )}
                          </td>
                          <td className="py-2.5 text-sm font-medium text-stone-800">
                            ${don.amount.toFixed(2)}
                          </td>
                          <td className="py-2.5 text-xs text-stone-500">
                            {formatDate(don.createdAt)}
                          </td>
                          <td className="py-2.5">
                            <Badge
                              variant={
                                don.status === 'completed'
                                  ? 'success'
                                  : don.status === 'pending'
                                    ? 'default'
                                    : 'destructive'
                              }
                            >
                              {don.status}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Campaigns */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Campaigns</CardTitle>
              <Button size="sm" onClick={() => setCampaignDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1.5" />
                New Campaign
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {MOCK_CAMPAIGNS.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recurring Donors + Disbursements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recurring Subscribers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Repeat className="h-5 w-5 text-purple-500" />
              Recurring Donors
            </CardTitle>
            <CardDescription>{recurringDonors.length} active subscribers</CardDescription>
          </CardHeader>
          <CardContent>
            {recurringDonors.length === 0 ? (
              <p className="text-sm text-stone-400 text-center py-6">No recurring donors.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {recurringDonors.slice(0, 20).map((don) => {
                  const donor = don.donorId ? userMap.get(don.donorId) : null;
                  return (
                    <div
                      key={don.id}
                      className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0"
                    >
                      <span className="text-sm text-stone-700">
                        {donor?.displayName ?? 'Anonymous'}
                      </span>
                      <span className="text-sm font-medium text-stone-800">
                        ${don.amount.toFixed(2)}/mo
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Disbursement Tracking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-stone-400" />
              Disbursement Tracking
            </CardTitle>
            <CardDescription>How funds are allocated</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <DisbursementRow label="Member Support Services" amount={4200} percent={35} />
              <DisbursementRow label="Employment Training" amount={3000} percent={25} />
              <DisbursementRow label="Housing Assistance" amount={2400} percent={20} />
              <DisbursementRow label="Operations" amount={1440} percent={12} />
              <DisbursementRow label="Technology" amount={960} percent={8} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Campaign Dialog */}
      <CreateCampaignDialog
        open={campaignDialogOpen}
        onClose={() => setCampaignDialogOpen(false)}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Disbursement Row
// ---------------------------------------------------------------------------

function DisbursementRow({
  label,
  amount,
  percent,
}: {
  readonly label: string;
  readonly amount: number;
  readonly percent: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-stone-700">{label}</span>
        <span className="text-sm font-medium text-stone-800">${amount.toLocaleString()}</span>
      </div>
      <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-600 rounded-full transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-xs text-stone-400 mt-0.5">{percent}% of total</p>
    </div>
  );
}
