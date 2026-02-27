import React from 'react';
import { Heart } from 'lucide-react';
import { cn } from '../../utils/cn';

interface LikeButtonProps {
  liked: boolean;
  count: number;
  onToggle: () => void;
}

export function LikeButton({ liked, count, onToggle }: LikeButtonProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'flex items-center gap-1 text-sm transition-colors',
        liked ? 'text-red-500' : 'text-slate-400 hover:text-red-500'
      )}
    >
      <Heart className="h-4 w-4" fill={liked ? 'currentColor' : 'none'} />
      {count > 0 && <span>{count}</span>}
    </button>
  );
}
