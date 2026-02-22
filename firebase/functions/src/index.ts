// Firebase init.
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
initializeApp();
getFirestore().settings({ignoreUndefinedProperties: true});

// Triggers.
export {onAnyDocumentCreated} from "./triggers/onAnyDocumentCreated";
export {onAuthUserCreated} from "./triggers/onAuthUserCreated";
export {onUserUpdated} from "./triggers/onUserUpdated";

// Callable.
export {chatWithAI} from "./callable/chatWithAI";
export {archivePost} from "./callable/archivePost";
export {blockUser} from "./callable/blockUser";
export {unblockUser} from "./callable/unblockUser";
export {deleteUser} from "./callable/deleteUser";
export {suspendUser} from "./callable/suspendUser";
export {
  getPendingModerationReportId,
} from "./callable/getPendingModerationReportId";
export {likePost} from "./callable/likePost";
export {saveMessage} from "./callable/saveMessage";
export {markMessageAsRead} from "./callable/markMessageAsRead";
export {moderatePost} from "./callable/moderatePost";
export {removeProfilePicture} from "./callable/removeProfilePicture";
export {saveProfilePicture} from "./callable/saveProfilePicture";
export {updateUser} from "./callable/updateUser";
export {unlikePost} from "./callable/unlikePost";
export {savePost} from "./callable/savePost";
export {reportPost} from "./callable/reportPost";

// Notification triggers + callable.
export {
  onGoalCompleted,
  onStepCompleted,
  onNewMessage,
  onCrisisDetected,
  markNotificationRead,
  getUnreadCount,
} from "./notifications";

// Scheduled functions.
export {
  dailyCheckInReminder,
  weeklyProgressReport,
} from "./scheduled";

// Stripe donation functions.
export {
  createCheckoutSession,
  createPortalSession,
  stripeWebhook,
  getDonationHistory,
} from "./stripe";

// Privacy & GDPR compliance.
export {
  exportUserData,
  deleteAllUserData,
  getPrivacySettings,
  updatePrivacySettings,
} from "./privacy";

// Public endpoints.
export {me} from "./public/me";

// Lane 3: My Struggle -- Content Moderation System.
export {
  moderateContent,
  autoModeratePost,
  getModerationQueue,
  reviewModeration,
} from "./moderation";
