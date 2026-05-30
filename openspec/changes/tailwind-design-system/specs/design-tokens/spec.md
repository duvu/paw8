# Spec: Design Tokens

## Capability
`design-tokens`

## Overview
Extend the existing `@theme inline` block in `apps/web/app/globals.css` with a complete token set covering typography, shadows, z-index, and finance-domain color aliases. No tokens are removed or renamed — only additions.

## Current State
`apps/web/app/globals.css` already defines:
- Color palette: `--color-primary-*` (indigo), `--color-neutral-*` (slate), `--color-success-*` (emerald), `--color-warning-*` (amber), `--color-destructive-*` (red), `--color-info-*` (sky)
- Semantic aliases: `--color-background`, `--color-foreground`, `--color-surface`, `--color-border`, `--color-muted`
- Radius scale: `--radius-sm` through `--radius-full`
- Font families: `--font-sans`, `--font-mono`
- Layout: `--sidebar-width`

## Required Additions

### Typography Scale
```css
--text-xs: 0.75rem;
--text-sm: 0.875rem;
--text-base: 1rem;
--text-lg: 1.125rem;
--text-xl: 1.25rem;
--text-2xl: 1.5rem;
--text-3xl: 1.875rem;
--text-4xl: 2.25rem;
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Shadow Scale
```css
--shadow-card: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
--shadow-hover: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-modal: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
--shadow-dropdown: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
```

### Z-Index Scale
```css
--z-base: 0;
--z-dropdown: 1000;
--z-modal: 1300;
--z-toast: 1500;
```

### Finance Domain Color Aliases
```css
--color-currency: var(--color-neutral-900);        /* money amounts — near-black */
--color-credit: var(--color-success-600);           /* incoming cash — green */
--color-debit: var(--color-destructive-600);        /* outgoing cash — red */
--color-overdue: var(--color-destructive-600);      /* overdue contracts */
--color-near-due: var(--color-warning-500);         /* contracts due within 3 days */
--color-settled: var(--color-success-700);          /* settled/completed */
--color-draft: var(--color-neutral-400);            /* draft state */
```

### Spacing / Layout Extras
```css
--content-max-w: 1280px;
--page-padding-x: 1.5rem;   /* 24px */
--page-padding-y: 1.5rem;
```

## Acceptance Criteria
1. All tokens listed above are present inside the `@theme inline { }` block in `globals.css`
2. No existing token is renamed or removed
3. Finance color aliases reference existing palette variables via `var(--color-*)` — no hardcoded hex values
4. `apps/web` dev server starts without CSS errors after the change
