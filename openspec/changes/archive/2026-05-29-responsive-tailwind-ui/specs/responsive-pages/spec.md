## ADDED Requirements

### Requirement: Responsive Dashboard page
The dashboard overview page SHALL use a `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` grid for metric tiles. Each tile SHALL use the `Card` component. Page title and date range pill SHALL sit in a row on desktop and stack on mobile.

#### Scenario: Metric tiles reflow on mobile
- **WHEN** viewport is 375px wide
- **THEN** metric tiles render in 2 columns without text overflow or clipping

### Requirement: Responsive Customers page
The customers list page SHALL use a responsive search/filter bar that stacks on mobile and displays inline on desktop. The customers table SHALL be wrapped in `overflow-x-auto`. The "New Customer" CTA button SHALL be visible on all breakpoints.

#### Scenario: Table scrolls on small screens
- **WHEN** viewport is 375px wide
- **THEN** the customers table can be horizontally scrolled to see all columns

### Requirement: Responsive Assets page
The assets list and asset creation pages SHALL be fully usable on mobile. Filters (type, status) SHALL use a compact stacked layout on small screens.

#### Scenario: Asset filter controls stack on mobile
- **WHEN** viewport is 375px wide
- **THEN** type and status filter selects appear stacked vertically, not cut off

### Requirement: Responsive Contracts page
Contract list, new contract wizard, and contract detail pages SHALL be fully responsive. Status filter tabs SHALL wrap or scroll horizontally on small screens. The new contract 3-step wizard SHALL work on mobile with appropriate form layout.

#### Scenario: Contract status tabs scroll horizontally on mobile
- **WHEN** viewport is 375px wide
- **THEN** status filter tabs can be horizontally scrolled to reach all options

### Requirement: Responsive Reports page
The reports page SHALL render role-gated tabs that scroll horizontally on small screens. The date range filter SHALL stack on mobile. Report tables SHALL be wrapped in `overflow-x-auto`.

#### Scenario: Report table visible on mobile
- **WHEN** viewport is 375px wide
- **THEN** report table columns can be scrolled horizontally

### Requirement: Responsive Audit Logs page
The audit logs table SHALL be wrapped in `overflow-x-auto`. The filter bar SHALL stack on mobile.

### Requirement: Responsive Users and Stores pages
Users list, new user form, stores list SHALL be responsive with stacked form fields on mobile.

### Requirement: Transactions unavailable page
The transactions placeholder page SHALL display the EmptyState component in a centered card, responsive on all breakpoints.

### Requirement: All pages use shared UI components
Every rebuilt page SHALL use components from `components/ui/` for consistent look and feel. Raw `<div className="...">` equivalents SHALL be replaced with `Card`, `Table`, `Button`, `Input`, `Select`, `Badge`, `Alert`, `EmptyState`, `Spinner`, `Skeleton` where appropriate.

#### Scenario: Build passes after all rebuilds
- **WHEN** `pnpm build` is run in `apps/web`
- **THEN** compilation completes with zero TypeScript errors
