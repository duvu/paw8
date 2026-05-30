# Spec: Responsive Design

## Capability
`responsive-design`

## Overview
Audit and fix responsive behavior for the dashboard layout, data tables, and key pages. Strategy: CSS-driven breakpoint toggles only — no JavaScript resize listeners, no TanStack Table. Mobile-first.

## Breakpoints (Tailwind defaults)
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

## 1. Sidebar Layout (`app/(dashboard)/layout.tsx`)

### Desktop (lg+)
- Fixed left sidebar `w-[var(--sidebar-width)]` (e.g. 256px)
- Main content `ml-[var(--sidebar-width)]`
- Mobile bottom nav hidden

### Mobile (<lg)
- Sidebar hidden (`hidden lg:flex`)
- Main content full width (`ml-0`)
- Bottom nav visible (`flex lg:hidden`) — max 5 items, icons + short labels

### Current sidebar-width token
`--sidebar-width` already defined in globals.css. Verify it's used as `w-[var(--sidebar-width)]` not hardcoded.

## 2. Table Responsive Strategy (`table.tsx`)

**Pattern: CSS visibility toggle**

For `<table>` on mobile, secondary columns hide using `hidden sm:table-cell` (or `hidden md:table-cell`) on `<th>` and `<td>`.

Each `TableColumn<T>` gets an optional `hideBelow?: 'sm' | 'md' | 'lg'` property:

```tsx
interface TableColumn<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  hideBelow?: 'sm' | 'md' | 'lg';   // NEW
  width?: string;
}
```

Column rendering:
```tsx
<th className={col.hideBelow ? `hidden ${col.hideBelow}:table-cell` : ''}>
```

**Mobile fallback: card list**
When screen < sm (or when `mobileView='cards'` prop on Table):
- Table `hidden sm:table`
- Below table: `<div className="sm:hidden space-y-3">` renders each row as a card
- Card shows: primary column bold + 2-3 key fields stacked
- This is CSS toggle only — same DOM, different visibility

## 3. Grid Layouts

### Stats grid (dashboard)
```
grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
```

### Report/content sections
```
grid-cols-1 lg:grid-cols-2
```

### Form layouts
- Single column on mobile
- Two columns (`grid grid-cols-1 md:grid-cols-2 gap-4`) on md+

## 4. Page Padding

Use the layout padding tokens consistently:
- `(dashboard)/layout.tsx` main content: `p-[var(--page-padding-y)_var(--page-padding-x)]` or `px-6 py-6`
- On mobile: reduce to `px-4 py-4`
- Pattern: `px-4 py-4 sm:px-6 sm:py-6`

## 5. PageHeader Responsive Behavior

- On mobile (<sm): stack title and actions vertically (`flex-col` → `sm:flex-row`)
- Actions below title on mobile: `mt-3 sm:mt-0`

```tsx
<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
```

## 6. Modal Sizing

- On mobile: modal takes `w-full h-full rounded-none` (full-screen sheet)
- On sm+: max-width from `size` prop, centered

```tsx
const mobileClass = 'sm:w-auto sm:h-auto sm:rounded-[var(--radius-xl)]';
const containerClass = `fixed inset-0 flex items-end sm:items-center justify-center`;
// modal panel: w-full sm:max-w-{size}
```

## Acceptance Criteria
1. Sidebar uses `hidden lg:flex` / `flex lg:hidden` — no JS toggling required for basic desktop/mobile split
2. `TableColumn` accepts `hideBelow` prop; `table.tsx` applies correct responsive class to `<th>` / `<td>`
3. Table has mobile card fallback controlled by CSS (hidden sm:block / sm:hidden)
4. Dashboard stats grid is `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
5. PageHeader stacks on mobile (`flex-col sm:flex-row`)
6. Modal renders full-screen on mobile, centered dialog on sm+
7. Main content area padding is `px-4 py-4 sm:px-6 sm:py-6`
8. No JavaScript resize listeners added
