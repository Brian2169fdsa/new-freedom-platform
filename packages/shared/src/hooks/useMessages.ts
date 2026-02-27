import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
  doc,
  serverTimestamp,
  addDoc,
} from 'firebase/firestore';
import { db } from '../services/firebase/config';
import { updateDocument } from '../services/firebase/firestore';
import { useAuth } from './useAuth';
import { demoStore } from '../demo/store';
import type { Message, MessageType } from '../types';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

interface UseMessagesReturn {
  messages: Message[];
  loading: boolean;
  error: Error | null;
  sendMessage: (
    conversationId: string,
    content: string,
    type?: MessageType
  ) => Promise<string>;
  markAsRead: (conversationId: string) => Promise<void>;
}

export function useMessages(conversationId: string | null | undefined): UseMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { firebaseUser } = useAuth();

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    if (DEMO_MODE) {
      // Read from demo store, filter by conversationId
      const readFromStore = () => {
        const allMessages = demoStore.getDocs('messages') as Message[];
        const filtered = allMessages
          .filter((m) => m.conversationId === conversationId)
          .sort((a, b) => {
            const aTime = (a.createdAt as any)?.toDate?.() ?? new Date(a.createdAt as any);
            const bTime = (b.createdAt as any)?.toDate?.() ?? new Date(b.createdAt as any);
            return aTime.getTime() - bTime.getTime();
          });
        setMessages(filtered);
        setLoading(false);
      };
      readFromStore();
      const unsubscribe = demoStore.subscribe('messages', readFromStore);
      return unsubscribe;
    }

    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Message[];
        setMessages(docs);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [conversationId]);

  const sendMessage = useCallback(
    async (
      targetConversationId: string,
      content: string,
      type: MessageType = 'text'
    ): Promise<string> => {
      if (!firebaseUser) {
        throw new Error('User must be authenticated to send messages');
      }

      if (!content.trim()) {
        throw new Error('Message content cannot be empty');
      }

      const now = new Date();
      const toTimestampLike = (d: Date) => ({ toDate: () => d, seconds: Math.floor(d.getTime() / 1000), nanoseconds: 0 });

      const messageData = {
        conversationId: targetConversationId,
        senderId: firebaseUser.uid,
        content: content.trim(),
        type,
        readBy: [firebaseUser.uid],
        createdAt: DEMO_MODE ? toTimestampLike(now) : serverTimestamp(),
      };

      if (DEMO_MODE) {
        const id = demoStore.addDoc('messages', messageData);
        demoStore.updateDoc('conversations', targetConversationId, {
          lastMessage: content.trim(),
          lastMessageAt: toTimestampLike(now),
        });
        return id;
      }

      const docRef = await addDoc(collection(db, 'messages'), messageData);

      await updateDocument('conversations', targetConversationId, {
        lastMessage: content.trim(),
        lastMessageAt: serverTimestamp(),
      });

      return docRef.id;
    },
    [firebaseUser]
  );

  const markAsRead = useCallback(
    async (targetConversationId: string): Promise<void> => {
      if (!firebaseUser) {
        throw new Error('User must be authenticated to mark messages as read');
      }

      const uid = firebaseUser.uid;

      const unreadMessages = messages.filter(
        (msg) =>
          msg.conversationId === targetConversationId &&
          !msg.readBy.includes(uid)
      );

      if (unreadMessages.length === 0) {
        return;
      }

      if (DEMO_MODE) {
        for (const msg of unreadMessages) {
          demoStore.updateDoc('messages', msg.id, {
            readBy: [...msg.readBy, uid],
          });
        }
        demoStore.updateDoc('conversations', targetConversationId, {
          [`unreadCount.${uid}`]: 0,
        });
        return;
      }

      const batch = writeBatch(db);

      for (const msg of unreadMessages) {
        const msgRef = doc(db, 'messages', msg.id);
        batch.update(msgRef, {
          readBy: [...msg.readBy, uid],
        });
      }

      const convRef = doc(db, 'conversations', targetConversationId);
      batch.update(convRef, {
        [`unreadCount.${uid}`]: 0,
      });

      await batch.commit();
    },
    [firebaseUser, messages]
  );

  return useMemo(
    () => ({
      messages,
      loading,
      error,
      sendMessage,
      markAsRead,
    }),
    [messages, loading, error, sendMessage, markAsRead]
  );
}
