import React from 'react';
import { Header } from './Header';
import { BottomNav, type NavItem } from './BottomNav';
import { CrisisButton } from './CrisisButton';

interface AppShellProps {
  children: React.ReactNode;
  navItems: NavItem[];
  title?: string;
  currentLane?: string;
  showHeader?: boolean;
  showBottomNav?: boolean;
}

export function AppShell({
  children,
  navItems,
  title,
  currentLane,
  showHeader = true,
  showBottomNav = true,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {showHeader && <Header title={title} currentLane={currentLane} />}
      <main className="flex-1 pb-20 md:pb-0 md:pl-64">
        <div className="max-w-4xl mx-auto px-4 py-6">{children}</div>
      </main>
      {showBottomNav && <BottomNav items={navItems} />}
      <CrisisButton />
    </div>
  );
}
