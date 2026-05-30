# Spec: UI Component System

## Capability
`ui-component-system`

## Overview
Harden all existing `components/ui/` components to use design tokens consistently, add missing props, and ensure each component is fully typed. No new npm dependencies. No CVA — keep class-based variant `Record<Variant, string>` pattern already established in `button.tsx`.

## Components to Update

### button.tsx
- Already has variant + size system — no structural change
- Ensure all class strings reference `--color-primary-*` tokens via Tailwind utilities (e.g. `bg-primary-600` not hardcoded hex)
- Add `loading?: boolean` prop: shows `<Spinner size="sm" />` inline, disables button
- Add `fullWidth?: boolean` prop: applies `w-full`
- Export `ButtonProps` type

### input.tsx
- Add `label?: string` prop rendered as `<label>` above input
- Add `error?: string` prop rendered as red hint text below input
- Add `hint?: string` prop rendered as muted hint text below input (hidden when `error` is set)
- Add `required?: boolean` — adds asterisk to label
- Use `--color-destructive-*` for error state border/text
- Export `InputProps` type

### select.tsx
- Same `label`, `error`, `hint`, `required` additions as input.tsx
- Export `SelectProps` type

### card.tsx
- Add `padding?: 'none' | 'sm' | 'md' | 'lg'` prop (default: `'md'`)
- Add `shadow?: boolean` prop (default: true) — applies `shadow-[var(--shadow-card)]`
- Add `CardHeader`, `CardBody`, `CardFooter` named exports (simple div wrappers with border/spacing)
- Export `CardProps` type

### badge.tsx
- Variants: `default | success | warning | destructive | info | outline`
- Sizes: `sm | md`
- Map variants to finance semantics: success=settled, warning=near-due, destructive=overdue
- Export `BadgeProps` type

### modal.tsx
- Add `size?: 'sm' | 'md' | 'lg' | 'xl'` prop controlling max-width
- Use `--z-modal` token for z-index
- Add `closeOnBackdrop?: boolean` prop (default: true)
- Export `ModalProps` type

### table.tsx
- Confirm it accepts typed `columns` + `data` props
- Add `loading?: boolean` — shows skeleton rows (3 rows × column count)
- Add `empty?: ReactNode` — renders when data is empty
- Export `TableColumn<T>` and `TableProps<T>` types

### skeleton.tsx
- Add `variant?: 'text' | 'rect' | 'circle'` prop
- Add `width?: string | number`, `height?: string | number` props
- Export `SkeletonProps` type

### alert.tsx
- Variants: `info | success | warning | error`
- Add `title?: string` prop rendered as bold line above description
- Add `dismissible?: boolean` prop — shows × button, hides on click
- Export `AlertProps` type

### spinner.tsx
- Sizes: `sm | md | lg`
- Add `label?: string` for screen reader `aria-label`
- Export `SpinnerProps` type

### empty-state.tsx
- Add `action?: ReactNode` prop for CTA button slot
- Export `EmptyStateProps` type

## File Location
All files: `apps/web/components/ui/`

## Acceptance Criteria
1. Each component exports its `*Props` type
2. No component uses hardcoded color hex values — all use Tailwind utility classes
3. `loading` prop on `button.tsx` renders `<Spinner size="sm" />` and sets `disabled`
4. `label`, `error`, `hint` pattern consistent across `input.tsx` and `select.tsx`
5. `table.tsx` renders skeleton rows when `loading={true}`
6. No new npm dependencies added
7. All existing usage of components continues to work (backward compatible — all new props optional)
