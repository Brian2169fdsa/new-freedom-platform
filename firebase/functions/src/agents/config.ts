import { createAnthropic } from '@ai-sdk/anthropic';
import { aisdk } from '@openai/agents-extensions';
import { defineString } from 'firebase-functions/params';

const claudeApiKey = defineString('CLAUDE_API_KEY');

let modelInstance: ReturnType<typeof aisdk> | null = null;

export function getModel() {
  if (!modelInstance) {
    const provider = createAnthropic({ apiKey: claudeApiKey.value() });
    modelInstance = aisdk(provider('claude-sonnet-4-20250514'));
  }
  return modelInstance;
}

let guardrailModelInstance: ReturnType<typeof aisdk> | null = null;

export function getGuardrailModel() {
  if (!guardrailModelInstance) {
    const provider = createAnthropic({ apiKey: claudeApiKey.value() });
    guardrailModelInstance = aisdk(provider('claude-haiku-4-5-20251001'));
  }
  return guardrailModelInstance;
}
