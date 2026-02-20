import { callFunction } from '../firebase/functions';

export type AIPersona = 'recoveryGuide' | 'lifeNavigator' | 'resourceFinder' | 'resumeCoach';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  persona: AIPersona;
  message: string;
  history?: ChatMessage[];
}

interface ChatResponse {
  reply: string;
}

// All AI calls go through Cloud Functions — never expose API keys client-side
const chatWithAI = callFunction<ChatRequest, ChatResponse>('chatWithAI');

export const sendAIMessage = async (
  persona: AIPersona,
  message: string,
  history: ChatMessage[] = []
): Promise<string> => {
  const result = await chatWithAI({ persona, message, history });
  return result.data.reply;
};

export type { ChatMessage, ChatRequest, ChatResponse };
