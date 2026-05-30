## Why

The project already has Tailwind v4 installed with basic design tokens and primitive UI components, but the pages and components lack visual polish, consistent patterns, and the dense-but-clear information hierarchy expected from a professional finance SaaS. Pages use ad-hoc inline classes, components are missing variants and states, and there is no shared typography scale, spacing rhythm, or component composition system to ensure consistency end-to-end.

## What Changes

- **Design token completion**: Extend `globals.css` `@theme` block with typography scale, shadow scale, spacing aliases, and z-index scale
- **UI component system hardening**: Refactor all `components/ui/` primitives to be variant-complete, accessible, and composable (Button, Card, Badge, Table, Input, Select, Modal, Alert, Skeleton, Spinner, EmptyState)
- **Page-level layout polish**: Apply consistent page-header pattern, section spacing, and content-width constraints across all 9 dashboard routes
- **Finance-specific component set**: Add components tuned for finance data — `StatCard`, `DataTable` (sortable, filterable), `StatusBadge`, `CurrencyDisplay`, `ContractTimeline`
- **Form system**: Unified form layout with label+input+error pattern, field groups, and inline validation styles
- **Responsive audit**: Audit all pages for mobile breakpoints (320px–1280px+); ensure tables degrade to card-list on mobile
- **Dark sidebar polish**: Improve sidebar visual weight, active state, hover state, and section grouping

## Capabilities

### New Capabilities

- `design-tokens`: Complete `@theme` extension — typography scale (`--text-*`), shadow scale (`--shadow-*`), z-index scale (`--z-*`), and finance-specific semantic color aliases
- `ui-component-system`: Refactored and hardened `components/ui/` primitives — all variants, sizes, loading/disabled states, and accessibility attributes
- `finance-components`: New domain-aware components — `StatCard`, `DataTable`, `StatusBadge`, `CurrencyDisplay`, `ContractTimeline`, `PageHeader`, `FormField`
- `page-layouts`: Consistent layout shells — dashboard grid, list-page pattern, detail-page pattern applied to all 9 routes
- `responsive-design`: Mobile-first responsive audit for all pages; table → card-list fallback pattern

### Modified Capabilities

<!-- none: no existing spec-level behavior changes -->

## Impact

- `apps/web/app/globals.css` — extended `@theme` block
- `apps/web/components/ui/` — all existing component files refactored
- `apps/web/components/features/` — new finance-specific components added per domain
- `apps/web/app/(dashboard)/*/page.tsx` — all 9 route pages updated for consistent layout patterns
- `apps/web/app/(dashboard)/layout.tsx` — sidebar + shell polish
- `apps/web/app/login/page.tsx` — login page responsive polish
- No backend changes
- No new npm dependencies (Tailwind v4 + tailwind-merge already present)
