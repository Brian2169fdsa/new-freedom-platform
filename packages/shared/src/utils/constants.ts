export const APP_NAME = 'New Freedom';

export const LANE_NAMES = {
  lane1: 'Re-Entry',
  lane2: 'Step Experience',
  lane3: 'My Struggle',
} as const;

export const LANE_DESCRIPTIONS = {
  lane1: 'Case management, employment, housing, and wellness tools',
  lane2: "Interactive 12-step curriculum with Joe McDonald's guidance",
  lane3: 'Community support, resources, and mentor matching',
} as const;

export const CRISIS_HOTLINE = {
  name: '988 Suicide & Crisis Lifeline',
  phone: '988',
  text: 'Text HOME to 741741',
  url: 'https://988lifeline.org',
} as const;

export const MOOD_LABELS: Record<string, string> = {
  great: 'Great',
  good: 'Good',
  okay: 'Okay',
  struggling: 'Struggling',
  crisis: 'In Crisis',
};

export const MOOD_COLORS: Record<string, string> = {
  great: '#22c55e',
  good: '#84cc16',
  okay: '#eab308',
  struggling: '#f97316',
  crisis: '#ef4444',
};
