import { PageContainer, Card, CardContent } from '@reprieve/shared';
import { useAuth } from '@reprieve/shared/hooks/useAuth';
import { useCollection } from '@reprieve/shared/hooks/useFirestore';
import { where } from 'firebase/firestore';
import {
  FileText,
  Briefcase,
  DollarSign,
  Calendar,
  FolderOpen,
  ChevronRight,
  Mic,
  FileCheck,
  Send,
  Clock,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

const tools = [
  {
    icon: FolderOpen,
    label: 'Document Vault',
    description: 'Store IDs, certificates, court papers',
    path: '/tools/documents',
    color: 'bg-amber-100 text-amber-700',
  },
  {
    icon: FileText,
    label: 'Resume Builder',
    description: 'Create a gap-friendly resume',
    path: '/tools/resume',
    color: 'bg-blue-100 text-blue-700',
  },
  {
    icon: Briefcase,
    label: 'Job Board',
    description: 'Fair-chance employer listings',
    path: '/tools/jobs',
    color: 'bg-green-100 text-green-700',
  },
  {
    icon: DollarSign,
    label: 'Budget Tracker',
    description: 'Track income and expenses',
    path: '/tools/budget',
    color: 'bg-purple-100 text-purple-700',
  },
  {
    icon: Calendar,
    label: 'Calendar',
    description: 'Appointments and court dates',
    path: '/tools/calendar',
    color: 'bg-red-100 text-red-700',
  },
  {
    icon: Mic,
    label: 'Mock Interview',
    description: 'Practice with AI-powered interviews',
    path: '/tools/interview',
    color: 'bg-teal-100 text-teal-700',
  },
];

// ---------------------------------------------------------------------------
// Quick Stats
// ---------------------------------------------------------------------------

interface QuickStatProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  loading: boolean;
}

function QuickStat({ icon, label, value, loading }: QuickStatProps) {
  return (
    <div className="flex flex-col items-center justify-center p-3 text-center">
      <div className="mb-1.5">{icon}</div>
      {loading ? (
        <div className="animate-pulse h-7 w-8 rounded bg-stone-200 mb-1" />
      ) : (
        <p className="text-xl font-bold text-stone-800">{value}</p>
      )}
      <p className="text-[11px] text-stone-500 leading-tight">{label}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function Tools() {
  const { firebaseUser } = useAuth();
  const uid = firebaseUser?.uid;

  const { data: documents, loading: docsLoading } = useCollection(
    'documents',
    ...(uid ? [where('userId', '==', uid)] : []),
  );

  const { data: jobApps, loading: jobsLoading } = useCollection(
    'jobApplications',
    ...(uid ? [where('userId', '==', uid)] : []),
  );

  const { data: appointments, loading: apptsLoading } = useCollection(
    'appointments',
    ...(uid ? [where('userId', '==', uid)] : []),
  );

  const upcomingCount = appointments.filter((a) => {
    const dt = (a as any).dateTime;
    if (!dt || typeof dt.toDate !== 'function') return false;
    return dt.toDate() > new Date();
  }).length;

  return (
    <PageContainer title="Tools" subtitle="Everything you need in one place">
      {/* Quick Stats */}
      <Card className="bg-gradient-to-br from-amber-50 to-stone-50 border-amber-200">
        <CardContent className="p-2">
          <div className="grid grid-cols-3 divide-x divide-stone-200">
            <QuickStat
              icon={<FileCheck className="h-5 w-5 text-amber-600" />}
              label="Documents"
              value={documents.length}
              loading={docsLoading}
            />
            <QuickStat
              icon={<Send className="h-5 w-5 text-blue-600" />}
              label="Applications"
              value={jobApps.length}
              loading={jobsLoading}
            />
            <QuickStat
              icon={<Clock className="h-5 w-5 text-red-600" />}
              label="Upcoming"
              value={upcomingCount}
              loading={apptsLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tool Cards */}
      <div className="space-y-3">
        {tools.map((tool) => (
          <Link key={tool.label} to={tool.path} className="block group">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`h-12 w-12 rounded-xl flex items-center justify-center ${tool.color}`}
                  >
                    <tool.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-stone-800">{tool.label}</h3>
                    <p className="text-sm text-stone-500">{tool.description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-stone-300 group-hover:text-amber-500 transition-colors flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </PageContainer>
  );
}
