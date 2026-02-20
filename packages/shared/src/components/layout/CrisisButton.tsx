import React, { useState } from 'react';
import { Phone, X, MessageSquare } from 'lucide-react';
import { CRISIS_HOTLINE } from '../../utils/constants';

export function CrisisButton() {
  const [expanded, setExpanded] = useState(false);

  if (expanded) {
    return (
      <div className="fixed bottom-20 md:bottom-4 right-4 z-50 bg-white rounded-xl shadow-lg border border-stone-200 p-4 w-72">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-stone-800">Need help now?</h3>
          <button onClick={() => setExpanded(false)} className="text-stone-400 hover:text-stone-600">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-stone-500 mb-3">
          If you or someone you know is in crisis, help is available 24/7.
        </p>
        <div className="space-y-2">
          <a
            href={`tel:${CRISIS_HOTLINE.phone}`}
            className="flex items-center gap-2 w-full px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100"
          >
            <Phone className="h-4 w-4" />
            Call {CRISIS_HOTLINE.phone}
          </a>
          <a
            href={`sms:741741&body=HOME`}
            className="flex items-center gap-2 w-full px-3 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-100"
          >
            <MessageSquare className="h-4 w-4" />
            {CRISIS_HOTLINE.text}
          </a>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setExpanded(true)}
      className="fixed bottom-20 md:bottom-4 right-4 z-50 bg-red-600 text-white rounded-full px-4 py-2 text-xs font-medium shadow-lg hover:bg-red-700 flex items-center gap-1.5"
    >
      <Phone className="h-3 w-3" />
      Need help?
    </button>
  );
}
