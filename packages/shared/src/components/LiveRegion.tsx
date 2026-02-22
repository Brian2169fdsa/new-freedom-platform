import React, { useState, useCallback, useRef, useEffect, createContext, useContext } from 'react';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LiveRegionRole = 'status' | 'alert' | 'log';
type AnnouncePriority = 'polite' | 'assertive';

interface LiveRegionProps {
  /** ARIA role for the live region. Determines screen reader behavior.
   *  - 'status': polite announcements (default)
   *  - 'alert': assertive announcements that interrupt
   *  - 'log': sequential log of messages */
  readonly role?: LiveRegionRole;
  /** Optional children to render inside the live region */
  readonly children?: ReactNode;
}

interface AnnounceContextValue {
  readonly announce: (message: string, priority?: AnnouncePriority) => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AnnounceContext = createContext<AnnounceContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface LiveRegionProviderProps {
  readonly children: ReactNode;
}

/**
 * Provider that enables the `useAnnounce` hook throughout the component tree.
 * Renders two invisible live regions (one polite, one assertive) and manages
 * announcements to screen readers.
 *
 * Place this near the root of your application, inside your layout component.
 *
 * @example
 * ```tsx
 * <LiveRegionProvider>
 *   <App />
 * </LiveRegionProvider>
 * ```
 */
export function LiveRegionProvider({ children }: LiveRegionProviderProps): React.JSX.Element {
  const [politeMessage, setPoliteMessage] = useState<string>('');
  const [assertiveMessage, setAssertiveMessage] = useState<string>('');

  // Use refs to track clearing timeouts so we can cancel if a new
  // message arrives before the previous one is cleared
  const politeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const assertiveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (politeTimeoutRef.current !== null) {
        clearTimeout(politeTimeoutRef.current);
      }
      if (assertiveTimeoutRef.current !== null) {
        clearTimeout(assertiveTimeoutRef.current);
      }
    };
  }, []);

  const announce = useCallback((message: string, priority: AnnouncePriority = 'polite') => {
    const CLEAR_DELAY_MS = 5000;

    if (priority === 'assertive') {
      // Clear and re-set to force re-announcement of identical messages
      setAssertiveMessage('');
      requestAnimationFrame(() => {
        setAssertiveMessage(message);
      });

      if (assertiveTimeoutRef.current !== null) {
        clearTimeout(assertiveTimeoutRef.current);
      }
      assertiveTimeoutRef.current = setTimeout(() => {
        setAssertiveMessage('');
        assertiveTimeoutRef.current = null;
      }, CLEAR_DELAY_MS);
    } else {
      setPoliteMessage('');
      requestAnimationFrame(() => {
        setPoliteMessage(message);
      });

      if (politeTimeoutRef.current !== null) {
        clearTimeout(politeTimeoutRef.current);
      }
      politeTimeoutRef.current = setTimeout(() => {
        setPoliteMessage('');
        politeTimeoutRef.current = null;
      }, CLEAR_DELAY_MS);
    }
  }, []);

  const contextValue: AnnounceContextValue = { announce };

  return (
    <AnnounceContext.Provider value={contextValue}>
      {children}
      {/* Polite live region */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeMessage}
      </div>
      {/* Assertive live region */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveMessage}
      </div>
    </AnnounceContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Hook that provides an `announce` function for making screen reader
 * announcements from anywhere in the component tree.
 *
 * Must be used within a `<LiveRegionProvider>`.
 *
 * @returns Object with an `announce(message, priority?)` function
 *
 * @example
 * ```tsx
 * function SaveButton() {
 *   const { announce } = useAnnounce();
 *
 *   async function handleSave() {
 *     await saveData();
 *     announce('Your changes have been saved.');
 *   }
 *
 *   return <button onClick={handleSave}>Save</button>;
 * }
 * ```
 */
export function useAnnounce(): AnnounceContextValue {
  const context = useContext(AnnounceContext);

  if (context === null) {
    throw new Error(
      'useAnnounce must be used within a <LiveRegionProvider>. ' +
      'Wrap your application in <LiveRegionProvider> to use this hook.'
    );
  }

  return context;
}

// ---------------------------------------------------------------------------
// Standalone Component
// ---------------------------------------------------------------------------

/**
 * Standalone ARIA live region component for simple use cases where
 * the context/hook pattern is not needed.
 *
 * Renders an invisible region that screen readers monitor for changes.
 * When the children content changes, the screen reader announces it.
 *
 * @example
 * ```tsx
 * <LiveRegion role="status">
 *   {formSubmitted ? 'Form submitted successfully' : ''}
 * </LiveRegion>
 *
 * <LiveRegion role="alert">
 *   {errorMessage}
 * </LiveRegion>
 * ```
 */
export function LiveRegion({ role = 'status', children }: LiveRegionProps): React.JSX.Element {
  const ariaLive: 'polite' | 'assertive' = role === 'alert' ? 'assertive' : 'polite';

  return (
    <div
      role={role}
      aria-live={ariaLive}
      aria-atomic="true"
      className="sr-only"
    >
      {children}
    </div>
  );
}
