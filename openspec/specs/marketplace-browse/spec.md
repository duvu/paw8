## ADDED Requirements

### Requirement: Public browse endpoint returns active listings by tenant
The system SHALL expose an unauthenticated read-only endpoint that returns `active` marketplace listings for a given tenant, identified by `tenantCode`.

#### Scenario: Browse active listings by tenant code
- **WHEN** an unauthenticated client calls `GET /api/v1/marketplace/public/listings?tenantCode=ABC123`
- **THEN** the system returns a paginated list of `active` listings for that tenant with title, listing_price, asset type, description, and photo URLs

#### Scenario: Invalid or inactive tenant code
- **WHEN** `tenantCode` does not match any active tenant
- **THEN** system returns 404 with error `TENANT_NOT_FOUND`

#### Scenario: No auth required
- **WHEN** the public browse endpoint is called without an Authorization header
- **THEN** the request succeeds normally (no 401)

### Requirement: Public listing detail page
The system SHALL expose an unauthenticated endpoint to fetch a single listing's full public detail.

#### Scenario: Fetch active listing detail
- **WHEN** `GET /api/v1/marketplace/public/listings/:id` is called for an `active` listing
- **THEN** response includes title, description, listing_price, asset type, condition description, brand, model, color, and presigned asset photo URLs

#### Scenario: Draft or sold listing not accessible publicly
- **WHEN** `GET /api/v1/marketplace/public/listings/:id` is called for a listing with status `draft`, `sold`, or `cancelled`
- **THEN** system returns 404

### Requirement: Public browse page in Next.js
The Next.js application SHALL render a public marketplace browse page at `/marketplace?tenant=<code>` that does not require authentication.

#### Scenario: Page loads without login
- **WHEN** a browser navigates to `/marketplace?tenant=ABC123`
- **THEN** the page renders listing cards without redirecting to login

#### Scenario: Listing cards show key information
- **WHEN** listings are loaded
- **THEN** each card displays asset name, type badge, asking price formatted in VND, and first photo thumbnail

#### Scenario: Pagination controls
- **WHEN** there are more than 12 listings
- **THEN** pagination controls are rendered and clicking next page loads the next set of listings

### Requirement: Public browse does not expose PII
The public listing endpoint SHALL NOT return customer name, phone, identity number, original loan amount, or any contract financial details.

#### Scenario: PII fields absent from public response
- **WHEN** `GET /api/v1/marketplace/public/listings` is called unauthenticated
- **THEN** response JSON contains no `customerName`, `phone`, `identityNumber`, `principalAmount`, or `contractId`
