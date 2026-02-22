/**
 * Client-side content pre-filter for My Struggle (Lane 3).
 *
 * Performs a lightweight profanity check before content is sent to the
 * server-side moderation Cloud Function. This gives users an immediate
 * warning so they can self-correct without a round-trip.
 *
 * IMPORTANT: This is NOT a security boundary. The server-side
 * `moderateContent` Cloud Function is the authoritative filter.
 */

// ---------------------------------------------------------------------------
// Profanity word list (client-side only -- lightweight subset)
// ---------------------------------------------------------------------------

const PROFANITY_TERMS: readonly string[] = Object.freeze([
  'damn',
  'dammit',
  'hell',
  'ass',
  'asshole',
  'bastard',
  'bitch',
  'bullshit',
  'crap',
  'dick',
  'fuck',
  'fucking',
  'motherfucker',
  'piss',
  'shit',
  'shitty',
  'slut',
  'whore',
  'cock',
  'cunt',
]);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PreFilterResult {
  /** true when no profanity was detected */
  readonly clean: boolean;
  /** Human-readable warnings for the user (empty when clean) */
  readonly warnings: readonly string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a single RegExp that matches any term in the list as a whole word,
 * case-insensitively. The pattern also catches common letter substitutions
 * (e.g. "f*ck", "sh!t") by normalising before matching.
 */
function buildProfanityRegex(terms: readonly string[]): RegExp {
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  // \b word-boundary ensures we don't flag sub-strings inside innocent words
  return new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
}

const PROFANITY_REGEX = buildProfanityRegex(PROFANITY_TERMS);

/**
 * Normalise common character substitutions so "a$$" or "f*ck" still match.
 */
function normaliseText(text: string): string {
  return text
    .replace(/@/g, 'a')
    .replace(/\$/g, 's')
    .replace(/!/g, 'i')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/0/g, 'o')
    .replace(/\*/g, 'u')
    .replace(/\+/g, 't');
}

/**
 * Deduplicate an array of strings while preserving order.
 */
function dedupe(items: string[]): string[] {
  return [...new Set(items)];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Run a fast, client-side profanity scan on the provided text.
 *
 * @param text - The user-authored content to check.
 * @returns An immutable result with a `clean` flag and any `warnings`.
 *
 * @example
 * ```ts
 * const result = preFilterContent('This is a clean post');
 * // { clean: true, warnings: [] }
 *
 * const flagged = preFilterContent('What the hell is this shit');
 * // { clean: false, warnings: ['Your post contains language that may violate community guidelines: hell, shit'] }
 * ```
 */
export function preFilterContent(text: string): PreFilterResult {
  if (typeof text !== 'string') {
    return Object.freeze({ clean: true, warnings: [] });
  }

  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return Object.freeze({ clean: true, warnings: [] });
  }

  const normalised = normaliseText(trimmed.toLowerCase());
  const matches = normalised.match(PROFANITY_REGEX);

  if (!matches || matches.length === 0) {
    return Object.freeze({ clean: true, warnings: [] });
  }

  const uniqueMatches = dedupe(matches.map((m) => m.toLowerCase()));

  const warnings: string[] = [
    `Your post contains language that may violate community guidelines: ${uniqueMatches.join(', ')}`,
  ];

  if (uniqueMatches.length >= 3) {
    warnings.push(
      'Multiple flagged terms detected. Please review your content before submitting.',
    );
  }

  return Object.freeze({
    clean: false,
    warnings: Object.freeze(warnings),
  });
}
