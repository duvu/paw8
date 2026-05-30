import * as React from 'react';
import { cn } from '@/lib/cn';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'destructive' | 'info' | 'outline';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-neutral-100 text-neutral-700 border-transparent',
  success: 'bg-success-50 text-success-700 border-success-100',
  warning: 'bg-warning-50 text-warning-700 border-warning-100',
  destructive: 'bg-destructive-50 text-destructive-700 border-destructive-100',
  info: 'bg-info-50 text-info-600 border-info-100',
  outline: 'bg-transparent text-neutral-600 border-neutral-200',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-px text-[10px]',
  md: 'px-2 py-0.5 text-xs',
};

export function Badge({ variant = 'default', size = 'md', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium border',
        sizeStyles[size],
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
