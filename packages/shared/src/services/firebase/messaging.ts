import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import type { MessagePayload, Unsubscribe } from 'firebase/messaging';
import { app } from './config';
import { db } from './config';

// ─── Types ──────────────────────────────────────────────────────────────────

export type { MessagePayload };

export interface FCMTokenRecord {
  readonly token: string;
  readonly createdAt: ReturnType<typeof serverTimestamp>;
  readonly userAgent: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const FCM_TOKENS_SUBCOLLECTION = 'fcmTokens';
const USERS_COLLECTION = 'users';

/**
 * VAPID key for web push. Must be set in environment variables.
 * Generate this in Firebase Console > Project Settings > Cloud Messaging > Web Push certificates.
 */
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY ?? '';

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Checks whether Firebase Cloud Messaging is supported in the current browser.
 * Returns false in environments without service worker support (e.g., Safari
 * without proper configuration, SSR, or non-browser contexts).
 */
async function isMessagingSupported(): Promise<boolean> {
  try {
    return await isSupported();
  } catch {
    return false;
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Requests browser notification permission and retrieves an FCM token.
 *
 * This function:
 * 1. Checks if messaging is supported in the current environment
 * 2. Requests the Notification permission from the browser
 * 3. Retrieves an FCM registration token using the configured VAPID key
 *
 * @returns The FCM token string if successful, or null if permission was
 *          denied, messaging is unsupported, or an error occurred.
 */
export async function requestNotificationPermission(): Promise<string | null> {
  const supported = await isMessagingSupported();
  if (!supported) {
    console.warn(
      'Firebase Messaging is not supported in this browser. ' +
      'Push notifications require a browser with service worker support.'
    );
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.info('Notification permission was not granted by the user.');
      return null;
    }

    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });

    if (!token) {
      console.warn(
        'FCM returned an empty token. This may indicate a missing or invalid VAPID key, ' +
        'or the service worker is not registered.'
      );
      return null;
    }

    return token;
  } catch (error) {
    console.error('Failed to request notification permission or retrieve FCM token:', error);
    return null;
  }
}

/**
 * Saves an FCM token to the user's fcmTokens subcollection in Firestore.
 *
 * Tokens are stored at `users/{userId}/fcmTokens/{token}` using the token
 * itself as the document ID. This makes lookup and deduplication efficient
 * and allows a single user to have multiple device tokens.
 *
 * @param userId - The authenticated user's UID.
 * @param token - The FCM registration token to persist.
 */
export async function saveFCMToken(userId: string, token: string): Promise<void> {
  if (!userId || !token) {
    throw new Error('Both userId and token are required to save an FCM token.');
  }

  const tokenRef = doc(db, USERS_COLLECTION, userId, FCM_TOKENS_SUBCOLLECTION, token);

  const record: FCMTokenRecord = {
    token,
    createdAt: serverTimestamp(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
  };

  await setDoc(tokenRef, record);
}

/**
 * Removes an FCM token from the user's fcmTokens subcollection.
 *
 * Call this on logout or when a token is no longer valid to prevent
 * stale tokens from accumulating.
 *
 * @param userId - The authenticated user's UID.
 * @param token - The FCM registration token to remove.
 */
export async function removeFCMToken(userId: string, token: string): Promise<void> {
  if (!userId || !token) {
    throw new Error('Both userId and token are required to remove an FCM token.');
  }

  const tokenRef = doc(db, USERS_COLLECTION, userId, FCM_TOKENS_SUBCOLLECTION, token);
  await deleteDoc(tokenRef);
}

/**
 * Registers a callback for foreground FCM messages.
 *
 * When the app is in the foreground (visible to the user), incoming push
 * messages are delivered to this listener instead of the browser's native
 * notification tray. Use this to show in-app toast notifications.
 *
 * Returns an unsubscribe function. If messaging is not supported, returns
 * a no-op unsubscribe function.
 *
 * @param callback - Invoked with the message payload when a foreground message arrives.
 * @returns An unsubscribe function to stop listening.
 */
export function onForegroundMessage(
  callback: (payload: MessagePayload) => void
): Unsubscribe {
  // We cannot await isSupported() in a synchronous return, so we set up
  // a deferred listener pattern.
  let unsubscribeFn: Unsubscribe = () => {};

  isMessagingSupported().then((supported) => {
    if (!supported) {
      console.warn('Firebase Messaging is not supported. Foreground message listener not registered.');
      return;
    }

    try {
      const messaging = getMessaging(app);
      unsubscribeFn = onMessage(messaging, (payload) => {
        callback(payload);
      });
    } catch (error) {
      console.error('Failed to register foreground message listener:', error);
    }
  });

  return () => {
    unsubscribeFn();
  };
}
