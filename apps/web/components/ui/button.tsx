'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'default' | 'secondary' | 'destructive' | 'ghost' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  default:
    'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-sm',
  secondary:
    'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50 active:bg-neutral-100 shadow-sm',
  destructive:
    'bg-destructive-600 text-white hover:bg-destructive-700 active:bg-destructive-800 shadow-sm',
  ghost:
    'text-neutral-600 hover:bg-neutral-100 active:bg-neutral-200',
  link:
    'text-primary-600 underline-offset-4 hover:underline p-0 h-auto',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm rounded-md gap-1.5',
  md: 'h-9 px-4 text-sm rounded-lg gap-2',
  lg: 'h-11 px-6 text-base rounded-xl gap-2',
};

export function Button({
  variant = 'default',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  leftIcon,
  rightIcon,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center font-medium whitespace-nowrap',
        'transition-all duration-150 cursor-pointer select-none',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        variant !== 'link' && sizeStyles[size],
        variantStyles[variant],
        className,
      )}
    >
      {loading ? (
        <svg
          className="animate-spin shrink-0"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      ) : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
}
