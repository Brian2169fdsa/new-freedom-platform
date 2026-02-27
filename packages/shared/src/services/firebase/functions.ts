import { httpsCallable } from 'firebase/functions';
import { functions } from './config';
import { demoStore } from '../../demo/store';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

// In demo mode, return a mock callable that returns { data: defaultResult }
function demoCallable<T, R>(name: string, handler?: (input: T) => R) {
  return ((input?: T) =>
    Promise.resolve({
      data: handler ? handler(input as T) : ({} as R),
    })) as unknown as ReturnType<typeof httpsCallable<T, R>>;
}

export const callFunction = <T = unknown, R = unknown>(name: string) => {
  if (DEMO_MODE) {
    return demoCallable<T, R>(name);
  }
  return httpsCallable<T, R>(functions, name);
};

// Pre-defined callable functions matching existing backend
export const savePost = DEMO_MODE
  ? demoCallable('savePost', () => ({ success: true }))
  : callFunction('savePost');
export const saveMessage = DEMO_MODE
  ? demoCallable('saveMessage', () => ({ success: true }))
  : callFunction('saveMessage');
export const likePost = DEMO_MODE
  ? demoCallable<{ postId: string }, unknown>('likePost', ({ postId }) => {
      const post = demoStore.getDoc('posts', postId);
      if (post) {
        const likes = post.likes?.includes('demo-user')
          ? post.likes
          : [...(post.likes || []), 'demo-user'];
        demoStore.updateDoc('posts', postId, { likes });
      }
      return { success: true };
    })
  : callFunction('likePost');
export const unlikePost = DEMO_MODE
  ? demoCallable<{ postId: string }, unknown>('unlikePost', ({ postId }) => {
      const post = demoStore.getDoc('posts', postId);
      if (post) {
        const likes = (post.likes || []).filter((id: string) => id !== 'demo-user');
        demoStore.updateDoc('posts', postId, { likes });
      }
      return { success: true };
    })
  : callFunction('unlikePost');
export const archivePost = callFunction('archivePost');
export const reportPost = DEMO_MODE
  ? demoCallable('reportPost', () => ({ success: true }))
  : callFunction('reportPost');
export const moderatePost = callFunction('moderatePost');
export const blockUser = callFunction('blockUser');
export const unblockUser = callFunction('unblockUser');
export const updateUser = callFunction('updateUser');
export const deleteUser = callFunction('deleteUser');
export const suspendUser = callFunction('suspendUser');
export const saveProfilePicture = callFunction('saveProfilePicture');
export const removeProfilePicture = callFunction('removeProfilePicture');
export const markMessageAsRead = DEMO_MODE
  ? demoCallable('markMessageAsRead', () => ({ success: true }))
  : callFunction('markMessageAsRead');
export const getPendingModerationReportId = callFunction('getPendingModerationReportId');

const AI_DEMO_REPLIES = [
  "That's a great question. Remember, every day in recovery is progress — even the hard ones. What specific challenge are you facing right now?",
  "I hear you. Building a new life takes time, and it's okay to feel overwhelmed. Let's break this down into smaller steps. What feels most urgent?",
  "You're doing the right thing by reaching out. For housing resources in Phoenix, I'd recommend checking the Resources tab — there are several transitional housing options that work with people in recovery.",
  "Great progress on your goals! Staying consistent with your routine is one of the strongest predictors of long-term success. Keep showing up for yourself.",
  "I understand that job interviews can feel stressful, especially when you're worried about background questions. Would you like to practice some common interview scenarios together?",
];
let aiReplyIndex = 0;

export const chatWithAI = DEMO_MODE
  ? demoCallable<
      { message: string; sessionId?: string },
      { reply: string; agentName: string; sessionId: string; handoffOccurred: boolean; crisisDetected: boolean }
    >('chatWithAI', (input) => {
      const reply = AI_DEMO_REPLIES[aiReplyIndex % AI_DEMO_REPLIES.length];
      aiReplyIndex++;
      return {
        reply,
        agentName: 'Recovery Guide',
        sessionId: input?.sessionId || 'demo-session-' + Date.now(),
        handoffOccurred: false,
        crisisDetected: false,
      };
    })
  : callFunction<
      { message: string; sessionId?: string },
      { reply: string; agentName: string; sessionId: string; handoffOccurred: boolean; crisisDetected: boolean }
    >('chatWithAI');

// Notification callable functions
export const markNotificationRead = DEMO_MODE
  ? demoCallable<{ notificationId: string }, { success: boolean }>('markNotificationRead', ({ notificationId }) => {
      demoStore.updateDoc('notifications', notificationId, { read: true });
      return { success: true };
    })
  : callFunction<{ notificationId: string }, { success: boolean }>('markNotificationRead');

export const getUnreadCount = DEMO_MODE
  ? demoCallable<void, { total: number; lane1: number; lane2: number; lane3: number }>('getUnreadCount', () => {
      const notifications = demoStore.getDocs('notifications');
      const unread = notifications.filter((n: any) => !n.read).length;
      return { total: unread, lane1: unread, lane2: 0, lane3: 0 };
    })
  : callFunction<void, { total: number; lane1: number; lane2: number; lane3: number }>('getUnreadCount');

// Stripe donation callable functions
export const createCheckoutSession = DEMO_MODE
  ? demoCallable<any, { sessionId: string; url: string }>('createCheckoutSession', () => ({
      sessionId: 'demo-session',
      url: '#demo-checkout',
    }))
  : callFunction<
      {
        amount: number;
        currency: string;
        donorName?: string;
        email?: string;
        isRecurring: boolean;
        metadata?: Record<string, string>;
      },
      { sessionId: string; url: string }
    >('createCheckoutSession');

export const createPortalSession = DEMO_MODE
  ? demoCallable<{ customerId: string }, { url: string }>('createPortalSession', () => ({
      url: '#demo-portal',
    }))
  : callFunction<{ customerId: string }, { url: string }>('createPortalSession');

export const getDonationHistory = DEMO_MODE
  ? demoCallable<void, { donations: any[] }>('getDonationHistory', () => ({
      donations: [
        {
          id: 'don-1',
          amount: 2500,
          currency: 'usd',
          status: 'completed',
          donorName: 'Demo User',
          email: 'demo@reprieve.app',
          isRecurring: false,
          stripeSessionId: 'demo-stripe-1',
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          metadata: {},
          createdAt: new Date(Date.now() - 7 * 86400000),
        },
      ],
    }))
  : callFunction<
      void,
      {
        donations: Array<{
          id: string;
          amount: number;
          currency: string;
          status: string;
          donorName: string | null;
          email: string | null;
          isRecurring: boolean;
          stripeSessionId: string;
          stripeCustomerId: string | null;
          stripeSubscriptionId: string | null;
          metadata: Record<string, string>;
          createdAt: unknown;
        }>;
      }
    >('getDonationHistory');

// Audit log callable functions
export interface AuditLogFilters {
  dateFrom?: string;
  dateTo?: string;
  actionCategory?: string;
  actorSearch?: string;
  severity?: string;
}

export interface AuditLogActor {
  uid: string;
  email: string;
  displayName: string;
}

export interface AuditLogTarget {
  type: string;
  id: string;
  name?: string;
}

export interface AuditLogEntry {
  id: string;
  actor: AuditLogActor;
  action: string;
  category: string;
  target?: AuditLogTarget;
  severity: 'info' | 'warning' | 'critical';
  details?: Record<string, unknown>;
  ip?: string;
  createdAt: unknown;
}

export const getAuditLogFn = DEMO_MODE
  ? demoCallable<any, { entries: AuditLogEntry[]; hasMore: boolean; totalEstimate: number }>('getAuditLog', () => ({
      entries: [
        {
          id: 'audit-1',
          actor: { uid: 'demo-user', email: 'demo@reprieve.app', displayName: 'Demo User' },
          action: 'user.login',
          category: 'authentication',
          severity: 'info' as const,
          createdAt: new Date(Date.now() - 3600000),
        },
        {
          id: 'audit-2',
          actor: { uid: 'demo-user', email: 'demo@reprieve.app', displayName: 'Demo User' },
          action: 'goal.created',
          category: 'content',
          target: { type: 'goal', id: 'goal-1', name: 'Find stable employment' },
          severity: 'info' as const,
          createdAt: new Date(Date.now() - 7200000),
        },
      ],
      hasMore: false,
      totalEstimate: 2,
    }))
  : callFunction<
      {
        pageSize?: number;
        startAfterTimestamp?: string;
        filters?: AuditLogFilters;
      },
      {
        entries: AuditLogEntry[];
        hasMore: boolean;
        totalEstimate: number;
      }
    >('getAuditLog');

export interface ExportAuditLogEntry {
  id: string;
  timestamp: string;
  actorUid: string;
  actorEmail: string;
  actorName: string;
  action: string;
  category: string;
  severity: string;
  targetType?: string;
  targetId?: string;
  targetName?: string;
  details?: string;
  ip?: string;
}

export const exportAuditLogFn = DEMO_MODE
  ? demoCallable<any, { entries: ExportAuditLogEntry[]; exportedAt: string; totalCount: number }>('exportAuditLog', () => ({
      entries: [],
      exportedAt: new Date().toISOString(),
      totalCount: 0,
    }))
  : callFunction<
      { filters?: AuditLogFilters },
      {
        entries: ExportAuditLogEntry[];
        exportedAt: string;
        totalCount: number;
      }
    >('exportAuditLog');

// Privacy & GDPR callable functions
const DEMO_PRIVACY_SETTINGS = {
  profileVisibility: 'connections' as const,
  showSobrietyDate: false,
  showActivityStatus: true,
  allowMessages: 'everyone' as const,
  dataRetentionDays: 365 as const,
};

export const exportUserData = DEMO_MODE
  ? demoCallable<void, any>('exportUserData', () => ({
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        userId: 'demo-user',
        platform: 'REPrieve',
        dataCategories: ['profile', 'goals', 'journal'],
      },
      userProfile: { displayName: 'Demo User', email: 'demo@reprieve.app' },
      privacySettings: DEMO_PRIVACY_SETTINGS,
    }))
  : callFunction<
      void,
      {
        exportMetadata: {
          exportedAt: string;
          userId: string;
          platform: string;
          dataCategories: string[];
        };
        userProfile: Record<string, unknown> | null;
        privacySettings: Record<string, unknown>;
        [collection: string]: unknown;
      }
    >('exportUserData');

export const deleteAllUserData = DEMO_MODE
  ? demoCallable<{ confirmationText: string }, any>('deleteAllUserData', () => ({
      success: true,
      deletedCollections: [],
      totalDocumentsDeleted: 0,
    }))
  : callFunction<
      { confirmationText: string },
      { success: boolean; deletedCollections: string[]; totalDocumentsDeleted: number }
    >('deleteAllUserData');

export const getPrivacySettings = DEMO_MODE
  ? demoCallable<void, typeof DEMO_PRIVACY_SETTINGS>('getPrivacySettings', () => DEMO_PRIVACY_SETTINGS)
  : callFunction<
      void,
      {
        profileVisibility: 'public' | 'connections' | 'private';
        showSobrietyDate: boolean;
        showActivityStatus: boolean;
        allowMessages: 'everyone' | 'connections' | 'none';
        dataRetentionDays: 90 | 180 | 365 | -1;
      }
    >('getPrivacySettings');

export const updatePrivacySettings = DEMO_MODE
  ? demoCallable<any, any>('updatePrivacySettings', (input) => ({
      success: true,
      settings: { ...DEMO_PRIVACY_SETTINGS, ...input },
    }))
  : callFunction<
      {
        profileVisibility?: 'public' | 'connections' | 'private';
        showSobrietyDate?: boolean;
        showActivityStatus?: boolean;
        allowMessages?: 'everyone' | 'connections' | 'none';
        dataRetentionDays?: 90 | 180 | 365 | -1;
      },
      {
        success: boolean;
        settings: {
          profileVisibility: 'public' | 'connections' | 'private';
          showSobrietyDate: boolean;
          showActivityStatus: boolean;
          allowMessages: 'everyone' | 'connections' | 'none';
          dataRetentionDays: 90 | 180 | 365 | -1;
        };
      }
    >('updatePrivacySettings');
