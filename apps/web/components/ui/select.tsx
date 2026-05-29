'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
  placeholder?: string;
  containerClassName?: string;
}

export function Select({
  label,
  error,
  helperText,
  options = [],
  placeholder,
  containerClassName,
  className,
  id,
  children,
  ...props
}: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label
          htmlFor={selectId}
          className="text-sm font-medium text-neutral-700"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          {...props}
          id={selectId}
          className={cn(
            'w-full h-9 rounded-lg border bg-white pl-3 pr-8 text-sm text-neutral-900',
            'appearance-none cursor-pointer',
            'transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/25 focus:border-primary-500',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-neutral-50',
            error
              ? 'border-destructive-500 focus:ring-destructive-500/25'
              : 'border-neutral-200',
            className,
          )}
        >
          {placeholder && (
            <option value="">{placeholder}</option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
          {children}
        </select>
        {/* Chevron */}
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </div>
      {error && <p className="text-xs text-destructive-600">{error}</p>}
      {!error && helperText && <p className="text-xs text-neutral-500">{helperText}</p>}
    </div>
  );
}
