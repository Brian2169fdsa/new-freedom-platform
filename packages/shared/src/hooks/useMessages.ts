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
import type { Message, MessageType } from '../types';

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

      const messageData = {
        conversationId: targetConversationId,
        senderId: firebaseUser.uid,
        content: content.trim(),
        type,
        readBy: [firebaseUser.uid],
        createdAt: serverTimestamp(),
      };

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
