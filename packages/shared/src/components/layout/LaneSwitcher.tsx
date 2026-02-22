import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ArrowUpRight, Home, BookOpen, Heart } from 'lucide-react';

interface LaneConfig {
  key: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  port: number;
  color: string;
}

const LANES: LaneConfig[] = [
  {
    key: 'lane1',
    name: 'Re-Entry',
    description: 'Case management & life tools',
    icon: <Home className="h-4 w-4" />,
    port: 3001,
    color: 'text-emerald-600 bg-emerald-50',
  },
  {
    key: 'lane2',
    name: 'Step Experience',
    description: '12-step curriculum & journal',
    icon: <BookOpen className="h-4 w-4" />,
    port: 3002,
    color: 'text-blue-600 bg-blue-50',
  },
  {
    key: 'lane3',
    name: 'My Struggle',
    description: 'Community & resources',
    icon: <Heart className="h-4 w-4" />,
    port: 3003,
    color: 'text-purple-600 bg-purple-50',
  },
];

interface LaneSwitcherProps {
  currentLane?: string;
}

export function LaneSwitcher({ currentLane }: LaneSwitcherProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const current = LANES.find((l) => l.key === currentLane) || LANES[0];

  const handleNavigate = (lane: LaneConfig) => {
    if (lane.key === currentLane) {
      setOpen(false);
      return;
    }
    // In production these would be different subdomains; in dev different ports
    const isDev = window.location.hostname === 'localhost';
    if (isDev) {
      window.location.href = `http://localhost:${lane.port}`;
    } else {
      // Production: different Firebase hosting targets
      const subdomain = lane.key === 'lane1' ? 'reentry' : lane.key === 'lane2' ? 'steps' : 'mystuggle';
      window.location.href = `https://reprieve-${subdomain}.web.app`;
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-800 transition-colors px-2 py-1 rounded-lg hover:bg-stone-100"
      >
        <span className={`p-1 rounded ${current.color}`}>{current.icon}</span>
        <span className="hidden sm:inline">{current.name}</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-64 bg-white rounded-xl border border-stone-200 shadow-lg overflow-hidden z-50">
          <div className="px-3 py-2 border-b border-stone-100">
            <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">Switch Lane</p>
          </div>
          {LANES.map((lane) => {
            const isActive = lane.key === currentLane;
            return (
              <button
                key={lane.key}
                onClick={() => handleNavigate(lane)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                  isActive ? 'bg-amber-50' : 'hover:bg-stone-50'
                }`}
              >
                <span className={`p-1.5 rounded-lg ${lane.color}`}>{lane.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isActive ? 'text-amber-700' : 'text-stone-800'}`}>
                    {lane.name}
                  </p>
                  <p className="text-xs text-stone-500 truncate">{lane.description}</p>
                </div>
                {!isActive && <ArrowUpRight className="h-3.5 w-3.5 text-stone-400" />}
                {isActive && (
                  <span className="text-[10px] font-medium text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                    Current
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
