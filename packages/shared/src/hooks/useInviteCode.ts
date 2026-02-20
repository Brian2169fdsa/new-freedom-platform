import { useState } from 'react';

const INVITE_CODE_KEY = 'nfp_invite_verified';

export function useInviteCode() {
  const [verified, setVerified] = useState<boolean>(() => {
    return localStorage.getItem(INVITE_CODE_KEY) === 'true';
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verify = async (code: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const { httpsCallable } = await import('firebase/functions');
      const { functions } = await import('../services/firebase/config');
      const verifyFn = httpsCallable(functions, 'verifyInviteCode');
      const result = await verifyFn({ code });
      const success = (result.data as { success: boolean }).success;
      if (success) {
        localStorage.setItem(INVITE_CODE_KEY, 'true');
        setVerified(true);
      } else {
        setError('Invalid invite code. Please try again.');
      }
      return success;
    } catch {
      setError('Unable to verify code. Please try again later.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    localStorage.removeItem(INVITE_CODE_KEY);
    setVerified(false);
  };

  return { verified, loading, error, verify, reset };
}
