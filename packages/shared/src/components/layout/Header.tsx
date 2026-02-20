import React from 'react';
import { Bell, Menu } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '../ui/avatar';

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-stone-200">
      <div className="flex items-center justify-between h-14 px-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-stone-800">
            {title || 'New Freedom'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-2 text-stone-500 hover:text-stone-700 rounded-lg hover:bg-stone-100">
            <Bell className="h-5 w-5" />
          </button>
          <Avatar
            src={user?.photoURL}
            alt={user?.displayName}
            fallback={user?.profile?.firstName?.charAt(0)}
            size="sm"
          />
        </div>
      </div>
    </header>
  );
}
