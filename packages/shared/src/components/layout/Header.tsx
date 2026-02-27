import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '../ui/avatar';
import { NotificationBell } from './NotificationBell';
import { LaneSwitcher } from './LaneSwitcher';

interface HeaderProps {
  title?: string;
  currentLane?: string;
}

export function Header({ title, currentLane }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="flex items-center justify-between h-14 px-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-slate-800">
            {title || 'REPrieve'}
          </h1>
          <LaneSwitcher currentLane={currentLane} />
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell />
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
