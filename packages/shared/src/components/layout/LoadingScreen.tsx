import React from 'react';

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-amber-200 border-t-amber-700" />
        <p className="mt-4 text-stone-500 text-sm">Loading...</p>
      </div>
    </div>
  );
}
