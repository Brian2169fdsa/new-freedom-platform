import React from 'react';

/**
 * Target ID constants for skip navigation links.
 * Consuming applications should add these IDs to their corresponding
 * landmark elements (e.g., <main id="main-content">).
 */
export const SKIP_NAV_TARGETS = {
  mainContent: 'main-content',
  navigation: 'main-navigation',
} as const;

interface SkipNavLinkProps {
  /** The href target (should match an element's id attribute) */
  readonly targetId: string;
  /** The visible label text */
  readonly label: string;
}

/**
 * Individual skip navigation link. Hidden off-screen by default using
 * Tailwind's sr-only pattern, becomes visible and prominently styled
 * when focused via keyboard navigation.
 */
function SkipNavLink({ targetId, label }: SkipNavLinkProps): React.JSX.Element {
  return (
    <a
      href={`#${targetId}`}
      className={[
        // sr-only by default (visually hidden but accessible)
        'absolute -top-full left-0',
        'overflow-hidden',
        // Visible on focus
        'focus:top-0 focus:z-[9999]',
        'focus:block focus:overflow-visible',
        // Styling when visible
        'focus:bg-amber-500 focus:text-white',
        'focus:px-6 focus:py-3',
        'focus:text-sm focus:font-semibold',
        'focus:no-underline',
        'focus:shadow-lg',
        // Focus ring for additional visibility
        'focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2',
        // Smooth transition for appearance
        'transition-all duration-150',
      ].join(' ')}
    >
      {label}
    </a>
  );
}

/**
 * Skip Navigation component for WCAG 2.1 AA compliance.
 *
 * Renders hidden skip links that become visible when focused via
 * keyboard navigation (Tab key). This allows keyboard and screen
 * reader users to bypass repetitive navigation and jump directly
 * to the main content area or navigation landmark.
 *
 * Place this component at the very top of your application layout,
 * before any other visible content.
 *
 * @example
 * ```tsx
 * // In your App or Layout component:
 * <SkipNavigation />
 * <Header />
 * <nav id="main-navigation">...</nav>
 * <main id="main-content">...</main>
 * ```
 */
export function SkipNavigation(): React.JSX.Element {
  return (
    <div role="navigation" aria-label="Skip links">
      <SkipNavLink
        targetId={SKIP_NAV_TARGETS.mainContent}
        label="Skip to main content"
      />
      <SkipNavLink
        targetId={SKIP_NAV_TARGETS.navigation}
        label="Skip to navigation"
      />
    </div>
  );
}
