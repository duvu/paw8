## ADDED Requirements

### Requirement: Button component
`components/ui/button.tsx` SHALL export a `Button` component with variants (`default`, `secondary`, `destructive`, `ghost`, `link`) and sizes (`sm`, `md`, `lg`). It SHALL accept `className`, `disabled`, `loading`, and all standard HTML button props. While `loading` is true, the button SHALL render a spinner and be non-interactive.

#### Scenario: Disabled state is non-interactive
- **WHEN** `disabled` or `loading` prop is true
- **THEN** the button is visually muted and pointer events are disabled

#### Scenario: Variant renders correct colors
- **WHEN** variant is `destructive`
- **THEN** button renders with `bg-red-600` or equivalent destructive design token

### Requirement: Input component
`components/ui/input.tsx` SHALL export an `Input` component wrapping `<input>` with support for `label`, `error`, `helperText`, `leftIcon`, `rightIcon`, and full HTML input props. Error state SHALL show a red border and display `error` text below the field.

#### Scenario: Error state visible
- **WHEN** `error` prop is a non-empty string
- **THEN** input border turns destructive color and `error` text renders below the field

### Requirement: Select component
`components/ui/select.tsx` SHALL export a `Select` component wrapping `<select>` with support for `label`, `error`, `options` array prop, and native select semantics.

#### Scenario: Options render correctly
- **WHEN** `options=[{value:'a', label:'A'}]` prop is passed
- **THEN** a native `<option>` with `value="a"` and text "A" is rendered

### Requirement: Badge component
`components/ui/badge.tsx` SHALL export a `Badge` component with variants `default`, `success`, `warning`, `destructive`, `info`, `outline`. Used for contract statuses, user roles, and asset states.

#### Scenario: Badge maps variant to color
- **WHEN** variant is `success`
- **THEN** badge renders with emerald/green background and appropriate text color

### Requirement: Card component
`components/ui/card.tsx` SHALL export `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` composable components. Card SHALL have a subtle border, background, and rounded corners using design tokens.

#### Scenario: Card renders as a contained surface
- **WHEN** `<Card>` is rendered
- **THEN** it has a visible surface background, border, and rounded corners distinguishable from the page background

### Requirement: Table component
`components/ui/table.tsx` SHALL export `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` components that wrap native `<table>` elements. The wrapping container SHALL be `overflow-x-auto` for horizontal scroll on small screens.

#### Scenario: Table scrolls horizontally on small screens
- **WHEN** table content is wider than the viewport at 320px
- **THEN** horizontal scrollbar appears and table columns do not wrap or overflow the page

### Requirement: Modal / Dialog component
`components/ui/modal.tsx` SHALL export a `Modal` component accepting `open`, `onClose`, `title`, `children`, and optional `footer` props. It SHALL render a centered overlay on all screen sizes. On mobile, it SHALL slide up from the bottom. On desktop, it SHALL center in the viewport.

#### Scenario: Modal closes on backdrop click
- **WHEN** user clicks outside the modal content area
- **THEN** `onClose` callback is invoked

### Requirement: Spinner and Skeleton components
`components/ui/spinner.tsx` SHALL export a `Spinner` with `sm`, `md`, `lg` sizes. `components/ui/skeleton.tsx` SHALL export a `Skeleton` block for loading placeholder rows/cells.

#### Scenario: Skeleton replaces content while loading
- **WHEN** page data is loading
- **THEN** `Skeleton` components occupy the same spatial footprint as the eventual content

### Requirement: EmptyState component
`components/ui/empty-state.tsx` SHALL export an `EmptyState` component accepting `icon`, `title`, `description`, and optional `action` (render prop or ReactNode).

#### Scenario: Empty state renders actionable CTA
- **WHEN** list has zero items and `action` prop is provided
- **THEN** the CTA is visible and operable

### Requirement: Alert component
`components/ui/alert.tsx` SHALL export an `Alert` component with variants `info`, `success`, `warning`, `destructive`. Accepts `title`, `children`, and `onDismiss`.

#### Scenario: Destructive alert is visually distinct
- **WHEN** `variant="destructive"` is set
- **THEN** alert renders with red-toned background and border

### Requirement: Component index barrel
`components/ui/index.ts` SHALL re-export all components so consumers can `import { Button, Card } from '@/components/ui'`.
