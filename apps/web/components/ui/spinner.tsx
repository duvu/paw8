import * as React from 'react';
import { cn } from '@/lib/cn';

export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface SpinnerProps {
  size?: SpinnerSize;
  label?: string;
  className?: string;
}

const sizes: Record<SpinnerSize, { dim: number; stroke: string }> = {
  sm: { dim: 16, stroke: '2.5' },
  md: { dim: 20, stroke: '2.5' },
  lg: { dim: 28, stroke: '2' },
};

export function Spinner({
  size = 'md',
  label,
  className,
}: SpinnerProps) {
  const { dim, stroke } = sizes[size];
  return (
    <svg
      width={dim}
      height={dim}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      className={cn('animate-spin text-primary-600', className)}
      aria-hidden={!label}
      aria-label={label}
      role={label ? 'status' : undefined}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
