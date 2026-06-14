## Why

The `tailwind-design-system` change hardened UI component variant unions to strict string literals but did not update the platform-admin pages that reference variants (`"outline"`) not yet in the union, and left `PageHeader.subtitle` typed as `string` while pages pass JSX elements. This results in 3 TypeScript errors that block a clean `tsc --noEmit` build. Additionally, the `openspec/changes/plugin-architecture/` directory is an empty stub with no artifacts — it appears as an open, unresolved change when it should be explicitly deferred to post-MVP1.

## What Changes

- Add `'outline'` to `ButtonVariant` union in `apps/web/components/ui/button.tsx` with corresponding Tailwind styles (`bg-transparent text-neutral-700 border border-neutral-200 hover:bg-neutral-50`)
- Widen `PageHeader.subtitle` prop type from `string` to `React.ReactNode` in `apps/web/components/ui/page-header.tsx`
- Create `openspec/changes/plugin-architecture/proposal.md` with explicit post-MVP1 deferral rationale
- Move `openspec/changes/plugin-architecture/` to `openspec/changes/archive/plugin-architecture/`

## Capabilities

### New Capabilities

- `button-outline-variant`: `<Button variant="outline">` renders a bordered, transparent-background button with full type safety

### Modified Capabilities

- `page-header-component`: `subtitle` prop widens from `string` to `React.ReactNode` — same runtime behavior, broader accepted types

## Impact

- **`apps/web` TypeScript build**: goes from 3 errors to 0 after these changes
- **No backend changes** — purely frontend type and style fixes
- **No behavior regression** — `PageHeader` already renders subtitle inside a `<p>` tag that accepts any React content; widening the type matches actual usage
- **No spec-level behavior change** for page-header (just a prop type correction) — delta spec required to document the widening
- **`openspec/changes/`**: `plugin-architecture` moves out of active changes, reducing noise
