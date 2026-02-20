import { PageContainer, Card, CardHeader, CardTitle, CardContent } from '@nfp/shared';
import { Target, Briefcase, Calendar, MessageSquare } from 'lucide-react';

export default function Dashboard() {
  return (
    <PageContainer title="Welcome back" subtitle="Here's your progress overview">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Target className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-800">0</p>
              <p className="text-xs text-stone-500">Active Goals</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-green-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-800">0</p>
              <p className="text-xs text-stone-500">Applications</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-800">0</p>
              <p className="text-xs text-stone-500">Appointments</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-purple-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-800">0</p>
              <p className="text-xs text-stone-500">Messages</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-stone-600">
            Welcome to your Re-Entry dashboard. This is your command center for tracking goals,
            managing appointments, connecting with your case manager, and accessing tools to
            help you succeed. Start by setting your first goal.
          </p>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
