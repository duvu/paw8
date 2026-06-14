## 1. Fix TypeScript Errors — `apps/web`

### 1.1 Widen `PageHeader.subtitle` to accept `React.ReactNode`
- [ ] 1.1 Open `apps/web/components/ui/page-header.tsx` (or wherever `PageHeader` is defined), change the `subtitle` prop type from `string` to `React.ReactNode`

### 1.2 Add `'outline'` variant to `Button`
- [ ] 1.2 Open `apps/web/components/ui/button.tsx`, add `'outline'` to the `ButtonVariant` union and add corresponding Tailwind classes to `variantStyles`

### 1.3 Add `'outline'` variant to `Badge`
- [ ] 1.3 Open `apps/web/components/ui/badge.tsx`, add `'outline'` to the badge variant union and add corresponding Tailwind classes

### 1.4 Verify zero TS errors
- [ ] 1.4 Run `npx tsc --noEmit` from `apps/web/` and confirm 0 errors

---

## 2. Resolve `plugin-architecture` Stub

### 2.1 Add deferral proposal
- [ ] 2.1 Create `openspec/changes/plugin-architecture/proposal.md` with explicit deferral rationale: plugin/webhook architecture is post-MVP1; MVP1 scope is complete without it

### 2.2 Archive the stub
- [ ] 2.2 Move `openspec/changes/plugin-architecture/` to `openspec/changes/archive/plugin-architecture/` so it no longer appears as an open/active change

---

## 3. Implement `asset-marketplace` Feature

> All specifications live at `openspec/changes/asset-marketplace/`. Execute via `/opsx-apply asset-marketplace`.

### 3.1 Database Migration
- [ ] 3.1.1 Create migration file `YYYYMMDDHHMMSS-create-marketplace-tables.ts` — `marketplace_listings` table with all columns from design.md
- [ ] 3.1.2 Add `buyer_inquiries` table to same migration with FK to `marketplace_listings`
- [ ] 3.1.3 Add indexes: `(tenant_id, status)` on listings, `(tenant_id, asset_id)` on listings, `(listing_id)` on inquiries
- [ ] 3.1.4 Run migration and verify tables exist

### 3.2 Marketplace NestJS Module (`libs/marketplace/`)
- [ ] 3.2.1 Create `libs/marketplace/` directory structure: `src/`, `src/dto/`, `index.ts`, `marketplace.module.ts`
- [ ] 3.2.2 Write `marketplace-listing.dto.ts`: `CreateListingDto`, `UpdateListingDto`, `SellListingDto`, `ListingSearchDto`, `ListingResponseDto`, `PublicListingResponseDto`
- [ ] 3.2.3 Write `buyer-inquiry.dto.ts`: `CreateInquiryDto`, `InquiryResponseDto`
- [ ] 3.2.4 Write `marketplace.repository.ts`: raw SQL — `insertListing`, `findListingById`, `findListings`, `updateListing`, `findInquiries`, `insertInquiry`
- [ ] 3.2.5 Write `marketplace.service.ts`: `createListing`, `updateListing`, `publishListing`, `cancelListing`, `findAll`, `findOne`, `executeSale` (atomic: SELECT FOR UPDATE → update listing → update asset → update contract → insert transaction → insert audit log), `getPublicListings`, `getPublicListingById`
- [ ] 3.2.6 Write `marketplace.controller.ts`: authenticated endpoints (POST/PATCH/GET under `/api/v1/marketplace/listings`)
- [ ] 3.2.7 Write `marketplace-public.controller.ts`: unauthenticated endpoints (`/api/v1/marketplace/public/listings`); apply ThrottlerGuard on inquiry endpoint at 5/60s
- [ ] 3.2.8 Register `MarketplaceModule` in `apps/api-gateway/src/app.module.ts`

### 3.3 Integration with Existing Modules
- [ ] 3.3.1 Add `liquidation_sale` to the `TransactionType` enum in `libs/transactions/src/dto/transaction.dto.ts`
- [ ] 3.3.2 In `executeSale`: insert `liquidation_sale` transaction, call `AssetsRepository.updateStatus(tenantId, assetId, 'liquidated')`, call `ContractsRepository.updateStatus(tenantId, contractId, 'liquidated')`, insert `contract_status_history` row
- [ ] 3.3.3 In `executeSale`, `publishListing`, `cancelListing`, `createInquiry`: call `AuditService.log(...)` with appropriate action names

### 3.4 File/Photo Integration
- [ ] 3.4.1 In `findOne` (authenticated): fetch `files` records for `entity_type='asset'`, generate presigned GET URLs via `FilesService`, include in response
- [ ] 3.4.2 In `getPublicListingById`: same presigned URL generation (pass `tenantId` explicitly, no user context needed)

### 3.5 Frontend — Authenticated Listing Management
- [ ] 3.5.1 Create `apps/web/app/(dashboard)/marketplace/page.tsx` — listing table with status filter tabs, pagination
- [ ] 3.5.2 Create `apps/web/app/(dashboard)/marketplace/new/page.tsx` — create listing form (asset picker filtered to `pending_liquidation`, title, description, listing_price)
- [ ] 3.5.3 Create `apps/web/app/(dashboard)/marketplace/[id]/page.tsx` — listing detail: asset info, photos, edit fields, Publish/Cancel/Sell buttons, inquiries table
- [ ] 3.5.4 Create `apps/web/app/(dashboard)/marketplace/[id]/sell/page.tsx` (or modal) — sell form: soldPrice, paymentMethod, buyerName, buyerPhone, buyerIdNumber
- [ ] 3.5.5 Add "Marketplace" nav item to `apps/web/app/(dashboard)/layout.tsx` sidebar (visible to `store_manager`, `tenant_admin`, `tenant_owner`)
- [ ] 3.5.6 Add API client functions in `apps/web/lib/api/marketplace.ts`

### 3.6 Frontend — Public Browse Page
- [ ] 3.6.1 Create `apps/web/app/marketplace/page.tsx` — public browse at `/marketplace?tenant=<code>`
- [ ] 3.6.2 Create `apps/web/app/marketplace/[id]/page.tsx` — public listing detail with photo gallery and inquiry form
- [ ] 3.6.3 Create inquiry form component (name, phone, message)
- [ ] 3.6.4 Ensure `middleware.ts` does NOT require auth for `/marketplace/*` routes

### 3.7 Validation & Error Handling
- [ ] 3.7.1 Add error codes: `ASSET_NOT_LIQUIDATABLE`, `LISTING_NOT_EDITABLE`, `LISTING_NOT_ACTIVE`, `ASSET_ALREADY_LIQUIDATED`, `MISSING_LISTING_PRICE`
- [ ] 3.7.2 Validate `soldPrice > 0` in `SellListingDto` with `@IsPositive()`

### 3.8 Testing
- [ ] 3.8.1 Write e2e test: create listing → publish → submit inquiry → execute sale → verify asset/contract/transaction state
- [ ] 3.8.2 Write unit test for `executeSale` rollback on DB failure
- [ ] 3.8.3 Write test: public browse returns only `active` listings, no PII present
- [ ] 3.8.4 Write test: inquiry rate limiting returns 429 after 5 requests
