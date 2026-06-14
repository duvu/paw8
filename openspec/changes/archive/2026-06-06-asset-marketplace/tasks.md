## 1. Database Migration

- [x] 1.1 Create migration file `YYYYMMDDHHMMSS-create-marketplace-tables.ts` — define `marketplace_listings` table with all columns from design.md
- [x] 1.2 Add `buyer_inquiries` table to same migration with FK to `marketplace_listings`
- [x] 1.3 Add indexes: `(tenant_id, status)` on listings, `(tenant_id, asset_id)` on listings, `(listing_id)` on inquiries
- [x] 1.4 Run migration and verify tables exist with `\d marketplace_listings`

## 2. Marketplace NestJS Module

- [x] 2.1 Create `libs/marketplace/` directory structure: `src/`, `src/dto/`, `index.ts`, `marketplace.module.ts`
- [x] 2.2 Write `marketplace-listing.dto.ts`: `CreateListingDto`, `UpdateListingDto`, `SellListingDto`, `ListingSearchDto`, `ListingResponseDto`, `PublicListingResponseDto`
- [x] 2.3 Write `buyer-inquiry.dto.ts`: `CreateInquiryDto`, `InquiryResponseDto`
- [x] 2.4 Write `marketplace.repository.ts`: raw SQL methods — `insertListing`, `findListingById`, `findListings`, `updateListing`, `findInquiries`, `insertInquiry`
- [x] 2.5 Write `marketplace.service.ts`: `createListing` (validates asset status), `updateListing`, `publishListing`, `cancelListing`, `findAll`, `findOne`, `executeSale` (full atomic transaction with SELECT FOR UPDATE), `getPublicListings`, `getPublicListingById`
- [x] 2.6 Write `marketplace.controller.ts`: authenticated endpoints — `POST /marketplace/listings`, `PATCH /marketplace/listings/:id`, `PATCH /marketplace/listings/:id/publish`, `PATCH /marketplace/listings/:id/cancel`, `GET /marketplace/listings`, `GET /marketplace/listings/:id`, `GET /marketplace/listings/:id/inquiries`, `POST /marketplace/listings/:id/sell`
- [x] 2.7 Write `marketplace-public.controller.ts`: unauthenticated endpoints — `GET /marketplace/public/listings`, `GET /marketplace/public/listings/:id`, `POST /marketplace/public/listings/:id/inquiries` (no JwtAuthGuard, apply ThrottlerGuard on inquiry endpoint at 5/60s)
- [x] 2.8 Register `MarketplaceModule` in `apps/api-gateway/src/app.module.ts`
- [x] 2.9 Export `MarketplaceModule` from `libs/marketplace/index.ts`

## 3. Integration with Existing Modules

- [x] 3.1 In `executeSale`: inject `TransactionsRepository` (or raw db) to insert `liquidation_sale` contract transaction
- [x] 3.2 In `executeSale`: call `AssetsRepository.updateStatus(tenantId, assetId, 'liquidated')` 
- [x] 3.3 In `executeSale`: call `ContractsRepository.updateStatus(tenantId, contractId, 'liquidated')` and insert `contract_status_history` row
- [x] 3.4 In `executeSale`: call `AuditService.log(...)` with `action='marketplace_sale_executed'`
- [x] 3.5 Add `AuditService.log(action='buyer_inquiry_submitted', ...)` call in `createInquiry`
- [x] 3.6 In `publishListing` and `cancelListing`: call `AuditService.log(...)` with appropriate action names
- [x] 3.7 Add `liquidation_sale` to the `TransactionType` enum in `libs/transactions/src/dto/transaction.dto.ts` (or wherever the enum lives)

## 4. File/Photo Integration

- [x] 4.1 In `findOne` (authenticated): fetch `files` records where `entity_type='asset'` and `entity_id=assetId`, generate presigned GET URLs via `FilesService.getPresignedGetUrl()`, include in response
- [x] 4.2 In `getPublicListingById`: same presigned URL generation — confirm `FilesService` can be called without tenant user context (pass tenantId explicitly)

## 5. Frontend — Authenticated Listing Management

- [x] 5.1 Create `apps/web/app/(dashboard)/marketplace/page.tsx` — listing table with status filter tabs (all, draft, active, sold, cancelled), pagination
- [x] 5.2 Create `apps/web/app/(dashboard)/marketplace/new/page.tsx` — create listing form: asset picker (filtered to `pending_liquidation`), title, description, listing_price field
- [x] 5.3 Create `apps/web/app/(dashboard)/marketplace/[id]/page.tsx` — listing detail: asset info, photos, edit fields, Publish/Cancel/Sell action buttons, inquiries table at bottom
- [x] 5.4 Create `apps/web/app/(dashboard)/marketplace/[id]/sell/page.tsx` (or modal) — sell form: soldPrice, paymentMethod select, buyerName, buyerPhone, buyerIdNumber, confirm button
- [x] 5.5 Add "Marketplace" nav item to `apps/web/app/(dashboard)/layout.tsx` sidebar, visible to `store_manager`, `tenant_admin`, `tenant_owner`
- [x] 5.6 Add API client functions in `apps/web/lib/api/marketplace.ts`: `createListing`, `updateListing`, `publishListing`, `cancelListing`, `executeSale`, `getListings`, `getListing`, `getInquiries`

## 6. Frontend — Public Browse Page

- [x] 6.1 Create `apps/web/app/marketplace/page.tsx` — public browse at `/marketplace?tenant=<code>`; reads `tenantCode` from query param, fetches from `/api/v1/marketplace/public/listings?tenantCode=...`, renders listing grid
- [x] 6.2 Create `apps/web/app/marketplace/[id]/page.tsx` — public listing detail: full description, photo gallery, asking price, asset details, inquiry form
- [x] 6.3 Create inquiry form component (name, phone, message fields, submit → `POST /api/v1/marketplace/public/listings/:id/inquiries`)
- [x] 6.4 Ensure Next.js middleware does NOT require auth for `/marketplace/*` routes (update `middleware.ts` or equivalent auth config)

## 7. Validation & Error Handling

- [x] 7.1 Add `ASSET_NOT_LIQUIDATABLE`, `LISTING_NOT_EDITABLE`, `LISTING_NOT_ACTIVE`, `ASSET_ALREADY_LIQUIDATED`, `MISSING_LISTING_PRICE` error codes to shared error constants
- [x] 7.2 Add throttler config for inquiry endpoint (5 requests per 60 seconds by IP)
- [x] 7.3 Ensure `soldPrice` > 0 validation in `SellListingDto` using `@IsPositive()`

## 8. Testing

- [x] 8.1 Write e2e test: create listing → publish → submit inquiry → execute sale → verify asset status = liquidated, contract status = liquidated, transaction record exists
- [x] 8.2 Write unit test for `executeSale` rollback: simulate DB failure on step 3 (transaction insert), assert listing/asset/contract status unchanged
- [x] 8.3 Write test: public browse returns only `active` listings, no PII fields present
- [x] 8.4 Write test: inquiry rate limiting returns 429 after 5 requests from same IP
