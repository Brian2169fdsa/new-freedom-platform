import * as React from 'react';
import { cn } from '../../utils/cn';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Avatar({ src, alt, fallback, size = 'md', className, ...props }: AvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-lg',
  };

  return (
    <div
      className={cn(
        'relative rounded-full overflow-hidden bg-blue-100 flex items-center justify-center',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {src ? (
        <img src={src} alt={alt || ''} className="h-full w-full object-cover" />
      ) : (
        <span className="font-medium text-blue-700">
          {fallback || alt?.charAt(0)?.toUpperCase() || '?'}
        </span>
      )}
    </div>
  );
}
