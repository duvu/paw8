import * as React from 'react';
import { cn } from '@/lib/cn';

type PaddingSize = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps {
  className?: string;
  children: React.ReactNode;
  padding?: PaddingSize;
  shadow?: boolean;
}

const paddingMap: Record<PaddingSize, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
};

export function Card({ className, children, padding, shadow = true }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-neutral-200',
        shadow && 'shadow-sm',
        padding && paddingMap[padding],
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('flex flex-col gap-1 p-5 pb-3', className)}>
      {children}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('px-5 pb-5', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <h3 className={cn('text-base font-semibold text-neutral-900 leading-tight', className)}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <p className={cn('text-sm text-neutral-500 leading-relaxed', className)}>
      {children}
    </p>
  );
}

export function CardContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('px-5 pb-5', className)}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children }: { className?: string; children: React.ReactNode }) {
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
