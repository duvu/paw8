# Tasks: tailwind-design-system

## Status: ready

## Group 1: Design Tokens (globals.css)
- [x] 1.1 Read current `apps/web/app/globals.css` `@theme inline` block
- [x] 1.2 Append typography scale tokens (`--text-xs` through `--text-4xl`, `--leading-*`, `--font-*`)
- [x] 1.3 Append shadow scale tokens (`--shadow-card`, `--shadow-hover`, `--shadow-modal`, `--shadow-dropdown`)
- [x] 1.4 Append z-index scale tokens (`--z-base`, `--z-dropdown`, `--z-modal`, `--z-toast`)
- [x] 1.5 Append finance color aliases (`--color-currency`, `--color-credit`, `--color-debit`, `--color-overdue`, `--color-near-due`, `--color-settled`, `--color-draft`)
- [x] 1.6 Append layout tokens (`--content-max-w`, `--page-padding-x`, `--page-padding-y`)
- [x] 1.7 Verify no existing token renamed or removed

## Group 2: UI Component Hardening
- [x] 2.1 Read `apps/web/components/ui/button.tsx` — add `loading` + `fullWidth` props, export `ButtonProps`
- [x] 2.2 Read `apps/web/components/ui/input.tsx` — add `label`, `error`, `hint`, `required` props, export `InputProps`
- [x] 2.3 Read `apps/web/components/ui/select.tsx` — add `label`, `error`, `hint`, `required` props, export `SelectProps`
- [x] 2.4 Read `apps/web/components/ui/card.tsx` — add `padding`, `shadow` props + `CardHeader`/`CardBody`/`CardFooter`, export `CardProps`
- [x] 2.5 Read `apps/web/components/ui/badge.tsx` — confirm variants (default/success/warning/destructive/info/outline), add `sm` size, export `BadgeProps`
- [x] 2.6 Read `apps/web/components/ui/modal.tsx` — add `size`, `closeOnBackdrop` props, use `--z-modal` token, export `ModalProps`
- [x] 2.7 Read `apps/web/components/ui/table.tsx` — add `loading`, `empty` props + `hideBelow` on column def, export `TableColumn<T>` + `TableProps<T>`
- [x] 2.8 Read `apps/web/components/ui/skeleton.tsx` — add `variant`, `width`, `height` props, export `SkeletonProps`
- [x] 2.9 Read `apps/web/components/ui/alert.tsx` — add `title`, `dismissible` props, confirm variants, export `AlertProps`
- [x] 2.10 Read `apps/web/components/ui/spinner.tsx` — add `label` aria prop, export `SpinnerProps`
- [x] 2.11 Read `apps/web/components/ui/empty-state.tsx` — add `action` prop, export `EmptyStateProps`

## Group 3: Finance Components
- [x] 3.1 Create `apps/web/components/ui/stat-card.tsx` with `StatCardProps` (title, value, subtitle, change, icon, loading, variant)
- [x] 3.2 Create `apps/web/components/ui/currency-display.tsx` with `CurrencyDisplayProps` (amount, currency, locale, size, type, showSymbol)
- [x] 3.3 Create `apps/web/components/ui/status-badge.tsx` — maps ContractStatus + AssetStatus to Badge variants
- [x] 3.4 Add exports for all 3 new components to `apps/web/components/ui/index.ts`

## Group 4: PageHeader + Page Layout
- [x] 4.1 Create `apps/web/components/ui/page-header.tsx` with `PageHeaderProps` (title, subtitle, actions, breadcrumb) — mobile stacking
- [x] 4.2 Add `PageHeader` export to `apps/web/components/ui/index.ts`
- [x] 4.3 Read + update `apps/web/app/(dashboard)/dashboard/page.tsx` — PageHeader + StatCard grid + overdue/near-due section
- [x] 4.4 Read + update `apps/web/app/(dashboard)/customers/page.tsx` — PageHeader + Table structure
- [x] 4.5 Read + update `apps/web/app/(dashboard)/contracts/page.tsx` — PageHeader + StatusBadge in table
- [x] 4.6 Read + update `apps/web/app/(dashboard)/assets/page.tsx` — PageHeader + Table
- [x] 4.7 Read + update `apps/web/app/(dashboard)/transactions/page.tsx` — PageHeader + CurrencyDisplay in table
- [x] 4.8 Read + update `apps/web/app/(dashboard)/users/page.tsx` — PageHeader + Table
- [x] 4.9 Read + update `apps/web/app/(dashboard)/stores/page.tsx` — PageHeader + Table
- [x] 4.10 Read + update `apps/web/app/(dashboard)/reports/page.tsx` — PageHeader + section headers
- [x] 4.11 Read + update `apps/web/app/(dashboard)/audit-logs/page.tsx` — PageHeader + Table
- [x] 4.12 Read + update login page — centered card layout, Input with label/error, Button with loading

## Group 5: Responsive Design
- [x] 5.1 Read `apps/web/app/(dashboard)/layout.tsx` — verify sidebar `hidden lg:flex` / bottom nav `flex lg:hidden`
- [x] 5.2 Fix layout.tsx sidebar/main content to use `--sidebar-width` token (not hardcoded), `px-4 py-4 sm:px-6 sm:py-6` for main padding
- [x] 5.3 Update `table.tsx` (from 2.7) — implement `hideBelow` column prop applying `hidden {bp}:table-cell` to th/td
- [x] 5.4 Update `table.tsx` — add mobile card-list fallback (`<div className="sm:hidden space-y-3">` per row)
- [x] 5.5 Update `modal.tsx` (from 2.6) — full-screen on mobile (`items-end sm:items-center`, `w-full sm:w-auto rounded-none sm:rounded-xl`)
- [x] 5.6 Verify dashboard page stats grid uses `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`

## Group 6: Barrel + Final Wiring
- [x] 6.1 Verify `apps/web/components/ui/index.ts` exports all components (old + new)
- [x] 6.2 Run TypeScript check on `apps/web/` — fix any type errors introduced
- [x] 6.3 Verify dev server starts (`pnpm dev` or equivalent) without CSS/JS errors
