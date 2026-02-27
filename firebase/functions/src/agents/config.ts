import { createAnthropic } from '@ai-sdk/anthropic';
import { aisdk } from '@openai/agents-extensions';
import { defineString } from 'firebase-functions/params';

const claudeApiKey = defineString('CLAUDE_API_KEY');

export class MissingApiKeyError extends Error {
  constructor() {
    super(
      'CLAUDE_API_KEY is not configured. Set it with: firebase functions:config:set claude.api_key="sk-..." or define it in .env.local'
    );
    this.name = 'MissingApiKeyError';
  }
}

function getApiKey(): string {
  const key = claudeApiKey.value();
  if (!key) {
    throw new MissingApiKeyError();
  }
  return key;
}

let modelInstance: ReturnType<typeof aisdk> | null = null;

export function getModel() {
  if (!modelInstance) {
    const provider = createAnthropic({ apiKey: getApiKey() });
    modelInstance = aisdk(provider('claude-sonnet-4-20250514'));
  }
  return modelInstance;
}

let guardrailModelInstance: ReturnType<typeof aisdk> | null = null;

export function getGuardrailModel() {
  if (!guardrailModelInstance) {
    const provider = createAnthropic({ apiKey: getApiKey() });
    guardrailModelInstance = aisdk(provider('claude-haiku-4-5-20251001'));
  }
  return guardrailModelInstance;
}
