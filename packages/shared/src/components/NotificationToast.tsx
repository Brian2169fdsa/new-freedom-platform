import { useState, useEffect, useCallback, useRef } from 'react';
import type { MessagePayload } from 'firebase/messaging';

// ─── Constants ──────────────────────────────────────────────────────────────

const AUTO_DISMISS_MS = 5_000;
const ANIMATION_DURATION_MS = 300;

// ─── Types ──────────────────────────────────────────────────────────────────

interface NotificationToastProps {
  /** The FCM message payload to display. Pass null to hide the toast. */
  readonly payload: MessagePayload | null;
  /** Called when the toast is dismissed (manually or via auto-dismiss). */
  readonly onDismiss: () => void;
}

type AnimationState = 'entering' | 'visible' | 'exiting' | 'hidden';

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * A floating toast notification that appears when foreground FCM messages arrive.
 *
 * Features:
 * - Slides in from the top-right corner with a CSS transition.
 * - Auto-dismisses after 5 seconds.
 * - Shows notification title, body, and an optional action link.
 * - Supports manual dismissal via the close button.
 * - Animated entrance and exit transitions.
 */
export function NotificationToast({ payload, onDismiss }: NotificationToastProps) {
  const [animationState, setAnimationState] = useState<AnimationState>('hidden');
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (dismissTimerRef.current !== null) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
    if (exitTimerRef.current !== null) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
  }, []);

  const startExitAnimation = useCallback(() => {
    clearTimers();
    setAnimationState('exiting');
    exitTimerRef.current = setTimeout(() => {
      setAnimationState('hidden');
      onDismiss();
    }, ANIMATION_DURATION_MS);
  }, [clearTimers, onDismiss]);

  // Handle payload changes: show or start dismiss
  useEffect(() => {
    if (payload) {
      // Enter
      setAnimationState('entering');
      // Trigger "visible" on next frame for CSS transition
      const enterTimer = setTimeout(() => {
        setAnimationState('visible');
      }, 10);

      // Set auto-dismiss timer
      dismissTimerRef.current = setTimeout(() => {
        startExitAnimation();
      }, AUTO_DISMISS_MS);

      return () => {
        clearTimeout(enterTimer);
        clearTimers();
      };
    } else {
      // No payload — ensure we're hidden
      if (animationState !== 'hidden') {
        startExitAnimation();
      }
    }
    // We intentionally only react to payload changes, not animationState
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  if (animationState === 'hidden' && !payload) {
    return null;
  }

  const title = payload?.notification?.title ?? payload?.data?.title ?? 'New Notification';
  const body = payload?.notification?.body ?? payload?.data?.body ?? '';
  const actionLink = payload?.data?.link ?? payload?.fcmOptions?.link ?? null;
  const notificationType = payload?.data?.type ?? 'default';

  const isVisible = animationState === 'visible';
  const isEntering = animationState === 'entering';

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={[
        'fixed top-4 right-4 z-50 w-full max-w-sm',
        'transition-all duration-300 ease-in-out',
        isVisible
          ? 'translate-y-0 opacity-100'
          : isEntering
            ? '-translate-y-2 opacity-0'
            : '-translate-y-2 opacity-0',
      ].join(' ')}
    >
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Notification type icon */}
            <div className="flex-shrink-0 pt-0.5">
              <NotificationIcon type={notificationType} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                {title}
              </p>
              {body && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                  {body}
                </p>
              )}
              {actionLink && (
                <a
                  href={actionLink}
                  className="mt-2 inline-block text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  View details
                </a>
              )}
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={startExitAnimation}
              className="flex-shrink-0 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              aria-label="Dismiss notification"
            >
              <svg
                className="h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Progress bar for auto-dismiss */}
        {(isVisible || isEntering) && (
          <div className="h-1 bg-gray-100 dark:bg-gray-700">
            <div
              className="h-full bg-blue-500 transition-all ease-linear dark:bg-blue-400"
              style={{
                width: isVisible ? '0%' : '100%',
                transitionDuration: `${AUTO_DISMISS_MS}ms`,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

interface NotificationIconProps {
  readonly type: string;
}

function NotificationIcon({ type }: NotificationIconProps) {
  const colorClass = getIconColor(type);

  return (
    <div className={`rounded-full p-1.5 ${colorClass}`}>
      <svg
        className="h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {getIconPath(type)}
      </svg>
    </div>
  );
}

function getIconColor(type: string): string {
  switch (type) {
    case 'message':
      return 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400';
    case 'achievement':
    case 'milestone':
      return 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400';
    case 'system':
      return 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400';
    case 'appointment_reminder':
      return 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400';
    default:
      return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
  }
}

function getIconPath(type: string): JSX.Element {
  switch (type) {
    case 'message':
      return (
        <>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </>
      );
    case 'achievement':
    case 'milestone':
      return (
        <>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </>
      );
    case 'system':
      return (
        <>
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </>
      );
    case 'appointment_reminder':
      return (
        <>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </>
      );
    default:
      return (
        <>
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </>
      );
  }
}
