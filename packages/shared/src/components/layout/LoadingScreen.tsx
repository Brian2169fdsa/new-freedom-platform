import React from 'react';

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-700" />
        <p className="mt-4 text-slate-500 text-sm">Loading...</p>
      </div>
    </div>
  );
}
