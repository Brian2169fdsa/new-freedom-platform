import { Card, CardHeader, CardTitle, CardContent } from '@nfp/shared';
import { Users, UserCog, BookOpen, Shield } from 'lucide-react';

const stats = [
  { label: 'Total Members', value: '0', icon: Users, color: 'bg-amber-100 text-amber-700' },
  { label: 'Active Case Managers', value: '0', icon: UserCog, color: 'bg-blue-100 text-blue-700' },
  { label: 'Active Courses', value: '0', icon: BookOpen, color: 'bg-green-100 text-green-700' },
  { label: 'Pending Moderation', value: '0', icon: Shield, color: 'bg-red-100 text-red-700' },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-800">Dashboard</h1>
        <p className="text-stone-500 text-sm">Overview of your platform</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-stone-800">{stat.value}</p>
                  <p className="text-sm text-stone-500">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
