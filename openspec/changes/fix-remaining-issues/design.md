## Context

Post `tailwind-design-system` change, the web app has 3 TypeScript errors caused by a mismatch between how platform-admin pages use UI components and the component type definitions. The `Button` component's `ButtonVariant` union does not include `'outline'` even though the component's visual design clearly intended it (the `Badge` component already has `'outline'` in its variant union with full Tailwind styles). The `PageHeader` component types `subtitle` as `string` but the tenant detail page passes a `<span>` element for styled display. There is also a dangling `openspec/changes/plugin-architecture/` stub directory that creates noise in the active changes list.

## Goals / Non-Goals

**Goals:**
- Zero TypeScript errors from `npx tsc --noEmit` in `apps/web`
- `<Button variant="outline">` compiles and renders correctly
- `PageHeader` accepts both plain strings and JSX nodes as `subtitle`
- `plugin-architecture` stub is visibly resolved (archived with deferral explanation)

**Non-Goals:**
- Does NOT fix pre-existing `supertest` TS errors in `apps/api-gateway/test/` — those require a test-dependency upgrade unrelated to production code
- Does NOT implement any plugin/webhook features
- Does NOT add other Button variants not currently used in the codebase
- Does NOT refactor or redesign the UI components beyond the minimal type/style additions

## Decisions

**Decision 1: Add `'outline'` to `ButtonVariant` and `variantStyles` — not a className override**

The `variantStyles` object is typed as `Record<ButtonVariant, string>` (exhaustive record). Adding to the union forces TypeScript to require an entry in `variantStyles`, making it impossible to add a variant without styles. Using `className` overrides instead would work at runtime but bypass the type safety the system was designed for.

*Alternative rejected*: Removing the `Record<ButtonVariant, string>` exhaustive check and using a `Partial<Record>` — rejected because exhaustive records are the correct pattern here; they catch missing styles at compile time.

**Outline button styles**: `bg-transparent text-neutral-700 border border-neutral-200 hover:bg-neutral-50 active:bg-neutral-100 shadow-sm` — consistent with the `secondary` variant's border/shadow language but transparent background signals "secondary action, less weight."

**Decision 2: Widen `PageHeader.subtitle` to `React.ReactNode`**

The `PageHeader` already renders `subtitle` inside a `<p>` tag which accepts any React content. Widening the prop type to `React.ReactNode` is the semantically correct fix — it matches how the component already works at runtime. The alternative (flattening to a plain string in the calling page) would lose the mono-font / neutral-color styling applied via the `<span>` wrapper.

**Decision 3: Archive `plugin-architecture` with a deferral proposal.md**

Adding an explicit `proposal.md` file before archiving gives future contributors a clear record of *why* the directory exists and where it belongs in the roadmap, rather than appearing as an abandoned artifact.

## Risks / Trade-offs

- **`React.ReactNode` subtitle widening** → If any external code calls `PageHeader` and passes `subtitle` expecting it to be serializable as a plain string (e.g., server-side title extraction), the widening creates a silent type compatibility shift. *Mitigation*: No such usage exists in this codebase; all `PageHeader` usages are in client components.
- **Button `outline` variant** → Minor visual inconsistency risk if the outline style diverges from the Badge `outline` style. *Mitigation*: Both use the same neutral-200 border + transparent background pattern.

## Migration Plan

1. Edit `apps/web/components/ui/button.tsx` — add `'outline'` to union + add entry to `variantStyles`
2. Edit `apps/web/components/ui/page-header.tsx` — change `subtitle?: string` to `subtitle?: React.ReactNode`
3. Verify: `npx tsc --noEmit` from `apps/web/` — expect 0 errors
4. Create `openspec/changes/plugin-architecture/proposal.md` with deferral note
5. Move directory: `mv openspec/changes/plugin-architecture openspec/changes/archive/plugin-architecture`

No database changes. No backend changes. No deployment steps.

## Open Questions

None. All decisions made.
