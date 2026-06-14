## Context

The paw8 system already has `AssetStatus.PENDING_LIQUIDATION` and `ContractStatus.LIQUIDATED` states plus a contract state machine, but no mechanism to publicly list, browse, or sell those assets. The marketplace fills this gap while remaining entirely within the existing multi-tenant architecture: every listing is scoped to a `tenant_id`, every sale is an append-only `contract_transactions` entry, and public browse is read-only with no auth requirement.

Existing foundation to reuse:
- `libs/assets/` — asset CRUD, status transitions, inventory
- `libs/contracts/` — state machine, `updateStatus`, status history
- `libs/transactions/` — append-only financial transactions (adding `liquidation_sale` type)
- `libs/files/` — presigned upload/download, asset photo metadata
- `libs/audit/` — audit logging for all state changes
- `apps/web/app/(dashboard)/` — authenticated staff/manager UI
- Auth guards: `JwtAuthGuard`, `RolesGuard`, `@Roles()`, `CurrentUser`

## Goals / Non-Goals

**Goals:**
- Allow store managers/owners to list pending-liquidation assets publicly.
- Provide a public (unauthenticated) browse page scoped to a tenant.
- Record buyer contact inquiries against listings.
- Execute a sale: record `liquidation_sale` transaction, flip asset → `liquidated`, flip contract → `liquidated`, atomically in a DB transaction.
- Full audit trail for listing creation, publication, sale, and cancellation.
- Reuse existing file/photo infrastructure for listing images.

**Non-Goals:**
- Online payment processing (no VietQR, no Stripe, no payment gateway in MVP).
- Cross-tenant marketplace or aggregated listing platform.
- Buyer account registration or authentication.
- Automated price suggestion or AI valuation.
- Email/SMS notifications to buyers (deferred to MVP2 notification module).
- Bidding or auction mechanics.

## Decisions

### 1. New `libs/marketplace/` module (not embedded in `libs/assets/`)

**Why**: Listings have their own lifecycle (draft → active → sold/cancelled) independent of the underlying asset status. Mixing them into `assets` would muddle the domain boundary. A clean module also makes future extraction trivial.

**Alternative considered**: Adding listing fields directly to the `assets` table. Rejected because an asset can only have one active listing at a time but should allow re-listing after cancellation (history), and the listing has its own set of fields (asking price, description, buyer info) that don't belong on the asset.

### 2. DB: `marketplace_listings` + `buyer_inquiries` — new tables, new migration

Schema:

```sql
-- marketplace_listings
id           UUID PK
tenant_id    UUID NOT NULL  -- FK tenants
store_id     UUID NOT NULL  -- FK stores
asset_id     UUID NOT NULL  -- FK assets
contract_id  UUID           -- nullable: some assets may have been forfeited without active contract
listing_price  NUMERIC(15,2) NOT NULL
status       ENUM('draft','active','sold','cancelled') DEFAULT 'draft'
title        VARCHAR(200) NOT NULL
description  TEXT
created_by   UUID NOT NULL
updated_by   UUID
sold_at      TIMESTAMPTZ
sold_price   NUMERIC(15,2)
buyer_name   VARCHAR(200)
buyer_phone  VARCHAR(20)
buyer_id_number VARCHAR(50)
payment_method VARCHAR(50)
created_at   TIMESTAMPTZ DEFAULT NOW()
updated_at   TIMESTAMPTZ DEFAULT NOW()

-- buyer_inquiries
id           UUID PK
tenant_id    UUID NOT NULL
listing_id   UUID NOT NULL  -- FK marketplace_listings
buyer_name   VARCHAR(200) NOT NULL
buyer_phone  VARCHAR(20) NOT NULL
buyer_email  VARCHAR(200)
message      TEXT
created_at   TIMESTAMPTZ DEFAULT NOW()
```

Indexes: `(tenant_id, status)`, `(tenant_id, asset_id)`, `(listing_id)`.

### 3. Sale execution is a single DB transaction

Atomic sequence inside `MarketplaceService.executeSale()`:

1. Assert listing status = `active`.
2. Assert asset status = `pending_liquidation` or `overdue`.
3. INSERT `contract_transactions` row type=`liquidation_sale`, amount=`sold_price`.
4. UPDATE `assets.status` = `liquidated`.
5. UPDATE `marketplace_listings` — set status=`sold`, sold_at, sold_price, buyer fields.
6. UPDATE `pawn_contracts.status` = `liquidated` + insert into `contract_status_history`.
7. INSERT `audit_logs` row.

All inside `db.transaction()`. If any step fails the entire sale rolls back.

### 4. Public browse page: `/marketplace?tenant=<code>` (no auth)

**Why tenant scoping via query param vs. subdomain**: Subdomain routing requires infrastructure changes (wildcard DNS, cert). Query param works immediately with current single-host deployment and can be upgraded later.

Route is under `apps/web/app/marketplace/` (outside `(dashboard)`) so Next.js middleware does not require JWT for it.

The backend endpoint `GET /api/v1/marketplace/public/listings?tenantCode=xxx` is unauthenticated but validates `tenantCode` exists and is `active`, then returns only `active` listings.

### 5. Buyer inquiries: stored in DB, no real-time notification (MVP)

Staff see inquiries on the listing detail page. No push/SMS/email — deferred to the notification module (Month 5 roadmap). Audit log records each inquiry submission.

### 6. Listing creation gated on asset status

`POST /api/v1/marketplace/listings` validates that the asset is in `pending_liquidation` status. Staff cannot list `holding` or `redeemed` assets. This enforces the workflow: contract expires → manager marks pending_liquidation → manager creates listing.

## Risks / Trade-offs

- **Public endpoint leaks tenant asset data** → Mitigation: only `active` status listings returned, no financial amounts from the contract (only the `listing_price`), no customer PII.
- **Race condition: two staff sell same listing simultaneously** → Mitigation: `executeSale()` checks `status = 'active'` inside the transaction with a `SELECT ... FOR UPDATE` lock on the listing row.
- **Photos not duplicated to listing** → The listing reuses existing `files` records linked to `entity_type='asset'`. Public browse fetches presigned URLs server-side (short TTL). No separate file copy needed.
- **Sold price < original loan** → Expected and intentional. The `liquidation_sale` transaction records the actual sold amount; any deficiency is a business loss visible in reports. No automatic write-off logic needed in MVP.

## Migration Plan

1. Run new migration: create `marketplace_listings`, `buyer_inquiries` tables.
2. Deploy backend with new `marketplace` module.
3. Deploy frontend with new marketplace pages.
4. No data backfill required — listings are created by staff going forward.
5. Rollback: drop both tables (no FK constraints from core tables point to them).
