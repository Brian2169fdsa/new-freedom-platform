import * as React from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline';
}

export function Badge({ variant = 'default', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        {
          'bg-amber-100 text-amber-800': variant === 'default',
          'bg-stone-100 text-stone-700': variant === 'secondary',
          'bg-green-100 text-green-800': variant === 'success',
          'bg-orange-100 text-orange-800': variant === 'warning',
          'bg-red-100 text-red-800': variant === 'destructive',
          'border border-stone-300 text-stone-700': variant === 'outline',
        },
        className
      )}
      {...props}
    />
  );
}
