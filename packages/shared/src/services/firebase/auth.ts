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

const googleProvider = new GoogleAuthProvider();

export const signUpWithEmail = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password);

export const signInWithEmail = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

export const signOut = () => firebaseSignOut(auth);

export const onAuthChanged = (callback: (user: FirebaseUser | null) => void) =>
  onAuthStateChanged(auth, callback);

export const updateUserProfile = (displayName?: string, photoURL?: string) => {
  if (!auth.currentUser) return Promise.resolve();
  return updateProfile(auth.currentUser, { displayName: displayName ?? undefined, photoURL: photoURL ?? undefined });
};

export { type FirebaseUser };
