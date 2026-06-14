## Why

When pawn contracts expire and borrowers do not redeem their assets, shops are left holding physical inventory with capital locked up and storage costs accumulating. Currently there is no in-system mechanism to list, price, and sell these unclaimed assets — staff must manage sales out-of-band (paper, chat, word-of-mouth), with no audit trail and no connection to contract settlement records. A built-in marketplace lets store owners and managers list overdue/liquidation-pending assets for sale directly within paw8, execute sales, settle associated contracts, and maintain a full financial audit trail.

## What Changes

- New `marketplace_listings` table and DB migration: stores listing price, status (draft / active / sold / cancelled), and links asset + contract.
- New `libs/marketplace/` NestJS module with CRUD for listings and a `sell` action endpoint.
- When a sale is executed the system:
  1. Records a `liquidation_sale` transaction in `contract_transactions`.
  2. Transitions asset status → `liquidated`.
  3. Transitions contract status → `liquidated` (via existing state machine).
- New Next.js pages under `(dashboard)/marketplace/`:
  - Listing management (create, edit, publish, cancel).
  - Public-facing browse page at `/marketplace` (no auth required, per-tenant scoped by subdomain/query param).
  - Buyer inquiry form (stores inquiry in DB, notified via audit log).
- Staff/manager can only list assets that are in `pending_liquidation` status.
- Platform admin is not involved — this is per-tenant functionality.

## Capabilities

### New Capabilities

- `listing-management`: Store managers/owners can create, edit, publish, and cancel marketplace listings for assets in `pending_liquidation` status. Includes listing price, condition notes, photos (reuses existing file upload), and visibility toggle (internal draft vs. public).
- `marketplace-browse`: Public read-only browse page scoped per tenant (via `tenant_code` query param). Shows active listings with asset photos, description, asking price. No authentication required to browse.
- `buyer-inquiry`: Unauthenticated visitors can submit a contact inquiry on a listing. Inquiry stored in DB and visible to store staff. No payment processing — contact-based flow only.
- `listing-sale-execution`: Authenticated staff/manager can mark a listing as sold, recording buyer info, actual sale price (may differ from asking price), payment method, and triggering contract liquidation + asset status update atomically.

### Modified Capabilities

- (none — existing asset and contract status transitions are reused as-is; no spec-level requirement changes)

## Impact

**Backend**:
- New `libs/marketplace/` module (listings repository, service, controller, DTOs).
- New DB migration: `marketplace_listings` table + `buyer_inquiries` table.
- New `contract_transactions` entry type: `liquidation_sale`.
- `AssetStatus` enum: `liquidated` already exists — no change needed.
- `ContractStatus` enum: `liquidated` already exists — no change needed.

**Frontend**:
- New route group pages under `apps/web/app/(dashboard)/marketplace/`.
- New public page `apps/web/app/marketplace/page.tsx` (unauthenticated).

**Dependencies**: No new npm packages required (reuses existing Prisma/pg, auth guards, file module, audit module).
