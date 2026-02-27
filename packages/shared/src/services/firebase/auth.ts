import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from './config';
import { createDocument, getDocument } from './firestore';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

const googleProvider = new GoogleAuthProvider();

const DEFAULT_USER_DATA = (uid: string, email: string, displayName: string, photoURL?: string) => {
  const firstName = displayName?.split(' ')[0] || '';
  const lastName = displayName?.split(' ').slice(1).join(' ') || '';
  return {
    uid,
    email,
    displayName,
    photoURL: photoURL || '',
    role: 'member',
    lanes: ['lane1', 'lane2', 'lane3'],
    profile: {
      firstName,
      lastName,
      preferredLanguage: 'en',
    },
    settings: {
      notifications: { push: true, email: true, sms: false },
      privacy: { profileVisible: true, showSobrietyDate: false, shareProgressWithMentor: true },
    },
  };
};

export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName?: string
) => {
  if (DEMO_MODE) throw new Error('Sign-up is disabled in demo mode');
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  // Set displayName on Firebase Auth profile
  if (displayName) {
    await updateProfile(cred.user, { displayName });
  }

  // Create Firestore user document (graceful failure if rules not yet deployed)
  try {
    await createDocument('users', cred.user.uid, DEFAULT_USER_DATA(cred.user.uid, email, displayName || ''));
  } catch (err) {
    console.warn('Could not create user document — Firestore rules may not be deployed yet:', err);
  }

  return cred;
};

export const signInWithEmail = (email: string, password: string) => {
  if (DEMO_MODE) throw new Error('Sign-in is disabled in demo mode');
  return signInWithEmailAndPassword(auth, email, password);
};

export const signInWithGoogle = async () => {
  if (DEMO_MODE) throw new Error('Google sign-in is disabled in demo mode');
  const cred = await signInWithPopup(auth, googleProvider);

  // Create Firestore user doc if it doesn't exist (first Google sign-in)
  try {
    const existing = await getDocument('users', cred.user.uid);
    if (!existing) {
      await createDocument('users', cred.user.uid, DEFAULT_USER_DATA(
        cred.user.uid,
        cred.user.email || '',
        cred.user.displayName || '',
        cred.user.photoURL || ''
      ));
    }
  } catch (err) {
    console.warn('Could not create user document — Firestore rules may not be deployed yet:', err);
  }

  return cred;
};

export const signOut = () => firebaseSignOut(auth);

export const onAuthChanged = (callback: (user: FirebaseUser | null) => void) =>
  onAuthStateChanged(auth, callback);

export const updateUserProfile = (displayName?: string, photoURL?: string) => {
  if (!auth.currentUser) return Promise.resolve();
  return updateProfile(auth.currentUser, { displayName: displayName ?? undefined, photoURL: photoURL ?? undefined });
};

export { type FirebaseUser };
