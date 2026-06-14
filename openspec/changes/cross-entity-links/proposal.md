## Why

Operators navigating paw8 frequently need to jump between related entities — from a contract to its assets, from an asset back to its contract, from a customer to all their contracts, from a contract or asset back to the customer. Currently, detail pages show related data but do not provide clickable navigation links, forcing users to manually search for the connected record. This creates friction in daily operations (debt collection, settlement, asset lookup) and is the most common UX complaint in early usage.

## What Changes

- **Asset list page**: each row links to the asset's active contract (if any) via a clickable contract code badge
- **Asset detail page** (new `assets/[id]/page.tsx`): shows full asset info + linked contract card (clickable) + customer card (clickable)
- **Contract detail page** (`contracts/[id]/page.tsx`): assets section already exists — add clickable link per asset row leading to the asset detail page; customer name already shown — make it a link to `customers/[id]`
- **Customer detail page** (`customers/[id]/page.tsx`): contract history table already exists — make each contract code a link to `contracts/[id]`; add asset summary section listing assets tied to this customer's contracts

## Capabilities

### New Capabilities
- `asset-detail-page`: Full asset detail page at `/assets/[id]` showing asset info, linked contract, and customer

### Modified Capabilities
- (none — no spec-level requirement changes; this is purely UI navigation wiring)

## Impact

- `apps/web/app/(dashboard)/assets/page.tsx` — add contract code link per row
- `apps/web/app/(dashboard)/assets/[id]/page.tsx` — new file
- `apps/web/app/(dashboard)/contracts/[id]/page.tsx` — make asset rows and customer name clickable links
- `apps/web/app/(dashboard)/customers/[id]/page.tsx` — make contract codes clickable; add assets summary section
- No backend changes required — all data is already available via existing API endpoints
- No new dependencies
