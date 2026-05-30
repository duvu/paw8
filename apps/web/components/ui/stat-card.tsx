import * as React from 'react';
import { cn } from '@/lib/cn';
import { Skeleton } from './skeleton';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number;
  icon?: React.ReactNode;
  loading?: boolean;
  variant?: 'default' | 'warning' | 'danger';
}

const variantBorder: Record<string, string> = {
  default: '',
  warning: 'border-l-4 border-l-warning-400',
  danger: 'border-l-4 border-l-destructive-400',
};

export function StatCard({ title, value, subtitle, change, icon, loading = false, variant = 'default' }: StatCardProps) {
  if (loading) {
    return (
      <div className={cn('bg-white rounded-xl border border-neutral-200 shadow-[var(--shadow-card)] p-5', variantBorder[variant])}>
        <Skeleton className="h-3 w-24 mb-3" />
        <Skeleton className="h-7 w-20 mb-2" />
        <Skeleton className="h-3 w-16" />
      </div>
    );
  }

  return (
    <div className={cn('bg-white rounded-xl border border-neutral-200 shadow-[var(--shadow-card)] p-5 relative', variantBorder[variant])}>
      {icon && (
        <div className="absolute top-4 right-4 text-neutral-300">
          {icon}
        </div>
      )}
      <p className="text-sm text-neutral-500 font-medium">{title}</p>
      <p className="mt-1 text-2xl font-bold text-[var(--color-currency)]">{value}</p>
      <div className="mt-1 flex items-center gap-2">
        {change !== undefined && (
          <span className={cn('text-xs font-medium', change >= 0 ? 'text-success-600' : 'text-destructive-600')}>
            {change >= 0 ? '▲' : '▼'} {Math.abs(change)}%
          </span>
        )}
        {subtitle && <span className="text-xs text-neutral-400">{subtitle}</span>}
      </div>
    </div>
  );
}
