import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';

const AGENT_SESSIONS_COLLECTION = 'agent_sessions';

interface AgentSession {
  id: string;
  userId: string;
  history: Array<{ role: string; content: string }>;
  lastAgentName: string;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
  messageCount: number;
  active: boolean;
}

export async function getOrCreateSession(userId: string): Promise<string> {
  const db = getFirestore();
  const snapshot = await db.collection(AGENT_SESSIONS_COLLECTION)
    .where('userId', '==', userId)
    .where('active', '==', true)
    .orderBy('updatedAt', 'desc')
    .limit(1)
    .get();

  if (!snapshot.empty) {
    return snapshot.docs[0].id;
  }

  const sessionId = uuidv4();
  await db.collection(AGENT_SESSIONS_COLLECTION).doc(sessionId).set({
    id: sessionId,
    userId,
    history: [],
    lastAgentName: 'Triage Agent',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    messageCount: 0,
    active: true,
  });

  return sessionId;
}

export async function loadSessionHistory(
  sessionId: string
): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
  const db = getFirestore();
  const doc = await db.collection(AGENT_SESSIONS_COLLECTION).doc(sessionId).get();
  if (!doc.exists) return [];
  const data = doc.data() as AgentSession;
  return (data.history || []) as Array<{ role: 'user' | 'assistant'; content: string }>;
}

export async function saveSessionHistory(
  sessionId: string,
  history: unknown[],
  lastAgentName: string
): Promise<void> {
  const db = getFirestore();
  // Trim to last 50 items to stay within Firestore 1MB doc limit
  const trimmedHistory = history.slice(-50);
  await db.collection(AGENT_SESSIONS_COLLECTION).doc(sessionId).update({
    history: trimmedHistory,
    lastAgentName,
    updatedAt: FieldValue.serverTimestamp(),
    messageCount: FieldValue.increment(1),
  });
}

export async function endSession(sessionId: string): Promise<void> {
  const db = getFirestore();
  await db.collection(AGENT_SESSIONS_COLLECTION).doc(sessionId).update({
    active: false,
    updatedAt: FieldValue.serverTimestamp(),
  });
}
