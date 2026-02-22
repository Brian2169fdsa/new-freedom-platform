import { useMemo, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useCollection } from './useFirestore';
import { updateDocument } from '../services/firebase/firestore';
import { where, orderBy } from 'firebase/firestore';
import type { AppNotification, NotificationType, Lane } from '../types';

// --- Types ---

interface LaneUnreadCounts {
  readonly lane1: number;
  readonly lane2: number;
  readonly lane3: number;
}

interface GroupedNotifications {
  readonly lane1: ReadonlyArray<AppNotification>;
  readonly lane2: ReadonlyArray<AppNotification>;
  readonly lane3: ReadonlyArray<AppNotification>;
}

export interface UseCrossLaneNotificationsResult {
  readonly notifications: ReadonlyArray<AppNotification>;
  readonly grouped: GroupedNotifications;
  readonly unreadByLane: LaneUnreadCounts;
  readonly totalUnread: number;
  readonly loading: boolean;
  readonly markAsRead: (notificationId: string) => Promise<void>;
  readonly markAllAsReadForLane: (lane: Lane) => Promise<void>;
}

// --- Helpers ---

const LANE_TYPE_MAP: Readonly<Record<NotificationType, Lane>> = {
  appointment_reminder: 'lane1',
  job_match: 'lane1',
  milestone: 'lane2',
  achievement: 'lane2',
  community: 'lane3',
  message: 'lane3',
  system: 'lane1',
};

function inferLane(notification: AppNotification): Lane {
  return LANE_TYPE_MAP[notification.type] ?? 'lane1';
}

function groupByLane(
  notifications: ReadonlyArray<AppNotification>
): GroupedNotifications {
  const lane1: AppNotification[] = [];
  const lane2: AppNotification[] = [];
  const lane3: AppNotification[] = [];

  for (const n of notifications) {
    const lane = inferLane(n);
    if (lane === 'lane1') lane1.push(n);
    else if (lane === 'lane2') lane2.push(n);
    else lane3.push(n);
  }

  return { lane1, lane2, lane3 };
}

function countUnread(notifications: ReadonlyArray<AppNotification>): number {
  return notifications.filter((n) => !n.read).length;
}

// --- Hook ---

export function useCrossLaneNotifications(): UseCrossLaneNotificationsResult {
  const { firebaseUser } = useAuth();
  const uid = firebaseUser?.uid;

  const constraints = uid
    ? [where('userId', '==', uid), orderBy('createdAt', 'desc')]
    : [];

  const { data: notifications, loading } = useCollection<AppNotification>(
    'notifications',
    ...constraints
  );

  const grouped = useMemo(() => groupByLane(notifications), [notifications]);

  const unreadByLane = useMemo<LaneUnreadCounts>(
    () => ({
      lane1: countUnread(grouped.lane1),
      lane2: countUnread(grouped.lane2),
      lane3: countUnread(grouped.lane3),
    }),
    [grouped]
  );

  const totalUnread = useMemo(
    () => unreadByLane.lane1 + unreadByLane.lane2 + unreadByLane.lane3,
    [unreadByLane]
  );

  const markAsRead = useCallback(
    async (notificationId: string): Promise<void> => {
      await updateDocument('notifications', notificationId, { read: true });
    },
    []
  );

  const markAllAsReadForLane = useCallback(
    async (lane: Lane): Promise<void> => {
      const laneNotifications = grouped[lane];
      const unread = laneNotifications.filter((n) => !n.read);
      await Promise.all(
        unread.map((n) => updateDocument('notifications', n.id, { read: true }))
      );
    },
    [grouped]
  );

  return {
    notifications,
    grouped,
    unreadByLane,
    totalUnread,
    loading,
    markAsRead,
    markAllAsReadForLane,
  };
}
