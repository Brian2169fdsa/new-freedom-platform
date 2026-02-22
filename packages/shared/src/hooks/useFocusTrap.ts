import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { getFocusableElements } from '../utils/a11y';

/**
 * Hook that traps keyboard focus within a container element.
 * When active, Tab and Shift+Tab cycle through focusable elements
 * inside the container without escaping. When deactivated, focus
 * returns to the element that was focused before activation.
 *
 * Designed for modals, dialogs, drawers, and other overlay patterns
 * per WCAG 2.1 AA guideline 2.4.3 (Focus Order).
 *
 * @param ref - Ref to the container element that should trap focus
 * @param active - Whether the focus trap is currently active
 *
 * @example
 * ```tsx
 * const dialogRef = useRef<HTMLDivElement>(null);
 * useFocusTrap(dialogRef, isOpen);
 *
 * return isOpen ? <div ref={dialogRef} role="dialog">...</div> : null;
 * ```
 */
export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  active: boolean
): void {
  // Store the element that had focus before the trap was activated
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active || !ref.current) {
      return;
    }

    const container = ref.current;

    // Capture the currently focused element so we can restore it later
    previousFocusRef.current = document.activeElement as HTMLElement | null;

    // Move focus into the container on activation
    const focusableElements = getFocusableElements(container);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    } else {
      // If no focusable elements, make the container itself focusable
      container.setAttribute('tabindex', '-1');
      container.focus();
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key !== 'Tab') {
        return;
      }

      const currentFocusable = getFocusableElements(container);
      if (currentFocusable.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = currentFocusable[0];
      const lastElement = currentFocusable[currentFocusable.length - 1];

      if (event.shiftKey) {
        // Shift+Tab: if on first element, wrap to last
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: if on last element, wrap to first
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      // Restore focus to the previously focused element
      if (
        previousFocusRef.current &&
        typeof previousFocusRef.current.focus === 'function'
      ) {
        previousFocusRef.current.focus();
      }
    };
  }, [active, ref]);
}
