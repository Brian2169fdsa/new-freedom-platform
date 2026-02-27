import React, { useState, useCallback, useEffect } from 'react';
import { cn } from '../../utils/cn';
import type { AchievementCategory } from '../../utils/achievements';

// ── Types ───────────────────────────────────────────────────────────────────

export interface BadgeData {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly icon: string;
  readonly category: AchievementCategory;
  readonly earnedAt?: Date | null;
  readonly locked?: boolean;
}

interface AchievementBadgeProps {
  readonly badge: BadgeData;
  /** When true, plays a one-shot confetti burst animation (CSS only). */
  readonly justEarned?: boolean;
  /** Called when the user taps / clicks a badge. */
  readonly onSelect?: (badge: BadgeData) => void;
  readonly className?: string;
}

// ── Confetti Particles ──────────────────────────────────────────────────────

const CONFETTI_COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#6366f1', // indigo-500
  '#ef4444', // red-500
  '#ec4899', // pink-500
  '#8b5cf6', // violet-500
  '#14b8a6', // teal-500
  '#f97316', // orange-500
] as const;

/**
 * Generates deterministic confetti particle style data.
 * Uses index-based math so the output is stable across renders.
 */
function buildConfettiParticle(index: number): React.CSSProperties {
  const angle = (index * 45) % 360;
  const radius = 40 + (index * 7) % 30;
  const x = Math.cos((angle * Math.PI) / 180) * radius;
  const y = Math.sin((angle * Math.PI) / 180) * radius;
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const delay = (index * 0.06) % 0.5;
  const size = 4 + (index % 3) * 2;

  return {
    position: 'absolute' as const,
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: index % 2 === 0 ? '50%' : '2px',
    backgroundColor: color,
    left: '50%',
    top: '50%',
    opacity: 0,
    transform: 'translate(-50%, -50%)',
    animation: `achievement-confetti-burst 0.7s ease-out ${delay}s forwards`,
    ['--confetti-x' as string]: `${x}px`,
    ['--confetti-y' as string]: `${y}px`,
  };
}

const CONFETTI_COUNT = 12;

// ── Inline Keyframes (injected once) ────────────────────────────────────────

const KEYFRAMES_ID = 'achievement-badge-keyframes';

function ensureKeyframes(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(KEYFRAMES_ID)) return;

  const style = document.createElement('style');
  style.id = KEYFRAMES_ID;
  style.textContent = `
    @keyframes achievement-confetti-burst {
      0% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(0);
      }
      60% {
        opacity: 1;
        transform: translate(
          calc(-50% + var(--confetti-x)),
          calc(-50% + var(--confetti-y))
        ) scale(1);
      }
      100% {
        opacity: 0;
        transform: translate(
          calc(-50% + var(--confetti-x) * 1.4),
          calc(-50% + var(--confetti-y) * 1.4)
        ) scale(0.5);
      }
    }

    @keyframes achievement-glow-pulse {
      0%, 100% { box-shadow: 0 0 8px 2px rgba(37, 99, 235, 0.25); }
      50%      { box-shadow: 0 0 16px 4px rgba(37, 99, 235, 0.45); }
    }

    @keyframes achievement-pop-in {
      0%   { transform: scale(0.6); opacity: 0; }
      60%  { transform: scale(1.12); opacity: 1; }
      100% { transform: scale(1); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}

// ── Component ───────────────────────────────────────────────────────────────

export function AchievementBadge({
  badge,
  justEarned = false,
  onSelect,
  className,
}: AchievementBadgeProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [animating, setAnimating] = useState(justEarned);

  // Inject keyframes on first mount
  useEffect(() => {
    ensureKeyframes();
  }, []);

  // Auto-clear "just earned" animation after it plays
  useEffect(() => {
    if (!justEarned) return;
    setAnimating(true);
    const timer = setTimeout(() => setAnimating(false), 1200);
    return () => clearTimeout(timer);
  }, [justEarned]);

  const isLocked = badge.locked === true || !badge.earnedAt;
  const isEarned = !isLocked;

  const handleClick = useCallback(() => {
    setShowDetails((prev) => !prev);
    if (onSelect) {
      onSelect(badge);
    }
  }, [badge, onSelect]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${badge.title}${isLocked ? ' (locked)' : ' (earned)'}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'relative flex flex-col items-center text-center select-none outline-none',
        'focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 rounded-xl',
        'transition-transform duration-200',
        isEarned && 'cursor-pointer hover:scale-105',
        isLocked && 'cursor-default',
        className
      )}
    >
      {/* Circular Badge */}
      <div
        className={cn(
          'relative h-16 w-16 rounded-full flex items-center justify-center',
          'transition-all duration-300',
          isEarned && 'bg-blue-50 border-2 border-blue-300',
          isLocked && 'bg-slate-100 border-2 border-slate-200 grayscale',
          isEarned && !animating && 'animate-[achievement-glow-pulse_3s_ease-in-out_infinite]',
          animating && 'animate-[achievement-pop-in_0.5s_ease-out]'
        )}
      >
        <span
          className={cn(
            'text-2xl leading-none',
            isLocked && 'opacity-30'
          )}
          aria-hidden="true"
        >
          {badge.icon}
        </span>

        {/* Confetti particles (CSS-only burst) */}
        {animating && (
          <div className="absolute inset-0 pointer-events-none overflow-visible">
            {Array.from({ length: CONFETTI_COUNT }, (_, i) => (
              <div key={i} style={buildConfettiParticle(i)} />
            ))}
          </div>
        )}
      </div>

      {/* Title */}
      <p
        className={cn(
          'mt-2 text-xs font-medium leading-tight max-w-[80px] line-clamp-2',
          isEarned ? 'text-slate-800' : 'text-slate-400'
        )}
      >
        {badge.title}
      </p>

      {/* Expanded Detail (shown on click/hover) */}
      {showDetails && (
        <div
          className={cn(
            'absolute -bottom-1 translate-y-full z-10',
            'w-48 p-3 rounded-lg shadow-lg border',
            'bg-white border-slate-200',
            'text-left'
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg" aria-hidden="true">
              {badge.icon}
            </span>
            <h4 className="text-sm font-semibold text-slate-800">{badge.title}</h4>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">{badge.description}</p>
          {isEarned && badge.earnedAt && (
            <p className="text-[10px] text-blue-600 mt-1.5 font-medium">
              Earned {badge.earnedAt.toLocaleDateString()}
            </p>
          )}
          {isLocked && (
            <p className="text-[10px] text-slate-400 mt-1.5 italic">
              Keep going — you will unlock this!
            </p>
          )}
        </div>
      )}
    </div>
  );
}
