import { httpsCallable } from 'firebase/functions';
import { functions } from './config';

export const callFunction = <T = unknown, R = unknown>(name: string) =>
  httpsCallable<T, R>(functions, name);

// Pre-defined callable functions matching existing backend
export const savePost = callFunction('savePost');
export const saveMessage = callFunction('saveMessage');
export const likePost = callFunction('likePost');
export const unlikePost = callFunction('unlikePost');
export const archivePost = callFunction('archivePost');
export const reportPost = callFunction('reportPost');
export const moderatePost = callFunction('moderatePost');
export const blockUser = callFunction('blockUser');
export const unblockUser = callFunction('unblockUser');
export const updateUser = callFunction('updateUser');
export const deleteUser = callFunction('deleteUser');
export const suspendUser = callFunction('suspendUser');
export const saveProfilePicture = callFunction('saveProfilePicture');
export const removeProfilePicture = callFunction('removeProfilePicture');
export const markMessageAsRead = callFunction('markMessageAsRead');
export const getPendingModerationReportId = callFunction('getPendingModerationReportId');
export const chatWithAI = callFunction<
  { message: string; sessionId?: string },
  { reply: string; agentName: string; sessionId: string; handoffOccurred: boolean; crisisDetected: boolean }
>('chatWithAI');

// Notification callable functions
export const markNotificationRead = callFunction<
  { notificationId: string },
  { success: boolean }
>('markNotificationRead');

export const getUnreadCount = callFunction<
  void,
  { total: number; lane1: number; lane2: number; lane3: number }
>('getUnreadCount');

// Stripe donation callable functions
export const createCheckoutSession = callFunction<
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

export const createPortalSession = callFunction<
  { customerId: string },
  { url: string }
>('createPortalSession');

export const getDonationHistory = callFunction<
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
