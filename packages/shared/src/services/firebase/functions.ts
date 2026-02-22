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
