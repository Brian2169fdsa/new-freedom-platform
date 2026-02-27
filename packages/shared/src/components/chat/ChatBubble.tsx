import React from 'react';
import { cn } from '../../utils/cn';

interface ChatBubbleProps {
  message: string;
  isUser: boolean;
  timestamp?: string;
  avatar?: React.ReactNode;
}

export function ChatBubble({ message, isUser, timestamp, avatar }: ChatBubbleProps) {
  return (
    <div className={cn('flex gap-2 mb-4', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {avatar && <div className="flex-shrink-0 mt-1">{avatar}</div>}
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm',
          isUser
            ? 'bg-blue-700 text-white rounded-br-md'
            : 'bg-slate-100 text-slate-800 rounded-bl-md'
        )}
      >
        <p className="whitespace-pre-wrap">{message}</p>
        {timestamp && (
          <p className={cn('text-[10px] mt-1', isUser ? 'text-blue-200' : 'text-slate-400')}>
            {timestamp}
          </p>
        )}
      </div>
    </div>
  );
}
