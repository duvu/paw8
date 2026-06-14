## ADDED Requirements

### Requirement: Tenant-scoped asset creation and update
The system SHALL allow authenticated users to create and update asset records only within the tenant derived from the authenticated request context. The system MUST reject any attempt to create or update an asset for a store outside the user's allowed store scope.

#### Scenario: Create asset in an allowed store
- **WHEN** a staff or manager user submits valid asset data for a store in their allowed store assignments
- **THEN** the system creates the asset under the user's tenant and associates it with that store

#### Scenario: Reject asset creation outside store scope
- **WHEN** an authenticated user submits asset data for a store that is not in their allowed store assignments
- **THEN** the system rejects the request and does not create the asset

### Requirement: Asset search and detail retrieval
The system SHALL provide asset list and detail endpoints that support tenant-scoped lookup by free-text query and operational filters. Search behavior MUST support lookup by serial number, IMEI, or license plate when those identifiers exist.

#### Scenario: Search by asset identifier
- **WHEN** an authenticated user searches assets by serial number, IMEI, or license plate within their tenant scope
- **THEN** the system returns matching asset records from that tenant only

#### Scenario: Retrieve asset detail
- **WHEN** an authenticated user requests a specific asset detail that belongs to their tenant scope
- **THEN** the system returns the asset details including current operational status and related inventory-facing fields

### Requirement: Controlled asset status transitions
The system SHALL support explicit asset status updates through a dedicated status-changing workflow. Status changes MUST preserve tenant/store scope checks and MUST only allow transitions used by MVP1 contract and settlement workflows.

#### Scenario: Mark asset as redeemed after valid business action
- **WHEN** an authorized user performs a valid redeem or settlement-related status update for an asset in scope
- **THEN** the system updates the asset status to the target operational state

#### Scenario: Reject unauthorized status change
- **WHEN** a user without the required role or store scope attempts to change asset status
- **THEN** the system rejects the status update
