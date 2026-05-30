# Spec: Page Layouts

## Capability
`page-layouts`

## Overview
Create a `PageHeader` component and apply a consistent page layout pattern to all 9 dashboard route pages and the login page. Layout changes only — no business logic touched.

## PageHeader Component

### File
`apps/web/components/ui/page-header.tsx`

### Interface
```tsx
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;     // right-aligned CTA slot (buttons, etc.)
  breadcrumb?: Array<{ label: string; href?: string }>;
}
```

### Visual Spec
```
┌─────────────────────────────────────────────────────────┐
│  [breadcrumb if present]                                 │
│  Title text                              [actions slot]  │
│  subtitle text (optional)                               │
└─────────────────────────────────────────────────────────┘
```
- Container: `flex items-start justify-between gap-4 pb-6 border-b border-[var(--color-border)]`
- Title: `text-[var(--text-2xl)] font-bold text-[var(--color-foreground)]`
- Subtitle: `text-[var(--text-sm)] text-neutral-500 mt-1`
- Breadcrumb: small `text-xs text-neutral-400` line above title with `/` separator; last item not linked
- Actions: `flex items-center gap-2 shrink-0`
- Export `PageHeaderProps`

## Standard Page Layout Pattern

Every dashboard page (`app/(dashboard)/*/page.tsx`) must follow:

```tsx
export default function XxxPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Page Title"
        subtitle="Optional description"
        actions={<Button>Primary Action</Button>}
      />
      {/* page content */}
    </div>
  );
}
```

The outer `<div className="space-y-6">` is the only layout wrapper needed — padding is handled by `(dashboard)/layout.tsx`.

## Pages to Update

### 1. `app/(dashboard)/dashboard/page.tsx`
- `<PageHeader title="Dashboard" subtitle="Tổng quan hoạt động" />`
- Arrange existing stats in a `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4` using `StatCard`
- Overdue/near-due lists in a `grid grid-cols-1 lg:grid-cols-2 gap-6` below stats

### 2. `app/(dashboard)/customers/page.tsx`
- `<PageHeader title="Khách hàng" actions={<Button>Thêm khách hàng</Button>} />`
- Search/filter bar below header
- `<Table>` with customer list

### 3. `app/(dashboard)/contracts/page.tsx`
- `<PageHeader title="Hợp đồng" actions={<Button>Tạo hợp đồng</Button>} />`
- Filter tabs (All / Active / Near Due / Overdue / Settled)
- `<Table>` with `<StatusBadge>` in status column

### 4. `app/(dashboard)/assets/page.tsx`
- `<PageHeader title="Tài sản" actions={<Button>Thêm tài sản</Button>} />`
- `<Table>` with asset list, status badge

### 5. `app/(dashboard)/transactions/page.tsx`
- `<PageHeader title="Giao dịch" />`
- `<Table>` with `<CurrencyDisplay>` in amount column, `type='credit'|'debit'` based on transaction type

### 6. `app/(dashboard)/users/page.tsx`
- `<PageHeader title="Người dùng" actions={<Button>Thêm người dùng</Button>} />`

### 7. `app/(dashboard)/stores/page.tsx`
- `<PageHeader title="Cửa hàng" actions={<Button>Thêm cửa hàng</Button>} />`

### 8. `app/(dashboard)/reports/page.tsx`
- `<PageHeader title="Báo cáo" subtitle="Thống kê và phân tích" />`
- Section headers for each report type using `<h2 className="text-[var(--text-lg)] font-semibold">`

### 9. `app/(dashboard)/audit-logs/page.tsx`
- `<PageHeader title="Audit Logs" subtitle="Lịch sử thao tác hệ thống" />`

## Login Page Polish
File: `apps/web/app/(auth)/login/page.tsx` (or wherever login lives)
- Centered card layout: `min-h-screen flex items-center justify-center bg-[var(--color-background)]`
- Card: `w-full max-w-md p-8 bg-[var(--color-surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-modal)]`
- App name/logo at top
- Use `Input` component with `label` + `error` props
- Submit button uses `loading` prop during submission

## Acceptance Criteria
1. `PageHeader` component exists at `apps/web/components/ui/page-header.tsx` and is exported from `index.ts`
2. All 9 dashboard pages use `<PageHeader>` as their first child inside `<div className="space-y-6">`
3. Dashboard page uses `StatCard` for KPI metrics
4. Contracts page has `<StatusBadge>` in status column
5. Transactions page has `<CurrencyDisplay>` in amount column
6. Login page follows centered card layout
7. No layout regressions — pages render without runtime errors
