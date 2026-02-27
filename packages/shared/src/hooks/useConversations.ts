import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  addDoc,
} from 'firebase/firestore';
import { db } from '../services/firebase/config';
import { useAuth } from './useAuth';
import { demoStore } from '../demo/store';
import type { Conversation } from '../types';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

interface UseConversationsReturn {
  conversations: Conversation[];
  loading: boolean;
  error: Error | null;
  totalUnread: number;
  createConversation: (
    participantIds: string[],
    title?: string
  ) => Promise<string>;
}

export function useConversations(): UseConversationsReturn {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { firebaseUser } = useAuth();

  useEffect(() => {
    if (!firebaseUser) {
      setConversations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    if (DEMO_MODE) {
      const readFromStore = () => {
        const allConversations = demoStore.getDocs('conversations') as Conversation[];
        const filtered = allConversations.filter((c) =>
          c.participants.includes(firebaseUser.uid)
        );
        setConversations(filtered);
        setLoading(false);
      };
      readFromStore();
      const unsubscribe = demoStore.subscribe('conversations', readFromStore);
      return unsubscribe;
    }

    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', firebaseUser.uid),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Conversation[];
        setConversations(docs);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firebaseUser]);

  const totalUnread = useMemo(() => {
    if (!firebaseUser) {
      return 0;
    }

    const uid = firebaseUser.uid;
    return conversations.reduce((sum, conv) => {
      const count = conv.unreadCount?.[uid] ?? 0;
      return sum + count;
    }, 0);
  }, [conversations, firebaseUser]);

  const createConversation = useCallback(
    async (participantIds: string[], title?: string): Promise<string> => {
      if (!firebaseUser) {
        throw new Error('User must be authenticated to create a conversation');
      }

      if (participantIds.length === 0) {
        throw new Error('A conversation requires at least one other participant');
      }

      const allParticipants = Array.from(
        new Set([firebaseUser.uid, ...participantIds])
      );

      const isGroup = allParticipants.length > 2;

      const initialUnreadCount: Record<string, number> = {};
      for (const uid of allParticipants) {
        initialUnreadCount[uid] = 0;
      }

      const now = new Date();
      const toTimestampLike = (d: Date) => ({ toDate: () => d, seconds: Math.floor(d.getTime() / 1000), nanoseconds: 0 });

      const conversationData = {
        participants: allParticipants,
        type: isGroup ? 'group' : 'direct',
        ...(title ? { title } : {}),
        lastMessage: '',
        lastMessageAt: DEMO_MODE ? toTimestampLike(now) : serverTimestamp(),
        unreadCount: initialUnreadCount,
        createdAt: DEMO_MODE ? toTimestampLike(now) : serverTimestamp(),
      };

      if (DEMO_MODE) {
        return demoStore.addDoc('conversations', conversationData);
      }

      const docRef = await addDoc(collection(db, 'conversations'), conversationData);
      return docRef.id;
    },
    [firebaseUser]
  );

  return useMemo(
    () => ({
      conversations,
      loading,
      error,
      totalUnread,
      createConversation,
    }),
    [conversations, loading, error, totalUnread, createConversation]
  );
}
