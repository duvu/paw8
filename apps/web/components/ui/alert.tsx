'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

export type AlertVariant = 'info' | 'success' | 'warning' | 'destructive';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children?: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

const variantStyles: Record<AlertVariant, { container: string; icon: string }> = {
  info: {
    container: 'bg-info-50 border-info-100 text-info-600',
    icon: 'text-info-500',
  },
  success: {
    container: 'bg-success-50 border-success-100 text-success-700',
    icon: 'text-success-500',
  },
  warning: {
    container: 'bg-warning-50 border-warning-100 text-warning-700',
    icon: 'text-warning-500',
  },
  destructive: {
    container: 'bg-destructive-50 border-destructive-100 text-destructive-700',
    icon: 'text-destructive-500',
  },
};

const variantIcons: Record<AlertVariant, React.ReactNode> = {
  info: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
    </svg>
  ),
  success: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  warning: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  destructive: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
};

export function Alert({
  variant = 'info',
  title,
  children,
  onDismiss,
  className,
}: AlertProps) {
  const styles = variantStyles[variant];

  return (
    <div
      role="alert"
      className={cn(
        'flex gap-3 p-4 rounded-xl border text-sm',
        styles.container,
        className,
      )}
    >
      <span className={cn('shrink-0 mt-0.5', styles.icon)}>
        {variantIcons[variant]}
      </span>
      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        {children && <div className="opacity-90">{children}</div>}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 p-0.5 rounded opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Dismiss"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
