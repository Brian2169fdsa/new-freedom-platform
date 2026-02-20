import type { AIPersona } from './client';

interface PersonaConfig {
  key: AIPersona;
  name: string;
  description: string;
  avatar: string;
  greeting: string;
}

export const PERSONAS: Record<AIPersona, PersonaConfig> = {
  recoveryGuide: {
    key: 'recoveryGuide',
    name: 'Recovery Guide',
    description: 'Compassionate support for your recovery journey',
    avatar: '🌱',
    greeting: "I'm here to support you on your recovery journey. How are you feeling today?",
  },
  lifeNavigator: {
    key: 'lifeNavigator',
    name: 'Life Navigator',
    description: 'Practical guidance for re-entering society',
    avatar: '🧭',
    greeting: "Welcome! I can help with housing, employment, documents, and navigating daily life. What do you need help with?",
  },
  resourceFinder: {
    key: 'resourceFinder',
    name: 'Resource Finder',
    description: 'Find shelters, food, medical care, and more in Phoenix',
    avatar: '📍',
    greeting: "I can help you find resources near you — shelters, food, medical care, legal aid, and more. What are you looking for?",
  },
  resumeCoach: {
    key: 'resumeCoach',
    name: 'Resume Coach',
    description: 'Build your resume and prepare for interviews',
    avatar: '💼',
    greeting: "Let's work on your career readiness! I can help with your resume, interview prep, or finding fair-chance employers.",
  },
};
