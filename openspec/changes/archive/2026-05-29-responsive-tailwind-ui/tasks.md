## 1. Dependencies & Foundation

- [x] 1.1 Install `clsx` and `tailwind-merge` in `apps/web`
- [x] 1.2 Create `apps/web/lib/cn.ts` with `cn()` utility combining clsx + tailwind-merge
- [x] 1.3 Define Tailwind v4 design tokens in `apps/web/app/globals.css` `@theme` block: primary scale (indigo 50–900), neutral scale (slate 50–900), semantic vars (background, foreground, surface, border, muted, destructive, success, warning), radius vars, font vars
- [x] 1.4 Update `apps/web/app/globals.css` base layer: consistent body background, focus-visible ring using token, selection highlight, smooth transitions

## 2. UI Component Library

- [x] 2.1 Create `apps/web/components/ui/button.tsx` — variants (default, secondary, destructive, ghost, link), sizes (sm, md, lg), loading spinner, disabled state
- [x] 2.2 Create `apps/web/components/ui/input.tsx` — label, error, helperText, leftIcon, rightIcon, full input props
- [x] 2.3 Create `apps/web/components/ui/select.tsx` — label, error, options array, native select wrapper
- [x] 2.4 Create `apps/web/components/ui/badge.tsx` — variants (default, success, warning, destructive, info, outline)
- [x] 2.5 Create `apps/web/components/ui/card.tsx` — Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- [x] 2.6 Create `apps/web/components/ui/table.tsx` — Table, TableHeader, TableBody, TableRow, TableHead, TableCell with overflow-x-auto wrapper
- [x] 2.7 Create `apps/web/components/ui/modal.tsx` — open/onClose/title/children/footer, mobile bottom-sheet, desktop center
- [x] 2.8 Create `apps/web/components/ui/spinner.tsx` — sm/md/lg animated spinner
- [x] 2.9 Create `apps/web/components/ui/skeleton.tsx` — loading placeholder block with pulse animation
- [x] 2.10 Create `apps/web/components/ui/empty-state.tsx` — icon/title/description/action
- [x] 2.11 Create `apps/web/components/ui/alert.tsx` — variants (info, success, warning, destructive), dismissible
- [x] 2.12 Create `apps/web/components/ui/index.ts` barrel exporting all components

## 3. Responsive Layout Shell

- [x] 3.1 Rebuild `apps/web/app/(dashboard)/layout.tsx`: fixed 264px sidebar on lg+, bottom tab bar on <lg, `lg:pl-66 pb-16 lg:pb-0` on main content
- [x] 3.2 Implement bottom navigation component with 5 destinations: Dashboard, Customers, Contracts, Reports, More — active state, icons
- [x] 3.3 Implement "More" drawer/menu for Users, Stores, Audit Logs on mobile
- [x] 3.4 Rebuild sidebar with role-gated nav items using design tokens and `cn()`, compact account section at bottom
- [x] 3.5 Ensure auth guard, role-based nav hide/show, logout, and i18n all work correctly in rebuilt shell

## 4. Landing & Auth Pages

- [x] 4.1 Rebuild `apps/web/app/page.tsx` using Card/Button from `components/ui/`, responsive two-column desktop / single-column mobile hero
- [x] 4.2 Rebuild `apps/web/app/login/page.tsx` using Card/Input/Button from `components/ui/`, centered card max-w-md, session-expiry Alert, error Alert
- [x] 4.3 Update `apps/web/app/layout.tsx` root metadata if needed; ensure fonts + tokens load correctly

## 5. Dashboard Page

- [x] 5.1 Rebuild `apps/web/app/(dashboard)/dashboard/page.tsx` using Card/Skeleton/Spinner, responsive `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` metric grid, EmptyState on error/invalid

## 6. Customers Pages

- [x] 6.1 Rebuild `apps/web/app/(dashboard)/customers/page.tsx` — Input search bar, Table with overflow-x-auto, Button "New", Skeleton loading, EmptyState
- [x] 6.2 Rebuild `apps/web/app/(dashboard)/customers/new/page.tsx` — stacked form fields using Input/Select/Button, responsive layout
- [x] 6.3 Rebuild `apps/web/app/(dashboard)/customers/[id]/page.tsx` — Card sections for details/documents/contracts, responsive

## 7. Assets Pages

- [x] 7.1 Rebuild `apps/web/app/(dashboard)/assets/page.tsx` — stacked mobile filter bar (Select type/status), Table with overflow-x-auto, Button "New", EmptyState
- [x] 7.2 Rebuild `apps/web/app/(dashboard)/assets/new/page.tsx` — stacked form fields using Input/Select/Button

## 8. Contracts Pages

- [x] 8.1 Rebuild `apps/web/app/(dashboard)/contracts/page.tsx` — horizontally scrollable status tab pills, Table, EmptyState
- [x] 8.2 Rebuild `apps/web/app/(dashboard)/contracts/new/page.tsx` — 3-step wizard with step indicator, responsive form layout
- [x] 8.3 Rebuild `apps/web/app/(dashboard)/contracts/[id]/page.tsx` — Card sections for contract info/assets/transactions, action buttons, responsive

## 9. Reports & Audit Pages

- [x] 9.1 Rebuild `apps/web/app/(dashboard)/reports/page.tsx` — scrollable tab pills, stacked date filter on mobile, Table with overflow-x-auto, role-gated tabs, EmptyState
- [x] 9.2 Rebuild `apps/web/app/(dashboard)/audit-logs/page.tsx` — Table with overflow-x-auto, stacked filter, EmptyState, Badge for action types

## 10. Users, Stores & Transactions Pages

- [x] 10.1 Rebuild `apps/web/app/(dashboard)/users/page.tsx` — Table, Button "New", Badge for roles
- [x] 10.2 Rebuild `apps/web/app/(dashboard)/users/new/page.tsx` — responsive stacked form
- [x] 10.3 Rebuild `apps/web/app/(dashboard)/stores/page.tsx` — Table, Button/Badge
- [x] 10.4 Rebuild `apps/web/app/(dashboard)/transactions/page.tsx` — EmptyState using `components/ui/empty-state`, Button back to Contracts

## 11. Verification

- [x] 11.1 Run `pnpm build` in `apps/web` — zero TypeScript/compilation errors
- [x] 11.2 Run `pnpm i18n:check` from root — zero missing locale keys
- [x] 11.3 Spot-check responsive layouts at 375px, 768px, 1280px using browser DevTools
- [x] 11.4 Verify login flow, auth guard, logout, role-nav, and report/audit routes still work end-to-end
