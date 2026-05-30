## Context

The paw8 web portal (`apps/web/`) runs Next.js 16 with Tailwind CSS v4 already installed. Current screens use inline utility classes without shared design tokens or a component library. Layouts are desktop-only; no mobile breakpoints exist. The existing auth context, API layer, i18n (next-intl, 3 locales), and routing structure are correct and must not change.

## Goals / Non-Goals

**Goals:**
- Define a coherent Tailwind v4 design system (tokens, palette, typography) in `globals.css`.
- Build a shared `components/ui/` library covering Button, Input, Select, Badge, Card, Table, Modal, Spinner, Skeleton, EmptyState, Alert.
- Implement a fully responsive app shell: collapsible sidebar on desktop (≥1024px), bottom-tab navigation on mobile (<1024px).
- Rebuild every dashboard page to work correctly on mobile (320px+), tablet (640px+), and desktop (1024px+).
- Use `clsx` + `tailwind-merge` via a `cn()` utility for safe class composition.
- Maintain all existing functionality: auth guard, role-based nav, i18n, API calls, error/loading states.

**Non-Goals:**
- Backend changes, database schema changes, Flutter mobile changes.
- Adding new pages or backend-driven features.
- Animation library integration (Framer Motion / motion/react) beyond CSS transitions.
- Dark mode toggle (design system is light-only for now).
- shadcn/ui CLI integration (hand-rolling a minimal component library instead, matching the stack).

## Decisions

- **D1: Tailwind v4 `@theme` block in `globals.css`** — define all custom CSS properties (`--color-primary-*`, `--color-neutral-*`, `--radius-*`, `--font-*`) inside a `@theme` block so Tailwind 4 utilities resolve them automatically.

- **D2: `cn()` utility via `clsx` + `tailwind-merge`** — avoids Tailwind class conflicts; install both packages in `apps/web`.

- **D3: Components in `components/ui/` are hand-rolled primitives** — no external UI framework to keep the bundle small. Each component exports a single named export with a `className` prop for composition.

- **D4: Responsive shell strategy** — desktop uses a fixed `264px` left sidebar; mobile/tablet collapses it to a bottom tab bar using `hidden lg:flex` / `flex lg:hidden`. The main content shifts with `lg:pl-66` on large screens. No JavaScript hamburger toggle needed for the main nav.

- **D5: Responsive grid** — dashboard metric tiles use `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`; data tables use horizontal scroll on small screens with `overflow-x-auto`.

- **D6: Color palette** — primary is indigo (`#4f46e5` as `--color-primary-600`); neutral is slate. Alert/status colors: red (error), amber (warning), emerald (success), sky (info).

- **D7: Page rebuild order** — Landing → Login → Dashboard shell → Dashboard page → Customers → Assets → Contracts → Reports → Audit Logs → Users → Stores → Transactions.

## Risks / Trade-offs

- Hand-rolled components require more test surface than a proven library; mitigated by keeping components minimal.
- Mobile bottom nav shows only 4–5 primary destinations; less-used pages (Users, Stores, Audit) are accessible via a "More" menu or the desktop sidebar only.
- Tailwind v4 `@theme` syntax differs from v3 `extend`; already in use in the project so no migration risk.

## Migration Plan

1. Install `clsx`, `tailwind-merge`.
2. Add design tokens to `globals.css` `@theme` block.
3. Create `lib/cn.ts` utility.
4. Build component library files in `components/ui/`.
5. Rebuild app shell (`app/layout.tsx`, `app/(dashboard)/layout.tsx`).
6. Rebuild pages in order.
7. Run `pnpm build` to verify zero TypeScript/build errors.
