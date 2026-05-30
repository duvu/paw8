## Context

The project uses Next.js App Router with Tailwind v4 already installed and configured. A basic `@theme` block in `globals.css` defines a color palette and a handful of CSS custom properties. Eleven primitive UI components exist in `components/ui/`. The dashboard layout shell (sidebar + mobile bottom nav) is implemented, but individual pages are visually inconsistent — some use `Card`, others render raw divs, table components lack sorting/filtering, and no shared page-header or form-field pattern exists.

The target audience is pawn shop operators — finance professionals who need dense information, quick status assessment, and accurate number formatting. The design must feel trustworthy, professional, and scannable rather than flashy.

## Goals / Non-Goals

**Goals:**
- Complete the Tailwind v4 `@theme` block with typography scale, shadow scale, z-index scale, and semantic finance aliases
- Harden all 11 `components/ui/` primitives with full variant/size/state coverage
- Add finance-specific components: `StatCard`, `DataTable`, `StatusBadge`, `CurrencyDisplay`, `ContractTimeline`, `PageHeader`, `FormField`
- Apply consistent layout patterns (page-header + content area) to all 9 dashboard routes
- Ensure all pages render correctly from 320px (mobile) to 1440px+ (desktop) with no content overflow
- Keep zero new npm dependencies (Tailwind v4 + tailwind-merge already present)

**Non-Goals:**
- Dark mode (not requested; adds significant scope)
- Animation library integration (CSS transitions via Tailwind suffice)
- Replacing the existing `components/ui/` component API contracts (only internals/styling change)
- i18n changes to currency format (already using `Intl.NumberFormat` per-locale)
- Storybook / component docs

## Decisions

### D1: Tailwind v4 `@theme` inline — extend, not replace
The existing `@theme inline { ... }` block already establishes a color palette and semantic aliases. We will **append** to it, adding:
- Typography: `--text-xs` through `--text-4xl` with matching `--leading-*` (line-height) values — enables `text-xs` etc. as design token references
- Shadows: `--shadow-card`, `--shadow-card-hover`, `--shadow-modal`, `--shadow-dropdown` — replaces ad-hoc inline shadows
- Z-index: `--z-base`, `--z-dropdown`, `--z-modal`, `--z-toast` — prevents z-fighting
- Finance aliases: `--color-currency`, `--color-credit`, `--color-debit`, `--color-overdue`, `--color-near-due` — semantic names tied to business concepts

**Alternative considered**: Create a separate `design-tokens.css` file. Rejected — Tailwind v4's `@theme` is the single source for utility class generation; splitting it creates maintenance confusion.

### D2: Component primitives stay class-based (no CVA)
All `components/ui/` components currently use plain `Record<Variant, string>` objects for variant styles. We will continue this pattern for consistency and simplicity.

**Alternative considered**: Introduce `class-variance-authority` (CVA). Rejected — adds a dependency, CVA adds complexity that isn't justified for ~11 components without strict type-safety requirements on the variant API.

### D3: Finance components go in `components/ui/` not `components/features/`
`StatCard`, `CurrencyDisplay`, `StatusBadge` are domain-aware in name but have no business logic (no API calls, no auth, no tenant scope). They are presentation primitives.

**Alternative considered**: Put in `components/features/<domain>/`. Rejected — they are reused across multiple feature domains (dashboard, reports, contracts). Feature folders are for domain-specific compositions, not cross-domain UI atoms.

### D4: DataTable built as a wrapper, not a full headless table
The `DataTable` component wraps an HTML `<table>` with: column definitions (header + accessor fn + optional formatter), client-side sort on visible data, and a mobile card-list fallback triggered via CSS (`table-auto hidden sm:table`). No server-side pagination in the component — pages pass data as props; pagination is a page concern.

**Alternative considered**: TanStack Table. Rejected — zero new deps constraint; the use cases are simple enough.

### D5: Page layout pattern — `<PageHeader>` + content div
Every dashboard route page will follow:
```
<PageHeader title="..." subtitle="..." actions={<Button>...</Button>} />
<div className="space-y-6">
  {/* content */}
</div>
```
`PageHeader` renders `<div className="mb-6 flex items-center justify-between gap-4 flex-wrap">`.

**Alternative considered**: Each page manages its own header markup. Rejected — produces visual drift across pages (varying spacing, font sizes, button alignment).

### D6: Responsive table strategy — CSS-driven card fallback
On screens `< sm` (640px), `DataTable` hides the `<table>` and renders a card-list. The card-list is pre-rendered server-side as sibling markup; CSS `hidden`/`sm:block` toggles visibility. No JS resize listener needed.

## Risks / Trade-offs

- [Risk] Refactoring all 9 pages risks introducing regressions in page behavior → Mitigation: pages are purely presentational with API calls; structural changes only touch layout wrappers, not logic
- [Risk] Tailwind v4 `@theme` is still evolving (recently released) → Mitigation: stick to documented `@theme inline` syntax only; avoid experimental features
- [Risk] `DataTable` mobile card fallback duplicates markup → Mitigation: both views share the same `data[]` prop; no logic duplication, only template duplication (acceptable)

## Migration Plan

1. Extend `globals.css` `@theme` block (additive, no breakage)
2. Refactor `components/ui/` primitives in-place (same exports, internal styling only)
3. Add new components to `components/ui/` (new exports, no existing code touched)
4. Update pages one by one, starting with Dashboard then alphabetical
5. No rollback needed — all changes are in `apps/web/` frontend only; backend is untouched

## Open Questions

- None — scope is self-contained frontend styling.
