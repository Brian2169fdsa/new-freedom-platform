import { useState, useMemo, useCallback } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
  Badge, Button, Input,
  Tabs, TabsList, TabsTrigger, TabsContent,
  useCollection,
  toDate,
  formatRelative,
} from '@reprieve/shared';
import type { Conversation, Appointment, AppNotification, User } from '@reprieve/shared';
import { orderBy } from 'firebase/firestore';
import {
  MessageSquare, Calendar, Bell,
  Search, Download, ArrowUpDown, Filter,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

interface StatCardProps {
  readonly label: string;
  readonly value: string | number;
  readonly icon: React.ElementType;
  readonly iconBg: string;
}

function StatCard({ label, value, icon: Icon, iconBg }: StatCardProps) {
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
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Appointment type + status labels
// ---------------------------------------------------------------------------

const APPOINTMENT_TYPE_LABELS: Record<string, string> = {
  case_manager: 'Case Manager',
  mentor: 'Mentor',
  therapy: 'Therapy',
  court: 'Court',
  parole: 'Parole',
  medical: 'Medical',
  interview: 'Interview',
  aa_meeting: 'AA Meeting',
  other: 'Other',
};

const APPOINTMENT_STATUS_VARIANT: Record<string, 'success' | 'secondary' | 'warning' | 'destructive'> = {
  scheduled: 'secondary',
  completed: 'success',
  missed: 'destructive',
  cancelled: 'warning',
};

// ---------------------------------------------------------------------------
// CSV export helper
// ---------------------------------------------------------------------------

function downloadCsv(headers: string[], rows: string[][], filename: string) {
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function CommunicationLogs() {
  const { data: conversations, loading: convsLoading } = useCollection<Conversation>(
    'conversations',
    orderBy('lastMessageAt', 'desc'),
  );
  const { data: appointments, loading: apptsLoading } = useCollection<Appointment>(
    'appointments',
    orderBy('dateTime', 'desc'),
  );
  const { data: notifications, loading: notifsLoading } = useCollection<AppNotification>(
    'notifications',
    orderBy('createdAt', 'desc'),
  );
  const { data: members } = useCollection<User>('users');

  const loading = convsLoading || apptsLoading || notifsLoading;

  const [activeTab, setActiveTab] = useState('messages');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [apptTypeFilter, setApptTypeFilter] = useState('');
  const [apptStatusFilter, setApptStatusFilter] = useState('');

  // Member lookup
  const memberMap = useMemo(() => {
    const map = new Map<string, User>();
    for (const m of members) map.set(m.uid, m);
    return map;
  }, [members]);

  const getMemberName = (uid: string) => memberMap.get(uid)?.displayName ?? uid.slice(0, 8);

  // Date filter helper
  const isInDateRange = (date: unknown): boolean => {
    const d = toDate(date as any);
    if (!d) return true;
    if (dateFrom && d < new Date(dateFrom)) return false;
    if (dateTo) {
      const to = new Date(dateTo);
      to.setDate(to.getDate() + 1);
      if (d >= to) return false;
    }
    return true;
  };

  // --- Messages tab ---
  const filteredConversations = useMemo(() => {
    let result = [...conversations];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((c) => {
        const names = c.participants.map(getMemberName).join(' ').toLowerCase();
        return names.includes(q) || c.lastMessage?.toLowerCase().includes(q);
      });
    }
    result = result.filter((c) => isInDateRange(c.lastMessageAt));
    return result;
  }, [conversations, search, dateFrom, dateTo, memberMap]);

  // --- Appointments tab ---
  const filteredAppointments = useMemo(() => {
    let result = [...appointments];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((a) => {
        const name = getMemberName(a.userId).toLowerCase();
        return name.includes(q) || a.title.toLowerCase().includes(q);
      });
    }
    if (apptTypeFilter) result = result.filter((a) => a.type === apptTypeFilter);
    if (apptStatusFilter) result = result.filter((a) => a.status === apptStatusFilter);
    result = result.filter((a) => isInDateRange(a.dateTime));
    return result;
  }, [appointments, search, apptTypeFilter, apptStatusFilter, dateFrom, dateTo, memberMap]);

  // --- Notifications tab ---
  const filteredNotifications = useMemo(() => {
    let result = [...notifications];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (n) => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q),
      );
    }
    result = result.filter((n) => isInDateRange(n.createdAt));
    return result;
  }, [notifications, search, dateFrom, dateTo]);

  // CSV exports
  const handleExportMessages = useCallback(() => {
    downloadCsv(
      ['Participants', 'Last Message', 'Last Activity', 'Type'],
      filteredConversations.map((c) => [
        c.participants.map(getMemberName).join(', '),
        c.lastMessage ?? '',
        toDate(c.lastMessageAt)?.toLocaleString() ?? '',
        c.type,
      ]),
      'communication-messages',
    );
  }, [filteredConversations, memberMap]);

  const handleExportAppointments = useCallback(() => {
    downloadCsv(
      ['Member', 'Type', 'Title', 'Date/Time', 'Status', 'Location'],
      filteredAppointments.map((a) => [
        getMemberName(a.userId),
        APPOINTMENT_TYPE_LABELS[a.type] ?? a.type,
        a.title,
        toDate(a.dateTime)?.toLocaleString() ?? '',
        a.status,
        a.location ?? a.virtualLink ?? '',
      ]),
      'communication-appointments',
    );
  }, [filteredAppointments, memberMap]);

  const handleExportNotifications = useCallback(() => {
    downloadCsv(
      ['Title', 'Body', 'Type', 'Created', 'Read'],
      filteredNotifications.map((n) => [
        n.title,
        n.body,
        n.type,
        toDate(n.createdAt)?.toLocaleString() ?? '',
        n.read ? 'Yes' : 'No',
      ]),
      'communication-notifications',
    );
  }, [filteredNotifications]);

  const handleExport = () => {
    if (activeTab === 'messages') handleExportMessages();
    else if (activeTab === 'appointments') handleExportAppointments();
    else handleExportNotifications();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-stone-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
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
          <h1 className="text-2xl font-bold text-stone-800">Communication Logs</h1>
          <p className="text-stone-500 text-sm">Searchable log of all platform communications</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-1.5" />
          Export CSV
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Total Conversations"
          value={conversations.length}
          icon={MessageSquare}
          iconBg="bg-blue-100 text-blue-700"
        />
        <StatCard
          label="Total Appointments"
          value={appointments.length}
          icon={Calendar}
          iconBg="bg-green-100 text-green-700"
        />
        <StatCard
          label="System Notifications"
          value={notifications.length}
          icon={Bell}
          iconBg="bg-amber-100 text-amber-700"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <Input
                placeholder="Search messages, members, or appointments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-stone-500">From</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-36"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-stone-500">To</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-36"
              />
            </div>
            {activeTab === 'appointments' && (
              <>
                <select
                  value={apptTypeFilter}
                  onChange={(e) => setApptTypeFilter(e.target.value)}
                  className="h-10 rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-700"
                >
                  <option value="">All Types</option>
                  {Object.entries(APPOINTMENT_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <select
                  value={apptStatusFilter}
                  onChange={(e) => setApptStatusFilter(e.target.value)}
                  className="h-10 rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-700"
                >
                  <option value="">All Statuses</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="missed">Missed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="messages">
            <MessageSquare className="h-4 w-4 mr-1.5" />
            Messages ({filteredConversations.length})
          </TabsTrigger>
          <TabsTrigger value="appointments">
            <Calendar className="h-4 w-4 mr-1.5" />
            Appointments ({filteredAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-1.5" />
            Notifications ({filteredNotifications.length})
          </TabsTrigger>
        </TabsList>

        {/* Messages Tab */}
        <TabsContent value="messages">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-stone-200">
                      <th className="p-4 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Participants</th>
                      <th className="p-4 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Last Message</th>
                      <th className="p-4 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Type</th>
                      <th className="p-4 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Last Activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredConversations.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-sm text-stone-400">
                          No conversations found.
                        </td>
                      </tr>
                    ) : (
                      filteredConversations.map((c) => (
                        <tr key={c.id} className="border-b border-stone-100 hover:bg-stone-50">
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1">
                              {c.participants.map((uid) => (
                                <Badge key={uid} variant="secondary" className="text-xs">
                                  {getMemberName(uid)}
                                </Badge>
                              ))}
                            </div>
                          </td>
                          <td className="p-4 text-sm text-stone-600 max-w-xs truncate">
                            {c.lastMessage || '—'}
                          </td>
                          <td className="p-4">
                            <Badge variant="outline" className="capitalize">{c.type}</Badge>
                          </td>
                          <td className="p-4 text-sm text-stone-500">
                            {formatRelative(c.lastMessageAt)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appointments Tab */}
        <TabsContent value="appointments">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-stone-200">
                      <th className="p-4 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Member</th>
                      <th className="p-4 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Type</th>
                      <th className="p-4 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Title</th>
                      <th className="p-4 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Date/Time</th>
                      <th className="p-4 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppointments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-sm text-stone-400">
                          No appointments found.
                        </td>
                      </tr>
                    ) : (
                      filteredAppointments.map((a) => (
                        <tr key={a.id} className="border-b border-stone-100 hover:bg-stone-50">
                          <td className="p-4 text-sm font-medium text-stone-800">
                            {getMemberName(a.userId)}
                          </td>
                          <td className="p-4">
                            <Badge variant="secondary">
                              {APPOINTMENT_TYPE_LABELS[a.type] ?? a.type}
                            </Badge>
                          </td>
                          <td className="p-4 text-sm text-stone-600">{a.title}</td>
                          <td className="p-4 text-sm text-stone-600">
                            {toDate(a.dateTime)?.toLocaleString() ?? '—'}
                          </td>
                          <td className="p-4">
                            <Badge variant={APPOINTMENT_STATUS_VARIANT[a.status] ?? 'secondary'} className="capitalize">
                              {a.status}
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
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-stone-200">
                      <th className="p-4 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Title</th>
                      <th className="p-4 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Body</th>
                      <th className="p-4 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Type</th>
                      <th className="p-4 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Created</th>
                      <th className="p-4 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Read</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredNotifications.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-sm text-stone-400">
                          No notifications found.
                        </td>
                      </tr>
                    ) : (
                      filteredNotifications.map((n) => (
                        <tr key={n.id} className="border-b border-stone-100 hover:bg-stone-50">
                          <td className="p-4 text-sm font-medium text-stone-800">{n.title}</td>
                          <td className="p-4 text-sm text-stone-600 max-w-xs truncate">{n.body}</td>
                          <td className="p-4">
                            <Badge variant="outline" className="capitalize">
                              {n.type.replace(/_/g, ' ')}
                            </Badge>
                          </td>
                          <td className="p-4 text-sm text-stone-500">
                            {formatRelative(n.createdAt)}
                          </td>
                          <td className="p-4">
                            <Badge variant={n.read ? 'secondary' : 'warning'}>
                              {n.read ? 'Read' : 'Unread'}
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
