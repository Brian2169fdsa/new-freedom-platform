import { useState, useMemo } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
  Badge, Button, Input,
  Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter,
  useCollection,
  cn, LANE_NAMES,
} from '@reprieve/shared';
import type { User, Lane } from '@reprieve/shared';
import {
  FileBarChart, Download, FileText, Calendar,
  Filter, Clock, Repeat, Plus, Trash2,
  FileSpreadsheet, File, ChevronRight,
  Users, Briefcase, Heart, Activity, DollarSign, Scale,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Report Type Definitions
// ---------------------------------------------------------------------------

interface ReportType {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly icon: React.ElementType;
  readonly iconBg: string;
}

const REPORT_TYPES: readonly ReportType[] = [
  {
    id: 'member_outcomes',
    label: 'Member Outcomes',
    description: 'Enrollment, graduation rates, and milestone achievements',
    icon: Users,
    iconBg: 'bg-amber-100 text-amber-700',
  },
  {
    id: 'employment',
    label: 'Employment',
    description: 'Job placements, retention rates, and employer partnerships',
    icon: Briefcase,
    iconBg: 'bg-blue-100 text-blue-700',
  },
  {
    id: 'sobriety',
    label: 'Sobriety',
    description: 'Sobriety milestones, check-in data, and relapse prevention',
    icon: Heart,
    iconBg: 'bg-green-100 text-green-700',
  },
  {
    id: 'program_activity',
    label: 'Program Activity',
    description: 'Course completion, engagement metrics, and participation',
    icon: Activity,
    iconBg: 'bg-purple-100 text-purple-700',
  },
  {
    id: 'financial',
    label: 'Financial',
    description: 'Donations, campaign performance, and disbursements',
    icon: DollarSign,
    iconBg: 'bg-emerald-100 text-emerald-700',
  },
  {
    id: 'court_compliance',
    label: 'Court Compliance',
    description: 'Attendance records, milestones for court reporting',
    icon: Scale,
    iconBg: 'bg-red-100 text-red-700',
  },
];

// ---------------------------------------------------------------------------
// Scheduled Report
// ---------------------------------------------------------------------------

interface ScheduledReport {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly frequency: 'weekly' | 'monthly';
  readonly lastRun: string;
  readonly nextRun: string;
  readonly recipients: string[];
}

const MOCK_SCHEDULED: readonly ScheduledReport[] = [
  {
    id: '1',
    name: 'Weekly Program Activity',
    type: 'program_activity',
    frequency: 'weekly',
    lastRun: 'Feb 13, 2026',
    nextRun: 'Feb 20, 2026',
    recipients: ['admin@newfreedom.org'],
  },
  {
    id: '2',
    name: 'Monthly Member Outcomes',
    type: 'member_outcomes',
    frequency: 'monthly',
    lastRun: 'Jan 31, 2026',
    nextRun: 'Feb 28, 2026',
    recipients: ['admin@newfreedom.org', 'director@newfreedom.org'],
  },
  {
    id: '3',
    name: 'Court Compliance Report',
    type: 'court_compliance',
    frequency: 'monthly',
    lastRun: 'Jan 31, 2026',
    nextRun: 'Feb 28, 2026',
    recipients: ['compliance@newfreedom.org'],
  },
];

// ---------------------------------------------------------------------------
// Report Builder
// ---------------------------------------------------------------------------

function ReportBuilder({
  selectedType,
  onClose,
}: {
  readonly selectedType: ReportType;
  readonly onClose: () => void;
}) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [laneFilter, setLaneFilter] = useState<Lane | ''>('');
  const [generating, setGenerating] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    // Simulate report generation
    setTimeout(() => {
      setGenerating(false);
      setPreviewReady(true);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <button
        onClick={onClose}
        className="text-sm text-stone-500 hover:text-stone-700 flex items-center gap-1"
      >
        &larr; Back to report types
      </button>

      {/* Report Type Header */}
      <div className="flex items-center gap-4">
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${selectedType.iconBg}`}>
          <selectedType.icon className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-stone-800">{selectedType.label} Report</h2>
          <p className="text-sm text-stone-500">{selectedType.description}</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-stone-400" />
            Report Parameters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-stone-700">Date From</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-stone-700">Date To</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-stone-700">Lane</label>
              <select
                value={laneFilter}
                onChange={(e) => setLaneFilter(e.target.value as Lane | '')}
                className="mt-1 w-full h-10 rounded-lg border border-stone-300 bg-white px-3 text-sm"
              >
                <option value="">All Lanes</option>
                <option value="lane1">{LANE_NAMES.lane1}</option>
                <option value="lane2">{LANE_NAMES.lane2}</option>
                <option value="lane3">{LANE_NAMES.lane3}</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-stone-700">Center</label>
              <select className="mt-1 w-full h-10 rounded-lg border border-stone-300 bg-white px-3 text-sm">
                <option value="">All Centers</option>
                <option value="main">New Freedom AZ - Main</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-stone-700">Case Manager</label>
              <select className="mt-1 w-full h-10 rounded-lg border border-stone-300 bg-white px-3 text-sm">
                <option value="">All Case Managers</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <FileBarChart className="h-4 w-4 mr-1.5" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Panel */}
      {previewReady && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Report Preview</CardTitle>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline">
                  <File className="h-4 w-4 mr-1.5" />
                  PDF
                </Button>
                <Button size="sm" variant="outline">
                  <FileSpreadsheet className="h-4 w-4 mr-1.5" />
                  Excel
                </Button>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-1.5" />
                  CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border border-stone-200 rounded-lg p-6 space-y-4">
              <div className="text-center border-b border-stone-200 pb-4">
                <h3 className="text-lg font-bold text-stone-800">
                  {selectedType.label} Report
                </h3>
                <p className="text-sm text-stone-500">
                  New Freedom AZ &middot;{' '}
                  {dateFrom || 'Start'} to {dateTo || 'Present'}
                </p>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-3 bg-stone-50 rounded-lg">
                  <p className="text-xl font-bold text-stone-800">142</p>
                  <p className="text-xs text-stone-500">Total Members</p>
                </div>
                <div className="text-center p-3 bg-stone-50 rounded-lg">
                  <p className="text-xl font-bold text-stone-800">89</p>
                  <p className="text-xs text-stone-500">Active</p>
                </div>
                <div className="text-center p-3 bg-stone-50 rounded-lg">
                  <p className="text-xl font-bold text-stone-800">32</p>
                  <p className="text-xs text-stone-500">Graduated</p>
                </div>
                <div className="text-center p-3 bg-stone-50 rounded-lg">
                  <p className="text-xl font-bold text-stone-800">73%</p>
                  <p className="text-xs text-stone-500">Success Rate</p>
                </div>
              </div>

              <p className="text-xs text-stone-400 text-center">
                Report generated {new Date().toLocaleDateString()} - Data is illustrative
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Schedule Report Dialog
// ---------------------------------------------------------------------------

function ScheduleReportDialog({
  open,
  onClose,
}: {
  readonly open: boolean;
  readonly onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogHeader>
        <DialogTitle>Schedule Automated Report</DialogTitle>
      </DialogHeader>
      <DialogContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-stone-700">Report Name</label>
            <Input placeholder="e.g., Weekly Activity Summary" className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-stone-700">Report Type</label>
            <select className="mt-1 w-full h-10 rounded-lg border border-stone-300 bg-white px-3 text-sm">
              {REPORT_TYPES.map((rt) => (
                <option key={rt.id} value={rt.id}>{rt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-stone-700">Frequency</label>
            <select className="mt-1 w-full h-10 rounded-lg border border-stone-300 bg-white px-3 text-sm">
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-stone-700">
              Recipients (comma-separated emails)
            </label>
            <Input placeholder="admin@newfreedom.org" className="mt-1" />
          </div>
        </div>
      </DialogContent>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={onClose}>Schedule Report</Button>
      </DialogFooter>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export default function Reports() {
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  if (selectedType) {
    return (
      <ReportBuilder
        selectedType={selectedType}
        onClose={() => setSelectedType(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Reports</h1>
          <p className="text-sm text-stone-500">Generate and schedule outcome reports</p>
        </div>
      </div>

      {/* Report Type Grid */}
      <div>
        <h2 className="text-sm font-semibold text-stone-500 uppercase mb-3">Select Report Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {REPORT_TYPES.map((rt) => (
            <Card
              key={rt.id}
              className="hover:border-amber-300 transition-colors cursor-pointer"
              onClick={() => setSelectedType(rt)}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${rt.iconBg}`}>
                    <rt.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-stone-800">{rt.label}</p>
                    <p className="text-xs text-stone-500 mt-0.5">{rt.description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-stone-300 shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Scheduled Reports */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Repeat className="h-5 w-5 text-stone-400" />
                Scheduled Reports
              </CardTitle>
              <CardDescription>Automated report generation and delivery</CardDescription>
            </div>
            <Button size="sm" onClick={() => setScheduleOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Schedule New
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {MOCK_SCHEDULED.map((report) => {
              const rt = REPORT_TYPES.find((r) => r.id === report.type);
              return (
                <div
                  key={report.id}
                  className="flex items-center gap-4 p-3 rounded-lg border border-stone-100 hover:bg-stone-50"
                >
                  {rt && (
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${rt.iconBg}`}>
                      <rt.icon className="h-4 w-4" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-700">{report.name}</p>
                    <p className="text-xs text-stone-500">
                      {report.recipients.join(', ')}
                    </p>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {report.frequency}
                  </Badge>
                  <div className="text-right">
                    <p className="text-xs text-stone-500">
                      <Clock className="h-3 w-3 inline mr-1" />
                      Next: {report.nextRun}
                    </p>
                    <p className="text-xs text-stone-400">Last: {report.lastRun}</p>
                  </div>
                  <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Schedule Dialog */}
      <ScheduleReportDialog
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
      />
    </div>
  );
}
