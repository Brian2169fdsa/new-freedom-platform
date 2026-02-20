import { NavLink } from 'react-router-dom';
import { cn } from '@nfp/shared/utils/cn';
import {
  LayoutDashboard, Users, UserCog, Shield, BookOpen,
  MapPin, Briefcase, BarChart3, Ticket, Heart, Settings,
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
  { label: 'Invite Codes', path: '/invite-codes', icon: Ticket },
  { label: 'Donations', path: '/donations', icon: Heart },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export function AdminSidebar() {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-stone-900 text-white flex flex-col z-40">
      <div className="p-6 border-b border-stone-700">
        <h1 className="text-lg font-bold">New Freedom</h1>
        <p className="text-xs text-stone-400 mt-0.5">Admin Dashboard</p>
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
                  ? 'text-white bg-amber-700/30 border-r-2 border-amber-500'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800'
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
