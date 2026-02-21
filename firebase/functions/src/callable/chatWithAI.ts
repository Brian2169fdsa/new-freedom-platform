import {callHandler} from "../interfaces/callHandler";
import {RequestConfig} from "../interfaces/requestConfig";
import {IncludeAuthUser} from "../interfaces/context";
import {z} from "zod";
import {run, InputGuardrailTripwireTriggered} from "@openai/agents";
import type {AgentInputItem} from "@openai/agents";
import {initializeAgents, triageAgent, crisisAgent} from "../agents/registry";
import {createInitialContext, AgentSessionContext} from "../agents/context";
import {
  getOrCreateSession,
  loadSessionHistory,
  saveSessionHistory,
} from "../agents/sessions";

// ---------------------------------------------------------------------------
// Request / Response schemas
// ---------------------------------------------------------------------------
const ChatWithAIReq = z.object({
  message: z.string().min(1),
  sessionId: z.string().optional(),
});

interface ChatWithAIRes {
  reply: string;
  agentName: string;
  sessionId: string;
  handoffOccurred: boolean;
  crisisDetected: boolean;
}

const config: RequestConfig<typeof ChatWithAIReq, ChatWithAIRes> = {
  name: "chatWithAI",
  schema: ChatWithAIReq,
  contextOptions: IncludeAuthUser,
};

// ---------------------------------------------------------------------------
// Callable handler
// ---------------------------------------------------------------------------
export const chatWithAI = callHandler(config, async (request, ctx) => {
  const userId = ctx.authUserId;
  const userName = String(
    ctx.authUser?.firstName || ctx.authUser?.displayName || ""
  );

  // Ensure all agents are wired up (idempotent)
  initializeAgents();

  // Session management
  const sessionId = request.sessionId || (await getOrCreateSession(userId));
  const storedHistory = await loadSessionHistory(sessionId);

  // Build the agent context
  const agentContext: AgentSessionContext = createInitialContext(
    userId,
    sessionId
  );
  agentContext.userName = userName;
  agentContext.userRole = String(ctx.authUser?.role || "member");

  // Build input for the agent run:
  // If we have history from a previous run, use it + append new user message.
  // Otherwise, just send the message string.
  let input: string | AgentInputItem[];
  if (storedHistory.length > 0) {
    input = [
      ...(storedHistory as AgentInputItem[]),
      {role: "user" as const, content: request.message},
    ];
  } else {
    input = request.message;
  }

  let reply = "";
  let agentName = "Triage Agent";
  let crisisDetected = false;
  let handoffOccurred = false;

  try {
    // Run the agent network starting at triage
    const result = await run(triageAgent, input, {
      context: agentContext,
      maxTurns: 10,
    });

    // Extract the final text response
    reply =
      typeof result.finalOutput === "string"
        ? result.finalOutput
        : result.finalOutput
          ? JSON.stringify(result.finalOutput)
          : "I'm here to help. Could you tell me more about what you need?";

    // Determine which agent responded last
    agentName = result.lastAgent?.name || "Triage Agent";
    handoffOccurred = agentName !== "Triage Agent";
    crisisDetected = agentContext.crisisDetected;

    // Save the full history from the run result for next turn
    await saveSessionHistory(sessionId, result.history, agentName);
  } catch (error) {
    if (error instanceof InputGuardrailTripwireTriggered) {
      // Crisis guardrail was triggered — run crisis agent directly
      crisisDetected = true;
      agentContext.crisisDetected = true;

      try {
        const crisisResult = await run(
          crisisAgent,
          request.message,
          {context: agentContext, maxTurns: 3}
        );

        reply =
          typeof crisisResult.finalOutput === "string"
            ? crisisResult.finalOutput
            : [
              "I can see you're going through something really difficult right now.",
              "",
              "Please reach out to one of these resources:",
              "- **988 Suicide & Crisis Lifeline:** Call or text 988",
              "- **Crisis Text Line:** Text HOME to 741741",
              "- **SAMHSA Helpline:** 1-800-662-4357",
              "- **Arizona Crisis Line:** 1-844-534-4673",
              "- **Emergency:** Call 911",
              "",
              "You are not alone. Someone is ready to help right now.",
            ].join("\n");

        agentName = "Crisis Agent";

        // Save crisis history
        await saveSessionHistory(
          sessionId,
          crisisResult.history,
          agentName
        );
      } catch (_crisisError) {
        // Fallback if even crisis agent fails
        reply = [
          "I want you to know that you matter and help is available right now.",
          "",
          "Please contact one of these resources immediately:",
          "- **988 Suicide & Crisis Lifeline:** Call or text 988",
          "- **Crisis Text Line:** Text HOME to 741741",
          "- **SAMHSA Helpline:** 1-800-662-4357",
          "- **Emergency:** Call 911",
        ].join("\n");
        agentName = "Crisis Agent";
      }
    } else {
      // Unexpected error — return a safe fallback
      reply =
        "I'm sorry, I'm having trouble right now. Please try again in a moment.";
      agentName = "System";
    }
  }

  return {
    reply,
    agentName,
    sessionId,
    handoffOccurred,
    crisisDetected,
  };
});
