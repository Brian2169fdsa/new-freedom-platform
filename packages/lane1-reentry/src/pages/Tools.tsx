import { PageContainer, Card, CardContent, CardHeader, CardTitle } from '@nfp/shared';
import { FileText, Briefcase, DollarSign, Calendar, FolderOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

const tools = [
  { icon: FolderOpen, label: 'Document Vault', description: 'Store IDs, certificates, court papers', path: '/tools/documents', color: 'bg-amber-100 text-amber-700' },
  { icon: FileText, label: 'Resume Builder', description: 'Create a gap-friendly resume', path: '/tools/resume', color: 'bg-blue-100 text-blue-700' },
  { icon: Briefcase, label: 'Job Search', description: 'Fair-chance employer listings', path: '/tools/jobs', color: 'bg-green-100 text-green-700' },
  { icon: DollarSign, label: 'Budget Tracker', description: 'Track income and expenses', path: '/tools/budget', color: 'bg-purple-100 text-purple-700' },
  { icon: Calendar, label: 'Calendar', description: 'Appointments and court dates', path: '/tools/calendar', color: 'bg-red-100 text-red-700' },
];

export default function Tools() {
  return (
    <PageContainer title="Tools" subtitle="Everything you need in one place">
      <div className="space-y-3">
        {tools.map((tool) => (
          <Card key={tool.label} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${tool.color}`}>
                  <tool.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-medium text-stone-800">{tool.label}</h3>
                  <p className="text-sm text-stone-500">{tool.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}
