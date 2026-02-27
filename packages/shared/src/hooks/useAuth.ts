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
      // Build a rich demo user with data needed by all lanes
      const sobrietyDate = new Date(Date.now() - 47 * 86400000);
      const releaseDate = new Date(Date.now() - 60 * 86400000);
      const enrollmentDate = new Date(Date.now() - 55 * 86400000);
      // Create Timestamp-like objects so .toDate() works in pages
      const toTimestampLike = (d: Date) => ({ toDate: () => d, seconds: Math.floor(d.getTime() / 1000), nanoseconds: 0 });
      const demoUser = {
        uid: 'demo-user',
        email: 'demo@reprieve.app',
        displayName: 'Marcus Johnson',
        photoURL: '',
        role: 'member',
        lanes: ['lane1', 'lane2', 'lane3'],
        createdAt: toTimestampLike(enrollmentDate),
        updatedAt: toTimestampLike(new Date()),
        lastLoginAt: toTimestampLike(new Date()),
        profile: {
          firstName: 'Marcus',
          lastName: 'Johnson',
          preferredLanguage: 'en',
          city: 'Phoenix',
          state: 'AZ',
          gender: 'Male',
          bio: 'Rebuilding my life one day at a time. 47 days sober and grateful for every one.',
          sobrietyDate: toTimestampLike(sobrietyDate),
          referralSource: 'court',
        },
        reentry: {
          releaseDate: toTimestampLike(releaseDate),
          facilityName: 'Arizona State Prison Complex - Lewis',
          paroleOfficer: 'Officer Sarah Chen',
          caseManagerId: 'cm-sarah',
          enrollmentStatus: 'active',
        },
        stepExperience: {
          currentStep: 3,
          enrollmentDate: toTimestampLike(enrollmentDate),
        },
        myStruggle: {
          isMentor: false,
          mentorId: 'mentor-james',
          joinDate: toTimestampLike(enrollmentDate),
        },
        settings: {
          notifications: { push: true, email: true, sms: false },
          privacy: { profileVisible: true, showSobrietyDate: true, shareProgressWithMentor: true },
        },
      } as unknown as User;
      set({
        firebaseUser: { uid: 'demo-user', email: 'demo@reprieve.app', displayName: 'Demo User' } as unknown as FirebaseUser,
        user: demoUser,
        loading: false,
        initialized: true,
      });
    },
  };
});
