import { useAuth } from './useAuth';
import { useDocument } from './useFirestore';
import type { User } from '../types';

export function useUser() {
  const { firebaseUser, user, loading: authLoading } = useAuth();
  return {
    uid: firebaseUser?.uid ?? null,
    user,
    loading: authLoading,
    isAuthenticated: !!firebaseUser,
    role: user?.role ?? null,
    lanes: user?.lanes ?? [],
  };
}

export function useUserById(userId: string | null | undefined) {
  const { data, loading, error } = useDocument<User>('users', userId);
  return { user: data, loading, error };
}
