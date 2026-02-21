export interface AgentSessionContext {
  userId: string;
  sessionId: string;
  activeLane: 'lane1' | 'lane2' | 'lane3' | 'all';
  userName: string;
  userRole: string;
  crisisDetected: boolean;
  handoffOccurred: boolean;
  lastAgentName: string;
  caseManagerId?: string;
}

/** Extract the AgentSessionContext from a RunContext, with a safe cast. */
export function getSessionUserId(runContext?: { context?: unknown }): string | undefined {
  return (runContext?.context as AgentSessionContext | undefined)?.userId;
}

export function createInitialContext(
  userId: string,
  sessionId: string,
  activeLane: 'lane1' | 'lane2' | 'lane3' | 'all' = 'all'
): AgentSessionContext {
  return {
    userId,
    sessionId,
    activeLane,
    userName: '',
    userRole: 'member',
    crisisDetected: false,
    handoffOccurred: false,
    lastAgentName: 'Triage Agent',
  };
}
