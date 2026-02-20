import { useCollection } from './useFirestore';
import { useAuth } from './useAuth';
import { where, orderBy } from 'firebase/firestore';
import type { AppNotification } from '../types';

export function useNotifications() {
  const { firebaseUser } = useAuth();
  const uid = firebaseUser?.uid;

  const { data: notifications, loading } = useCollection<AppNotification>(
    'notifications',
    ...(uid ? [where('userId', '==', uid), orderBy('createdAt', 'desc')] : [])
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    loading,
  };
}
