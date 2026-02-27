import { NavLink } from 'react-router-dom';
import { cn } from '@reprieve/shared/utils/cn';
import {
  LayoutDashboard, Users, UserCog, Shield, BookOpen,
  MapPin, Briefcase, BarChart3, Heart, Settings, ShieldCheck,
} from 'lucide-react';

const sidebarItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Members', path: '/members', icon: Users },
  { label: 'Case Managers', path: '/case-managers', icon: UserCog },
  { label: 'Moderation', path: '/moderation', icon: Shield },
  { label: 'Courses', path: '/courses', icon: BookOpen },
  { label: 'Resources', path: '/resources', icon: MapPin },
  { label: 'Employment', path: '/employment', icon: Briefcase },
  { label: 'Reports', path: '/reports', icon: BarChart3 },
  { label: 'Donations', path: '/donations', icon: Heart },
  { label: 'Audit Log', path: '/audit-log', icon: ShieldCheck },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export function AdminSidebar() {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-slate-900 text-white flex flex-col z-40">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-lg font-bold">REPrieve</h1>
        <p className="text-xs text-slate-400 mt-0.5">Admin Dashboard</p>
      </div>
      <nav className="flex-1 py-4 overflow-y-auto">
        {sidebarItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-6 py-2.5 text-sm transition-colors',
                isActive
                  ? 'text-white bg-blue-700/30 border-r-2 border-blue-500'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
