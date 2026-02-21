import { getModel } from './config';
import { triageAgent } from './triage';
import { crisisAgent } from './crisis';
import { lifeNavigatorAgent } from './lifeNavigator';
import { recoveryGuideAgent } from './recoveryGuide';
import { resourceFinderAgent } from './resourceFinder';
import { resumeCoachAgent } from './resumeCoach';
import { peerMentorAgent } from './peerMentor';
import { crisisDetectionGuardrail } from './guardrails/crisisDetection';
import { safetyOutputGuardrail } from './guardrails/safetyOutput';

let initialized = false;

/**
 * Initializes all agents with the correct model, handoffs, and guardrails.
 * This function is idempotent — calling it multiple times has no additional effect.
 * Must be called once before running any agent.
 */
export function initializeAgents(): void {
  if (initialized) return;

  // --- Set model on all agents (lazy initialization) ---
  const model = getModel();
  triageAgent.model = model;
  crisisAgent.model = model;
  lifeNavigatorAgent.model = model;
  recoveryGuideAgent.model = model;
  resourceFinderAgent.model = model;
  resumeCoachAgent.model = model;
  peerMentorAgent.model = model;

  // --- Wire handoffs ---
  // Triage can route to any specialist
  triageAgent.handoffs = [
    crisisAgent,
    lifeNavigatorAgent,
    recoveryGuideAgent,
    resourceFinderAgent,
    resumeCoachAgent,
    peerMentorAgent,
  ];

  // Crisis can only return to triage once the user is safe
  crisisAgent.handoffs = [triageAgent];

  // Life Navigator can connect to resume help or local resources
  lifeNavigatorAgent.handoffs = [triageAgent, resumeCoachAgent, resourceFinderAgent];

  // Recovery Guide can escalate to crisis or return to triage
  recoveryGuideAgent.handoffs = [triageAgent, crisisAgent];

  // Resource Finder returns to triage for other needs
  resourceFinderAgent.handoffs = [triageAgent];

  // Resume Coach can connect to life tasks or return to triage
  resumeCoachAgent.handoffs = [triageAgent, lifeNavigatorAgent];

  // Peer Mentor can connect to recovery support or return to triage
  peerMentorAgent.handoffs = [triageAgent, recoveryGuideAgent];

  // --- Apply input guardrails ---
  // Crisis detection runs on every incoming message to triage
  triageAgent.inputGuardrails = [crisisDetectionGuardrail];

  // --- Apply output guardrails ---
  // Safety output guardrail runs on ALL agents to ensure no harmful content is sent
  const allAgents = [
    triageAgent,
    crisisAgent,
    lifeNavigatorAgent,
    recoveryGuideAgent,
    resourceFinderAgent,
    resumeCoachAgent,
    peerMentorAgent,
  ];

  for (const agent of allAgents) {
    agent.outputGuardrails = [safetyOutputGuardrail];
  }

  initialized = true;
}

// --- Export all agents ---
export {
  triageAgent,
  crisisAgent,
  lifeNavigatorAgent,
  recoveryGuideAgent,
  resourceFinderAgent,
  resumeCoachAgent,
  peerMentorAgent,
};
