import * as React from 'react';
import { cn } from '@/lib/cn';

export interface CurrencyDisplayProps {
  amount: number;
  currency?: string;
  locale?: string;
  size?: 'sm' | 'md' | 'lg';
  type?: 'neutral' | 'credit' | 'debit';
  showSymbol?: boolean;
  className?: string;
}

const sizeStyles = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl font-semibold',
};

const typeStyles = {
  neutral: 'text-[var(--color-currency)]',
  credit: 'text-[var(--color-credit)]',
  debit: 'text-[var(--color-debit)]',
};

export function CurrencyDisplay({
  amount,
  currency = 'VND',
  locale = 'vi-VN',
  size = 'md',
  type = 'neutral',
  showSymbol = true,
  className,
}: CurrencyDisplayProps) {
  const formatted = new Intl.NumberFormat(locale, {
    style: showSymbol ? 'currency' : 'decimal',
    currency,
    maximumFractionDigits: currency === 'VND' ? 0 : 2,
  }).format(amount);

  return (
    <span className={cn(sizeStyles[size], typeStyles[type], className)}>
      {formatted}
    </span>
  );
}
