'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  containerClassName,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-neutral-700"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <span className="absolute left-3 text-neutral-400 pointer-events-none">
            {leftIcon}
          </span>
        )}
        <input
          {...props}
          id={inputId}
          className={cn(
            'w-full h-9 rounded-lg border bg-white px-3 text-sm text-neutral-900',
            'placeholder:text-neutral-400',
            'transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/25 focus:border-primary-500',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-neutral-50',
            leftIcon && 'pl-9',
            rightIcon && 'pr-9',
            error
              ? 'border-destructive-500 focus:ring-destructive-500/25 focus:border-destructive-500'
              : 'border-neutral-200',
            className,
          )}
        />
        {rightIcon && (
          <span className="absolute right-3 text-neutral-400 pointer-events-none">
            {rightIcon}
          </span>
        )}
      </div>
      {error && (
        <p className="text-xs text-destructive-600">{error}</p>
      )}
      {!error && helperText && (
        <p className="text-xs text-neutral-500">{helperText}</p>
      )}
    </div>
  );
}
