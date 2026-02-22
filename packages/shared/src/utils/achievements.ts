/**
 * Achievement Definitions for the New Freedom Platform
 *
 * Central registry of all possible achievements across the platform.
 * These definitions are used to render badges and determine unlock criteria.
 */

export type AchievementCategory = 'milestone' | 'step' | 'engagement' | 'social';

export interface AchievementDefinition {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly icon: string;
  readonly category: AchievementCategory;
}

// ── Recovery Milestones ─────────────────────────────────────────────────────

const RECOVERY_MILESTONES: readonly AchievementDefinition[] = [
  {
    id: 'first_checkin',
    title: 'First Step',
    description: 'Complete your first daily check-in',
    icon: '\u{1F31F}',
    category: 'milestone',
  },
  {
    id: 'streak_7',
    title: 'One Week Strong',
    description: '7-day check-in streak',
    icon: '\u{1F525}',
    category: 'milestone',
  },
  {
    id: 'streak_30',
    title: 'Monthly Warrior',
    description: '30-day check-in streak',
    icon: '\u{1F4AA}',
    category: 'milestone',
  },
  {
    id: 'streak_90',
    title: 'Quarter Champion',
    description: '90-day check-in streak',
    icon: '\u{26A1}',
    category: 'milestone',
  },
  {
    id: 'streak_365',
    title: 'Year of Growth',
    description: '365-day check-in streak',
    icon: '\u{1F451}',
    category: 'milestone',
  },
] as const;

// ── Step Completion ─────────────────────────────────────────────────────────

const STEP_ICONS: readonly string[] = [
  '\u{0031}\u{FE0F}\u{20E3}', // 1
  '\u{0032}\u{FE0F}\u{20E3}', // 2
  '\u{0033}\u{FE0F}\u{20E3}', // 3
  '\u{0034}\u{FE0F}\u{20E3}', // 4
  '\u{0035}\u{FE0F}\u{20E3}', // 5
  '\u{0036}\u{FE0F}\u{20E3}', // 6
  '\u{0037}\u{FE0F}\u{20E3}', // 7
  '\u{0038}\u{FE0F}\u{20E3}', // 8
  '\u{0039}\u{FE0F}\u{20E3}', // 9
  '\u{1F51F}',                 // 10
  '\u{0031}\u{0031}\u{FE0F}\u{20E3}', // 11
  '\u{0031}\u{0032}\u{FE0F}\u{20E3}', // 12
] as const;

const STEP_COMPLETIONS: readonly AchievementDefinition[] = Array.from(
  { length: 12 },
  (_, i): AchievementDefinition => ({
    id: `step_${i + 1}_complete`,
    title: `Step ${i + 1} Master`,
    description: `Complete Step ${i + 1} of the program`,
    icon: STEP_ICONS[i],
    category: 'step',
  })
);

const ALL_STEPS_ACHIEVEMENT: AchievementDefinition = {
  id: 'all_steps',
  title: 'Journey Complete',
  description: 'Complete all 12 steps',
  icon: '\u{1F393}',
  category: 'step',
};

// ── Journal & Engagement ────────────────────────────────────────────────────

const ENGAGEMENT_ACHIEVEMENTS: readonly AchievementDefinition[] = [
  {
    id: 'first_journal',
    title: 'Finding My Voice',
    description: 'Write first journal entry',
    icon: '\u{1F4DD}',
    category: 'engagement',
  },
  {
    id: 'journal_50',
    title: 'Storyteller',
    description: 'Write 50 journal entries',
    icon: '\u{1F4DA}',
    category: 'engagement',
  },
  {
    id: 'first_resume',
    title: 'Career Ready',
    description: 'Create first resume',
    icon: '\u{1F4BC}',
    category: 'engagement',
  },
  {
    id: 'first_job_save',
    title: 'Job Hunter',
    description: 'Save first job posting',
    icon: '\u{1F50D}',
    category: 'engagement',
  },
] as const;

// ── Social / Community ──────────────────────────────────────────────────────

const SOCIAL_ACHIEVEMENTS: readonly AchievementDefinition[] = [
  {
    id: 'community_helper',
    title: 'Community Pillar',
    description: 'Reply to 10 community posts',
    icon: '\u{1F91D}',
    category: 'social',
  },
] as const;

// ── Combined Export ─────────────────────────────────────────────────────────

export const ACHIEVEMENT_DEFINITIONS: readonly AchievementDefinition[] = [
  ...RECOVERY_MILESTONES,
  ...STEP_COMPLETIONS,
  ALL_STEPS_ACHIEVEMENT,
  ...ENGAGEMENT_ACHIEVEMENTS,
  ...SOCIAL_ACHIEVEMENTS,
] as const;

/**
 * Look up a single achievement definition by its id.
 * Returns undefined if no match is found.
 */
export function getAchievementById(id: string): AchievementDefinition | undefined {
  return ACHIEVEMENT_DEFINITIONS.find((a) => a.id === id);
}

/**
 * Filter definitions by category.
 */
export function getAchievementsByCategory(
  category: AchievementCategory
): readonly AchievementDefinition[] {
  return ACHIEVEMENT_DEFINITIONS.filter((a) => a.category === category);
}

/**
 * All unique category values present in the definitions.
 */
export const ACHIEVEMENT_CATEGORIES: readonly AchievementCategory[] = [
  'milestone',
  'step',
  'engagement',
  'social',
] as const;

/**
 * Human-readable labels for each category.
 */
export const CATEGORY_LABELS: Readonly<Record<AchievementCategory, string>> = {
  milestone: 'Milestones',
  step: 'Steps',
  engagement: 'Engagement',
  social: 'Social',
} as const;
