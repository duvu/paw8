# Remaining Issues — Design Notes

## Issue Group 1: TypeScript Errors in `apps/web`

### Root Cause

The `tailwind-design-system` change hardened UI components with strict variant unions but the platform-admin pages were not updated to match, creating 3 type mismatches:

| File | Line | Error | Root Cause |
|---|---|---|---|
| `platform/tenants/[id]/page.tsx` | 154 | `Element` not assignable to `string` | `PageHeader.subtitle` typed as `string`; page passes `<span>` JSX |
| `platform/tenants/onboard/page.tsx` | 258 | `"outline"` not in `ButtonVariant` | `ButtonVariant` union missing `'outline'` |
| `platform/tenants/page.tsx` | 78, 145 | Same Button + Badge `"outline"` issue | Same as above; `BadgeVariant` also missing `'outline'` |

### Fix Strategy

**Preferred approach**: Extend the component types rather than changing the call sites.

- `PageHeader.subtitle`: Widen to `React.ReactNode` — it's the correct semantic type for a slot that may contain styled JSX.
- `Button`/`Badge` `'outline'` variant: Add to union + add Tailwind styles. The `variantStyles` record already uses an exhaustive `Record<ButtonVariant, string>` pattern so the compiler will force adding the style too.

**Do NOT** flatten the `<span>` in the page to a plain string — the styling intent (mono font, neutral color) would be lost.

---

## Issue Group 2: `plugin-architecture` Empty Change

This stub has no artifacts and no scope defined. For MVP1, plugin/extensibility architecture is out of scope per `docs/mvp1-requirements.md` section 14. Deferring keeps the changes directory clean and prevents confusion about what is "open" vs "complete".

Deferral does not mean abandonment — when MVP2 scopes webhooks or configurable calculators, a proper proposal can be created fresh.

---

## Issue Group 3: `asset-marketplace` Not Implemented

All spec artifacts are complete. Key design decisions already made (see `openspec/changes/asset-marketplace/design.md`):

- Listings are tenant-scoped; public browse is by `tenantCode` query param
- `executeSale` is a single atomic DB transaction (SELECT FOR UPDATE on listing → update listing/asset/contract → insert transaction)
- Public endpoints have no `JwtAuthGuard`; inquiry endpoint has ThrottlerGuard (5 req/60s)
- Photos served via presigned GET URLs generated at query time

**Integration points to be aware of:**
- `liquidation_sale` transaction type must be added to the existing `TransactionType` enum before `executeSale` can insert correctly
- `FilesService.getPresignedGetUrl()` must accept explicit `tenantId` for the public listing detail endpoint (no user context available)
- Marketplace nav should use the same `allowedRoles` guard pattern as existing dashboard nav items
