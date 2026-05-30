## ADDED Requirements

### Requirement: Create pawned asset
The system SHALL allow staff to create an asset record associated with a store and tenant.

#### Scenario: Create asset
- **WHEN** staff calls `POST /api/v1/assets` with type, name, brand, serial number, valuation
- **THEN** the system creates the asset with `tenant_id` and `store_id` from current user context

### Requirement: Asset photo and document upload
The system SHALL allow uploading multiple photos and documents for an asset via presigned URLs.

#### Scenario: Upload asset photo
- **WHEN** staff requests a presigned URL for `entity_type=asset_photo`
- **THEN** the system returns a URL with key `tenants/{tenantId}/assets/{assetId}/photo-{n}.jpg`

### Requirement: Asset status lifecycle
The system SHALL track asset status: `holding`, `redeemed`, `overdue`, `pending_liquidation`, `liquidated`.

#### Scenario: Asset redeemed on contract settlement
- **WHEN** a pawn contract is settled
- **THEN** the system updates the linked asset status to `redeemed`

#### Scenario: Asset becomes overdue
- **WHEN** a contract transitions to `overdue`
- **THEN** the linked asset status transitions to `overdue`

### Requirement: Search assets
The system SHALL allow searching assets by IMEI, license plate, serial number, or contract within the tenant.

#### Scenario: Search by IMEI
- **WHEN** `GET /api/v1/assets?imei=123456789` is called
- **THEN** the system returns results filtered to `currentUser.tenantId`

### Requirement: Asset inventory location
The system SHALL track physical storage location (store, shelf/unit, notes) for each asset being held.

#### Scenario: Update inventory location
- **WHEN** `PATCH /api/v1/assets/:id/inventory` is called with `locationCode` and `locationNote`
- **THEN** the system updates the `asset_inventory` record
