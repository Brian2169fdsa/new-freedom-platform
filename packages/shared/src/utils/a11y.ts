/**
 * Accessibility utility functions for the New Freedom Recovery Platform.
 * Provides helpers for unique ID generation, focusable element discovery,
 * and programmatic screen reader announcements.
 *
 * WCAG 2.1 AA compliant. No external dependencies.
 */

let idCounter = 0;

/**
 * Generates a unique ID suitable for aria-labelledby, aria-describedby,
 * and other ARIA relationship attributes.
 *
 * @param prefix - Optional prefix for readability (defaults to 'nf-a11y')
 * @returns A unique string ID
 */
export function generateId(prefix = 'nf-a11y'): string {
  idCounter += 1;
  return `${prefix}-${idCounter}-${Date.now().toString(36)}`;
}

/**
 * Selector matching all natively focusable elements that are not disabled
 * and not hidden. Covers links, buttons, inputs, selects, textareas,
 * elements with tabindex, and elements with contenteditable.
 */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
  'audio[controls]',
  'video[controls]',
  'details > summary',
].join(', ');

/**
 * Finds all focusable elements within a container, filtered to only those
 * that are visible (not display:none or visibility:hidden) and have
 * non-negative tabindex.
 *
 * @param container - The DOM element to search within
 * @returns An array of focusable HTMLElements in document order
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const candidates = Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  );

  return candidates.filter((element) => {
    // Exclude elements that are not visible
    if (element.offsetParent === null && element.tagName !== 'BODY') {
      // offsetParent is null for display:none elements and fixed-position elements.
      // Check computed style to distinguish.
      const style = window.getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden') {
        return false;
      }
    }
    return true;
  });
}

/**
 * Programmatically announces a message to screen readers by creating
 * a temporary ARIA live region, inserting the message, and cleaning up
 * after the announcement has been read.
 *
 * @param message - The text to announce
 * @param priority - 'polite' waits for idle; 'assertive' interrupts (default: 'polite')
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  // Create an off-screen live region
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.setAttribute('role', priority === 'assertive' ? 'alert' : 'status');

  // Position off-screen using sr-only technique
  Object.assign(announcement.style, {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: '0',
  });

  document.body.appendChild(announcement);

  // Use requestAnimationFrame to ensure the live region is registered
  // by assistive technology before content is inserted
  requestAnimationFrame(() => {
    announcement.textContent = message;
  });

  // Clean up after a generous delay to ensure the announcement is read
  const CLEANUP_DELAY_MS = 3000;
  setTimeout(() => {
    if (document.body.contains(announcement)) {
      document.body.removeChild(announcement);
    }
  }, CLEANUP_DELAY_MS);
}
