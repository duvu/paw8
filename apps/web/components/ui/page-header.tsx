import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/cn';

export interface PageHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumb?: Array<{ label: string; href?: string }>;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, breadcrumb, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 pb-6 border-b border-[var(--color-border)]', className)}>
      <div className="min-w-0">
        {breadcrumb && breadcrumb.length > 0 && (
          <div className="flex items-center gap-1 mb-1 text-xs text-neutral-400">
            {breadcrumb.map((crumb, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span>/</span>}
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-neutral-600 transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span>{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
        <h1 className="text-2xl font-bold text-[var(--color-foreground)] leading-tight">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0 mt-1 sm:mt-0">
          {actions}
        </div>
      )}
    </div>
  );
}
