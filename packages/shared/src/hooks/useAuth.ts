import { create } from 'zustand';
import { onAuthChanged, signOut, type FirebaseUser } from '../services/firebase/auth';
import { getDocument } from '../services/firebase/firestore';
import type { User } from '../types';

interface AuthState {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
  initialized: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => {
  // Listen to auth state changes
  onAuthChanged(async (firebaseUser) => {
    if (firebaseUser) {
      const userData = await getDocument<User>('users', firebaseUser.uid);
      set({ firebaseUser, user: userData, loading: false, initialized: true });
    } else {
      set({ firebaseUser: null, user: null, loading: false, initialized: true });
    }
  });

  return {
    firebaseUser: null,
    user: null,
    loading: true,
    initialized: false,
    signOut: async () => {
      await signOut();
      set({ firebaseUser: null, user: null });
    },
    refreshUser: async () => {
      const { firebaseUser } = get();
      if (firebaseUser) {
        const userData = await getDocument<User>('users', firebaseUser.uid);
        set({ user: userData });
      }
    },
  };
});
