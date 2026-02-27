import { create } from 'zustand';
import { onAuthChanged, signOut, type FirebaseUser } from '../services/firebase/auth';
import { getDocument } from '../services/firebase/firestore';
import type { User } from '../types';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

interface AuthState {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
  initialized: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  loginDemo: () => void;
}

export const useAuth = create<AuthState>((set, get) => {
  // Only listen to Firebase auth changes in non-demo mode
  if (!DEMO_MODE) {
    onAuthChanged(async (firebaseUser) => {
      if (firebaseUser) {
        let userData: User | null = null;
        try {
          userData = await getDocument<User>('users', firebaseUser.uid);
        } catch {
          // Firestore rules may not be deployed yet — continue with null user doc
          console.warn('Could not fetch user document — using Firebase Auth data only');
        }

        // If no Firestore doc, create a minimal user object from Firebase Auth
        if (!userData) {
          userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            photoURL: firebaseUser.photoURL || '',
            role: 'member',
            lanes: ['lane1', 'lane2', 'lane3'],
            profile: {
              firstName: firebaseUser.displayName?.split(' ')[0] || '',
              lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
              preferredLanguage: 'en',
            },
            settings: {
              notifications: { push: true, email: true, sms: false },
              privacy: { profileVisible: true, showSobrietyDate: false, shareProgressWithMentor: true },
            },
          } as User;
        }

        set({ firebaseUser, user: userData, loading: false, initialized: true });
      } else {
        set({ firebaseUser: null, user: null, loading: false, initialized: true });
      }
    });
  }

  return {
    firebaseUser: null,
    user: null,
    loading: DEMO_MODE ? false : true,
    initialized: DEMO_MODE,
    signOut: async () => {
      if (!DEMO_MODE) await signOut();
      set({ firebaseUser: null, user: null });
    },
    refreshUser: async () => {
      if (DEMO_MODE) return;
      const { firebaseUser } = get();
      if (firebaseUser) {
        try {
          const userData = await getDocument<User>('users', firebaseUser.uid);
          if (userData) set({ user: userData });
        } catch {
          // Keep existing user data if refresh fails
        }
      }
    },
    loginDemo: () => {
      const demoUser = {
        uid: 'demo-user',
        email: 'demo@reprieve.app',
        displayName: 'Demo User',
        photoURL: '',
        role: 'member',
        lanes: ['lane1', 'lane2', 'lane3'],
        profile: {
          firstName: 'Demo',
          lastName: 'User',
          preferredLanguage: 'en',
        },
        settings: {
          notifications: { push: true, email: true, sms: false },
          privacy: { profileVisible: true, showSobrietyDate: false, shareProgressWithMentor: true },
        },
      } as User;
      set({
        firebaseUser: { uid: 'demo-user', email: 'demo@reprieve.app', displayName: 'Demo User' } as unknown as FirebaseUser,
        user: demoUser,
        loading: false,
        initialized: true,
      });
    },
  };
});
