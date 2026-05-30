import * as React from 'react';
import { cn } from '@/lib/cn';

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

export function Card({ className, children }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-neutral-200 shadow-sm',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: CardProps) {
  return (
    <div className={cn('flex flex-col gap-1 p-5 pb-3', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children }: CardProps) {
  return (
    <h3 className={cn('text-base font-semibold text-neutral-900 leading-tight', className)}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children }: CardProps) {
  return (
    <p className={cn('text-sm text-neutral-500 leading-relaxed', className)}>
      {children}
    </p>
  );
}

export function CardContent({ className, children }: CardProps) {
  return (
    <div className={cn('px-5 pb-5', className)}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children }: CardProps) {
  return (
    <div
      className={cn(
        'flex items-center px-5 py-3 border-t border-neutral-100 bg-neutral-50/50 rounded-b-xl',
        className,
      )}
    >
      {children}
    </div>
  );
}
