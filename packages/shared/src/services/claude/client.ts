import { callFunction } from '../firebase/functions';

// Legacy persona type (still used for selecting initial persona in UI)
export type AIPersona = 'recoveryGuide' | 'lifeNavigator' | 'resourceFinder' | 'resumeCoach';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// --- New multi-agent types ---
interface AgentChatRequest {
  message: string;
  sessionId?: string;
}

interface AgentChatResponse {
  reply: string;
  agentName: string;
  sessionId: string;
  handoffOccurred: boolean;
  crisisDetected: boolean;
}

// The callable function that maps to the backend chatWithAI
const chatWithAI = callFunction<AgentChatRequest, AgentChatResponse>('chatWithAI');

/**
 * Send a message to the multi-agent AI system.
 * The triage agent routes to the correct specialist automatically.
 * Pass `sessionId` from a previous response to continue the conversation.
 */
export const sendAIMessage = async (
  message: string,
  sessionId?: string
): Promise<AgentChatResponse> => {
  const result = await chatWithAI({ message, sessionId });
  return result.data;
};

export type { ChatMessage, AgentChatRequest, AgentChatResponse };
