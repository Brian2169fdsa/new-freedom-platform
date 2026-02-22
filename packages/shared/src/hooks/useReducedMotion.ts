import { useState, useEffect } from 'react';

/**
 * Hook that detects the user's prefers-reduced-motion system setting.
 * Reactively updates when the user changes their system preference.
 *
 * Use this to conditionally disable or simplify animations throughout
 * the platform, respecting WCAG 2.1 AA guideline 2.3.3.
 *
 * @returns true if the user prefers reduced motion, false otherwise
 *
 * @example
 * ```tsx
 * const prefersReducedMotion = useReducedMotion();
 * const transition = prefersReducedMotion ? 'none' : 'transform 0.3s ease';
 * ```
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(
    () => {
      if (typeof window === 'undefined' || !window.matchMedia) {
        return false;
      }
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    function handleChange(event: MediaQueryListEvent): void {
      setPrefersReducedMotion(event.matches);
    }

    mediaQuery.addEventListener('change', handleChange);

    // Sync in case it changed between initial render and effect
    setPrefersReducedMotion(mediaQuery.matches);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
}
