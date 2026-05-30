# Spec: Finance Components

## Capability
`finance-components`

## Overview
Create three new reusable components in `apps/web/components/ui/` that are specific to pawn/finance domain UX. These are cross-domain primitives (used by multiple feature pages), hence they live in `ui/` not in `features/<domain>/`.

## New Components

### 1. StatCard (`stat-card.tsx`)

Displays a single KPI metric with label, value, optional change indicator, and optional icon.

```tsx
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;          // e.g. "vs last month"
  change?: number;            // +/- percentage. Positive = green, negative = red
  icon?: ReactNode;           // icon slot top-right
  loading?: boolean;          // skeleton state
  variant?: 'default' | 'warning' | 'danger';  // border accent color
}
```

Visual spec:
- White card, `shadow-[var(--shadow-card)]`, `rounded-[var(--radius-lg)]`
- `title` in `text-[var(--text-sm)] text-neutral-500 font-medium`
- `value` in `text-[var(--text-2xl)] font-bold text-[var(--color-currency)]`
- `change` rendered as `▲ +X%` in green or `▼ X%` in red
- `variant='warning'` adds left border `border-l-4 border-warning-400`
- `variant='danger'` adds left border `border-l-4 border-destructive-400`
- When `loading=true`: render skeleton lines matching layout

### 2. CurrencyDisplay (`currency-display.tsx`)

Renders a monetary amount with locale formatting.

```tsx
interface CurrencyDisplayProps {
  amount: number;
  currency?: string;          // default: 'VND'
  locale?: string;            // default: 'vi-VN'
  size?: 'sm' | 'md' | 'lg'; // controls text size
  type?: 'neutral' | 'credit' | 'debit';  // color semantic
  showSymbol?: boolean;       // default: true
  className?: string;
}
```

Visual spec:
- Use `Intl.NumberFormat(locale, { style: 'currency', currency })` for formatting
- `type='neutral'` → `text-[var(--color-currency)]`
- `type='credit'` → `text-[var(--color-credit)]`
- `type='debit'` → `text-[var(--color-debit)]`
- Sizes: `sm`→`text-sm`, `md`→`text-base`, `lg`→`text-xl font-semibold`
- VND: omit decimal places

### 3. StatusBadge (`status-badge.tsx`)

Maps domain status strings to styled badges. Wraps `Badge` component.

```tsx
type ContractStatus =
  | 'draft' | 'active' | 'near_due' | 'overdue' | 'extended'
  | 'settled' | 'cancelled' | 'liquidation_pending' | 'liquidated';

type AssetStatus =
  | 'holding' | 'redeemed' | 'overdue' | 'pending_liquidation' | 'liquidated';

interface StatusBadgeProps {
  status: ContractStatus | AssetStatus | string;
  domain?: 'contract' | 'asset';   // optional hint for disambiguation
}
```

Status → Badge variant mapping:
- `active` / `redeemed` / `settled` → `success`
- `near_due` / `extended` → `warning`
- `overdue` / `liquidation_pending` / `pending_liquidation` → `destructive`
- `draft` / `cancelled` → `outline`
- `liquidated` → `default`
- Unknown → `default`

Display label: title-cased, underscores replaced with spaces (e.g. `near_due` → "Near Due")

## File Location
`apps/web/components/ui/stat-card.tsx`
`apps/web/components/ui/currency-display.tsx`
`apps/web/components/ui/status-badge.tsx`

## Barrel Export
Add to `apps/web/components/ui/index.ts`:
```ts
export * from './stat-card';
export * from './currency-display';
export * from './status-badge';
```

## Acceptance Criteria
1. All three components exist at specified paths and are exported from `index.ts`
2. `StatCard` renders skeleton when `loading={true}`
3. `CurrencyDisplay` uses `Intl.NumberFormat` — no manual formatting
4. `StatusBadge` maps all listed statuses correctly to badge variants
5. `StatusBadge` handles unknown status gracefully (default variant, raw value as label)
6. No new npm dependencies
7. All props are optional except those explicitly marked required
