## Why

An audit of the current codebase (post-`tailwind-design-system`, 8 changes fully complete) revealed three categories of remaining work before MVP1 can be considered production-ready:

1. **TypeScript type errors in the web app** — three TS2322 errors in platform-admin pages caused by (a) passing a JSX `Element` where `PageHeader.subtitle` expects `string`, and (b) using `variant="outline"` on `<Button>` and `<Badge>` components whose variant union does not include `"outline"`. These block a clean `tsc --noEmit` build.

2. **`asset-marketplace` change not implemented** — The full marketplace module (DB tables, NestJS backend, frontend authenticated + public pages) is spec-complete (proposal, design, tasks all written) but zero tasks have been executed. This is a planned MVP1 feature for liquidating overdue assets.

3. **`plugin-architecture` change is empty** — The directory exists under `openspec/changes/` but contains no artifacts (no proposal, no tasks). This needs either proper scoping and proposal generation, or explicit deferral to post-MVP1.

## What Changes

### Fix TypeScript errors (web app)

- `apps/web/app/(platform-admin)/platform/tenants/[id]/page.tsx` line 154: `PageHeader.subtitle` prop is typed as `string` but receives a `<span>` element — either widen the `PageHeader` prop type to `React.ReactNode`, or flatten to a plain string.
- `apps/web/app/(platform-admin)/platform/tenants/onboard/page.tsx` line 258: `<Button variant="outline">` — add `'outline'` to `ButtonVariant` union in `components/ui/button.tsx` (matches the existing Tailwind class logic).
- `apps/web/app/(platform-admin)/platform/tenants/page.tsx` line 78: same `"outline"` ButtonVariant issue.
- `apps/web/app/(platform-admin)/platform/tenants/page.tsx` line 145: `<Badge variant="outline">` — add `'outline'` to `BadgeVariant` union in `components/ui/badge.tsx`.

### Implement asset-marketplace (link existing change)

All specification artifacts already exist at `openspec/changes/asset-marketplace/`. The 8-group task list (DB migration, NestJS module, integrations, file/photo, frontend auth pages, frontend public pages, validation, testing) is ready for execution via `/opsx-apply asset-marketplace`.

### Resolve plugin-architecture

The `openspec/changes/plugin-architecture/` directory is empty. Decide:
- **Option A (Defer)**: Add a `proposal.md` explicitly marking this as post-MVP1 and archive the stub.
- **Option B (Scope and propose)**: Define MVP1-appropriate plugin scope (e.g., webhook outbound events, configurable interest calculators) and generate proposal + tasks.

Given MVP1 focus on core pawn operations, **Option A (defer)** is recommended.

## Capabilities

### New Capabilities

- `button-outline-variant`: `<Button variant="outline">` renders correctly without TS errors
- `badge-outline-variant`: `<Badge variant="outline">` renders correctly without TS errors  
- `pageheader-reactnode-subtitle`: `PageHeader.subtitle` accepts `React.ReactNode` (widened from `string`)

### Modified Capabilities

- `asset-marketplace` module (all capabilities defined in `openspec/changes/asset-marketplace/proposal.md`)

## Impact

- **Web build**: `tsc --noEmit` goes from 3 errors to 0 errors after the TS fixes.
- **No backend changes** for the TS fix group — pure frontend type corrections.
- **asset-marketplace**: Adds `marketplace_listings` and `buyer_inquiries` tables; new `/marketplace/` and `/marketplace/public/` route groups; no changes to existing modules beyond adding `liquidation_sale` to the transaction type enum.
- **plugin-architecture deferral**: No code change; adds a `proposal.md` stub with deferral rationale to keep the change directory from appearing abandoned.

## Non-goals

- This change does NOT fix the pre-existing `supertest` TS errors in `apps/api-gateway/test/` files — those are test infrastructure issues unrelated to production code.
- This change does NOT implement `plugin-architecture` features; it only resolves the empty stub.
