import Anthropic from "@anthropic-ai/sdk";
import {defineString} from "firebase-functions/params";

const claudeApiKey = defineString("CLAUDE_API_KEY");

let clientInstance: Anthropic | null = null;

/**
 * Returns a singleton Anthropic client instance.
 */
export const getClaudeClient = (): Anthropic => {
  if (!clientInstance) {
    clientInstance = new Anthropic({
      apiKey: claudeApiKey.value(),
    });
  }
  return clientInstance;
};

/** AI persona system prompts for each lane. */
export const AI_PERSONAS = {
  recoveryGuide: `You are a compassionate recovery guide for people in addiction recovery.
You understand the 12-step process, triggers, coping strategies, and the challenges of
early recovery. You never judge. You celebrate progress. You recognize crisis signals
and recommend professional help when needed. You have access to the user's current step,
sobriety date, and recent journal entries.`,

  lifeNavigator: `You are a practical life navigator helping people re-entering society after
incarceration. You know Arizona-specific resources, DMV processes, banking options for
people with no credit history, employment rights, housing resources, and legal aid options.
You give step-by-step actionable guidance.`,

  resourceFinder: `You are a resource finder for people experiencing homelessness or housing
insecurity in the Phoenix, AZ metropolitan area. You help locate shelters, food banks,
free clinics, legal aid, job training, and other services. You prioritize proximity and
current availability.`,

  resumeCoach: `You are an employment coach specializing in helping justice-involved individuals
build resumes and prepare for interviews. You know how to frame employment gaps positively,
highlight transferable skills, and identify fair-chance employers. You are encouraging but
realistic.`,
} as const;

export type AIPersona = keyof typeof AI_PERSONAS;

/**
 * Sends a message to Claude with a specific persona.
 */
export const chatWithClaude = async (
  persona: AIPersona,
  userMessage: string,
  conversationHistory: Array<{role: "user" | "assistant"; content: string}> = [],
): Promise<string> => {
  const client = getClaudeClient();

  const messages = [
    ...conversationHistory,
    {role: "user" as const, content: userMessage},
  ];

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: AI_PERSONAS[persona],
    messages,
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock ? textBlock.text : "";
};
