## ADDED Requirements

### Requirement: Create marketplace listing from pending-liquidation asset
Store managers and tenant owners/admins SHALL be able to create a marketplace listing for any asset whose status is `pending_liquidation`.

#### Scenario: Successful listing creation
- **WHEN** a store manager submits `POST /api/v1/marketplace/listings` with a valid `asset_id` whose status is `pending_liquidation`, a `listing_price`, and a `title`
- **THEN** the system creates a `marketplace_listings` record with status `draft`, returns 201 with the new listing ID and all fields

#### Scenario: Blocked when asset not in pending_liquidation
- **WHEN** a store manager submits a listing creation request for an asset with status `holding` or `redeemed`
- **THEN** the system returns 422 with error `ASSET_NOT_LIQUIDATABLE`

#### Scenario: Blocked by tenant/store scope
- **WHEN** a user submits a listing for an asset that belongs to a different tenant
- **THEN** the system returns 404 (asset not found within their tenant scope)

### Requirement: Update listing details
Store managers and owners SHALL be able to update title, description, and listing_price of a listing that is in `draft` or `active` status.

#### Scenario: Update draft listing
- **WHEN** `PATCH /api/v1/marketplace/listings/:id` is submitted with new title, description, or listing_price while listing status is `draft`
- **THEN** listing fields are updated and 200 is returned with updated listing

#### Scenario: Update blocked on sold or cancelled listing
- **WHEN** `PATCH /api/v1/marketplace/listings/:id` is submitted for a listing with status `sold` or `cancelled`
- **THEN** system returns 422 with error `LISTING_NOT_EDITABLE`

### Requirement: Publish a draft listing to active
Store managers and owners SHALL be able to publish a draft listing, making it visible on the public marketplace.

#### Scenario: Successful publish
- **WHEN** `PATCH /api/v1/marketplace/listings/:id/publish` is submitted for a `draft` listing
- **THEN** listing status changes to `active`, and it becomes visible on the public browse endpoint

#### Scenario: Publish blocked when no listing_price set
- **WHEN** a listing has no `listing_price` (null or zero) and publish is requested
- **THEN** system returns 422 with error `MISSING_LISTING_PRICE`

### Requirement: Cancel a listing
Store managers and owners SHALL be able to cancel a `draft` or `active` listing.

#### Scenario: Successful cancellation
- **WHEN** `PATCH /api/v1/marketplace/listings/:id/cancel` is submitted
- **THEN** listing status changes to `cancelled`, asset status remains unchanged, audit log entry is created

### Requirement: List and filter own tenant listings
Authenticated tenant users (any role) SHALL be able to browse all listings within their tenant, filtered by status.

#### Scenario: Filter by status
- **WHEN** `GET /api/v1/marketplace/listings?status=active` is called
- **THEN** only listings matching that status within the user's tenant are returned, paginated

#### Scenario: Listing detail includes asset and file photos
- **WHEN** `GET /api/v1/marketplace/listings/:id` is called
- **THEN** response includes listing fields, linked asset summary, and presigned GET URLs for asset photos (short TTL)
