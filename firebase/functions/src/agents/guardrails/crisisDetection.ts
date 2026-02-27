/**
 * Crisis Detection — Input Guardrail
 *
 * Fast keyword scan that detects crisis-related language in user
 * messages. When triggered it sets context.crisisDetected = true
 * and halts normal agent flow so the crisis protocol can activate.
 */

import { InputGuardrail } from '@openai/agents';

// ---------------------------------------------------------------------------
// Crisis keyword / phrase list
// ---------------------------------------------------------------------------
const CRISIS_PHRASES: string[] = [
  'kill myself',
  'suicide',
  'suicidal',
  'end my life',
  'want to die',
  'self-harm',
  'self harm',
  'cutting myself',
  'overdose',
  "od'd",
  'oded',
  'relapsed',
  'not safe',
  'being hurt',
  'domestic violence',
  'going to hurt',
  'no reason to live',
  'better off dead',
  'hurt myself',
  'don\'t want to be here',
  'can\'t go on',
  'end it all',
  'take my own life',
  'wanna die',
  'want to disappear',
  'abuse',
  'being abused',
];

// Pre-compile a single regex for performance
const CRISIS_REGEX = new RegExp(
  CRISIS_PHRASES.map((phrase) => phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
  'i'
);

// ---------------------------------------------------------------------------
// Guardrail implementation
// ---------------------------------------------------------------------------
export const crisisDetectionGuardrail: InputGuardrail = {
  name: 'crisis_detection',

  async execute({ input, context }) {
    // Only scan the LATEST user message, not the full history.
    // This prevents re-triggering on crisis language from prior turns
    // that was already handled by the Crisis Agent.
    let text: string;
    if (typeof input === 'string') {
      text = input;
    } else if (Array.isArray(input)) {
      // Find the last user message in the array
      const lastUserMsg = [...input].reverse().find(
        (msg: any) => msg.role === 'user'
      );
      if (lastUserMsg) {
        const msg = lastUserMsg as any;
        if (typeof msg.content === 'string') {
          text = msg.content;
        } else if (Array.isArray(msg.content)) {
          text = msg.content
            .map((part: any) => (typeof part === 'string' ? part : part.text || ''))
            .join(' ');
        } else {
          text = '';
        }
      } else {
        text = '';
      }
    } else {
      text = '';
    }

    const matched = CRISIS_REGEX.test(text);

    if (matched) {
      // Flag the context so downstream handlers can activate crisis protocol
      if (context?.context) {
        (context.context as any).crisisDetected = true;
      }

      return {
        tripwireTriggered: true,
        outputInfo: {
          reason: 'Crisis language detected in user message.',
          action: 'Routing to crisis response protocol.',
          resources: {
            '988_suicide_lifeline': 'Call or text 988',
            'crisis_text_line': 'Text HOME to 741741',
            'samhsa_helpline': '1-800-662-4357',
            'emergency': 'Call 911',
          },
        },
      };
    }

    return {
      tripwireTriggered: false,
      outputInfo: null,
    };
  },
};
