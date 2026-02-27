import { useState, useCallback, useEffect } from 'react';
import { requestNotificationPermission, saveFCMToken } from '../services/firebase/messaging';
import { useAuth } from '../hooks/useAuth';

// ─── Constants ──────────────────────────────────────────────────────────────

const DISMISSAL_STORAGE_KEY = 'nf-notification-prompt-dismissed';

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * A dismissible banner prompting users to enable push notifications.
 *
 * Behavior:
 * - Checks localStorage for a previous dismissal and hides if found.
 * - On "Enable Notifications", calls requestNotificationPermission and
 *   saves the resulting token to the user's Firestore subcollection.
 * - On dismiss (X button), persists the dismissal to localStorage.
 * - Does not render if the user has already granted or denied permission,
 *   or if the browser does not support notifications.
 */
export function NotificationPrompt() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Don't show if already dismissed
    const dismissed = localStorage.getItem(DISMISSAL_STORAGE_KEY);
    if (dismissed === 'true') {
      return;
    }

    // Don't show if Notification API isn't available
    if (typeof Notification === 'undefined') {
      return;
    }

    // Don't show if permission already decided
    if (Notification.permission !== 'default') {
      return;
    }

    // Don't show if no authenticated user
    if (!user?.uid) {
      return;
    }

    setVisible(true);
  }, [user?.uid]);

  const handleEnable = useCallback(async () => {
    if (!user?.uid) return;

    setLoading(true);
    setError(null);

    try {
      const token = await requestNotificationPermission();

      if (token) {
        await saveFCMToken(user.uid, token);
        setVisible(false);
      } else {
        // Permission denied or unsupported — hide the banner
        setVisible(false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to enable notifications.';
      setError(message);
      console.error('NotificationPrompt: enable failed', err);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(DISMISSAL_STORAGE_KEY, 'true');
    setVisible(false);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div
      role="alert"
      className="mx-4 mt-4 flex items-start gap-3 rounded-lg border border-blue-300 bg-blue-50 p-4 shadow-sm dark:border-blue-700 dark:bg-blue-950"
    >
      {/* Bell icon */}
      <div className="flex-shrink-0 pt-0.5">
        <svg
          className="h-5 w-5 text-blue-600 dark:text-blue-400"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
          Stay updated with push notifications
        </p>
        <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
          Get real-time alerts for messages, appointments, and important updates.
        </p>

        {error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}

        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={handleEnable}
            disabled={loading}
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-400"
          >
            {loading ? 'Enabling...' : 'Enable Notifications'}
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="text-sm font-medium text-blue-700 hover:text-blue-600 dark:text-blue-300 dark:hover:text-blue-200"
          >
            Not now
          </button>
        </div>
      </div>

      {/* Close button */}
      <button
        type="button"
        onClick={handleDismiss}
        className="flex-shrink-0 rounded-md p-1 text-blue-500 hover:bg-blue-100 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:text-blue-400 dark:hover:bg-blue-900 dark:hover:text-blue-200"
        aria-label="Dismiss notification prompt"
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
  );
}
