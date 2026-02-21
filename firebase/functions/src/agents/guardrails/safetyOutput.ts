/**
 * Safety Output — Output Guardrail
 *
 * Regex-based scan of agent output to catch prohibited patterns
 * such as medication advice, diagnostic statements, harmful
 * suggestions, and judgmental language before they reach the user.
 */

import { OutputGuardrail } from '@openai/agents';

// ---------------------------------------------------------------------------
// Prohibited output patterns
// ---------------------------------------------------------------------------
interface ProhibitedPattern {
  regex: RegExp;
  reason: string;
}

const PROHIBITED_PATTERNS: ProhibitedPattern[] = [
  // Medication advice
  {
    regex: /you should (take|stop taking|start taking|increase|decrease|quit) (your )?medication/i,
    reason: 'Medication advice is outside the scope of this platform.',
  },
  {
    regex: /you (need to|must|have to) (take|stop|start|switch) (your )?(meds|medication|prescription)/i,
    reason: 'Medication advice is outside the scope of this platform.',
  },
  {
    regex: /I (recommend|suggest|advise) (you )?(take|stop|start|try) (the |this |a )?(drug|medication|medicine|pill)/i,
    reason: 'Medication advice is outside the scope of this platform.',
  },

  // Diagnostic statements
  {
    regex: /I diagnose you with/i,
    reason: 'AI agents must not provide medical or psychological diagnoses.',
  },
  {
    regex: /you (have|suffer from|are diagnosed with) (depression|bipolar|schizophrenia|anxiety disorder|PTSD|borderline|BPD|ADHD|OCD|antisocial personality)/i,
    reason: 'AI agents must not provide medical or psychological diagnoses.',
  },
  {
    regex: /based on (what you('ve| have) (said|told me)|your symptoms),? (I (think|believe) )?you (have|may have|probably have|likely have|might have) (a |an )?(mental|personality|mood|anxiety)/i,
    reason: 'AI agents must not provide medical or psychological diagnoses.',
  },

  // Harmful suggestions
  {
    regex: /you (should|could|might want to) (use|try|drink|smoke|take) (alcohol|drugs|substances|meth|heroin|cocaine|fentanyl|pills)/i,
    reason: 'Substance use suggestions are strictly prohibited.',
  },
  {
    regex: /one (drink|hit|dose) (won't|wouldn't|won't) hurt/i,
    reason: 'Minimizing substance use risks is prohibited.',
  },
  {
    regex: /maybe (you|it) (should|could) (just|try to) (give up|stop trying|quit recovery)/i,
    reason: 'Discouraging recovery is prohibited.',
  },

  // Judgmental language
  {
    regex: /you('re| are) (hopeless|worthless|a failure|pathetic|lazy|weak|stupid|useless|a lost cause)/i,
    reason: 'Judgmental or demeaning language is prohibited.',
  },
  {
    regex: /you (will never|can't ever|won't ever) (recover|get better|change|succeed|be normal)/i,
    reason: 'Hopeless or defeatist language directed at the user is prohibited.',
  },
  {
    regex: /it('s| is) your (own )?fault (that |you )/i,
    reason: 'Blaming the user for their circumstances is prohibited.',
  },
  {
    regex: /you (deserve|earned|asked for) (this|what happened|your (situation|addiction|problems))/i,
    reason: 'Suggesting the user deserves their hardship is prohibited.',
  },

  // Religious coercion (12-step is spiritual but must remain inclusive)
  {
    regex: /you (must|have to|need to) (believe in|accept|find) (God|Jesus|Christ|Allah|a higher power) or (you('ll| will)|else)/i,
    reason: 'Religious coercion violates the platform\'s inclusive approach.',
  },

  // Legal advice
  {
    regex: /I (can )?(guarantee|promise) (you('ll| will)|that) (win|get off|beat (the|your) (case|charge|sentence))/i,
    reason: 'Guaranteeing legal outcomes is prohibited.',
  },
];

// ---------------------------------------------------------------------------
// Guardrail implementation
// ---------------------------------------------------------------------------
export const safetyOutputGuardrail: OutputGuardrail = {
  name: 'safety_output',

  async execute({ agentOutput }) {
    // Normalise the output to a single string
    const text =
      typeof agentOutput === 'string'
        ? agentOutput
        : typeof agentOutput === 'object' && agentOutput !== null
          ? JSON.stringify(agentOutput)
          : String(agentOutput ?? '');

    const violations: Array<{ pattern: string; reason: string }> = [];

    for (const { regex, reason } of PROHIBITED_PATTERNS) {
      if (regex.test(text)) {
        violations.push({
          pattern: regex.source,
          reason,
        });
      }
    }

    if (violations.length > 0) {
      return {
        tripwireTriggered: true,
        outputInfo: {
          reason: 'Agent output contains prohibited content.',
          violationCount: violations.length,
          violations,
          action:
            'The response has been blocked. A safe, rewritten response should be generated.',
        },
      };
    }

    return {
      tripwireTriggered: false,
      outputInfo: null,
    };
  },
};
