import React, { useState } from 'react';
import { useInviteCode } from '../../hooks/useInviteCode';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';

interface InviteGateProps {
  children: React.ReactNode;
}

export function InviteGate({ children }: InviteGateProps) {
  const { verified, loading, error, verify } = useInviteCode();
  const [code, setCode] = useState('');

  if (verified) return <>{children}</>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) await verify(code.trim());
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-stone-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
            <span className="text-2xl">🌱</span>
          </div>
          <CardTitle className="text-2xl">Welcome to New Freedom</CardTitle>
          <CardDescription>
            Enter your invite code to get started on your journey.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Enter invite code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="text-center text-lg tracking-wider"
              autoFocus
            />
            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading || !code.trim()}>
              {loading ? 'Verifying...' : 'Continue'}
            </Button>
          </form>
          <p className="text-xs text-stone-400 text-center mt-4">
            Don't have a code? Contact your case manager or program coordinator.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
