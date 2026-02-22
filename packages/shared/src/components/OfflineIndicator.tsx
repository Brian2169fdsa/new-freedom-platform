import { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

/**
 * Offline detection banner that shows at the top of the screen
 * when the browser loses its network connection. Displays a brief
 * "Back online" success message when connectivity is restored.
 */
export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const [showBackOnline, setShowBackOnline] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      setShowBackOnline(false);
    }

    if (isOnline && wasOffline) {
      setShowBackOnline(true);
      const timer = setTimeout(() => {
        setShowBackOnline(false);
        setWasOffline(false);
      }, 3000);

      return () => clearTimeout(timer);
    }

    return undefined;
  }, [isOnline, wasOffline]);

  // Nothing to show — online and no recent reconnection
  if (isOnline && !showBackOnline) {
    return null;
  }

  // Offline banner
  if (!isOnline) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="fixed top-0 left-0 right-0 z-[9999] animate-slide-down"
      >
        <div className="flex items-center justify-center gap-2 bg-stone-800 text-white py-2 px-4 text-sm">
          <WifiOff className="h-4 w-4 shrink-0" />
          <span>You are offline. Some features may be unavailable.</span>
        </div>
      </div>
    );
  }

  // Back-online success banner
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-[9999] animate-slide-down"
    >
      <div className="flex items-center justify-center gap-2 bg-emerald-600 text-white py-2 px-4 text-sm">
        <Wifi className="h-4 w-4 shrink-0" />
        <span>Back online</span>
      </div>
    </div>
  );
}
