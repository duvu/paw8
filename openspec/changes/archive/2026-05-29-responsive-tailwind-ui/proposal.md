## Why

The current web portal uses ad-hoc inline Tailwind utility classes without a shared design system, has no mobile-responsive layout, and lacks accessible, polished UI components. This creates an inconsistent user experience and makes it hard to extend or maintain the UI.

## What Changes

- Establish a Tailwind CSS v4 design system with a consistent color palette, spacing scale, typography, and component tokens defined in `globals.css`.
- Replace ad-hoc layout with a fully responsive shell: collapsible sidebar on desktop, bottom-tab navigation on mobile, responsive grid dashboards.
- Build a shared component library (`components/ui/`) covering button, input, select, badge, card, table, modal/dialog, spinner/skeleton, empty-state, and alert — all responsive and accessible.
- Rebuild every page using the shared component library and make it fully responsive across mobile, tablet, and desktop breakpoints.
- Add `clsx` and `tailwind-merge` utilities for safe class composition.
- All components and pages must support the existing i18n setup and respect the current auth/role model.

## Capabilities

### New Capabilities

- `design-system`: Tailwind v4 design tokens, color palette, typography scale, spacing, and CSS custom properties in `globals.css`.
- `ui-component-library`: Shared reusable UI primitives in `components/ui/` — Button, Input, Select, Badge, Card, Table, Modal, Spinner, Skeleton, EmptyState, Alert.
- `responsive-layout`: Fully responsive app shell with sidebar (desktop) / bottom-nav (mobile), responsive dashboard grids, and mobile-first page layouts.
- `responsive-pages`: Each dashboard page rebuilt for mobile, tablet, and desktop breakpoints using the component library.

### Modified Capabilities

- None.

## Impact

- Affects all files in `apps/web/app/` and `apps/web/components/`.
- Adds `clsx`, `tailwind-merge` dependencies to `apps/web`.
- No backend changes, no database changes, no Flutter changes.
- Localization keys already exist; only structural UI changes in TSX files.
- Existing auth context, API layer, and route structure remain intact.
