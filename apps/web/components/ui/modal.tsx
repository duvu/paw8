'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, footer, className }: ModalProps) {
  // Lock body scroll when open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        className={cn(
          'relative z-10 w-full bg-white shadow-xl',
          'rounded-t-2xl sm:rounded-2xl',
          'max-h-[90dvh] overflow-y-auto',
          'sm:max-w-lg sm:mx-4',
          className,
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
            <h2 id="modal-title" className="text-base font-semibold text-neutral-900">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
              aria-label="Close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        {/* Content */}
        <div className="p-5">{children}</div>
        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-neutral-100 bg-neutral-50/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
