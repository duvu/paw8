## ADDED Requirements

### Requirement: Inventory view for held assets
The system SHALL provide an inventory view that shows which assets are currently being held, where they are stored, and which store currently owns operational responsibility for them. The view MUST remain tenant-scoped and support optional store filtering.

#### Scenario: View held assets for a store
- **WHEN** an authenticated user requests the asset inventory view for a store within their allowed store scope
- **THEN** the system returns held assets for that tenant and store, including location information when available

#### Scenario: View inventory without cross-tenant leakage
- **WHEN** an authenticated user requests the asset inventory view
- **THEN** the system excludes assets belonging to other tenants

### Requirement: Inventory location tracking
The system SHALL store and return inventory location metadata for assets that are physically held by the business. Location data MUST be retrievable through the inventory view and asset detail flows.

#### Scenario: Persist asset storage location
- **WHEN** an asset is created or updated with valid location metadata for a held state
- **THEN** the system stores that inventory location data for later lookup

#### Scenario: Return location in inventory results
- **WHEN** an authenticated user views an inventory row for a held asset in scope
- **THEN** the system includes the stored location code or location note when present

### Requirement: Inventory state follows contract lifecycle
The system MUST keep inventory visibility aligned with contract lifecycle actions that cause the business to hold or release an asset. Assets returned through settlement or redeem flows MUST no longer appear as actively held inventory.

#### Scenario: Remove settled asset from active inventory
- **WHEN** a contract settlement or equivalent release workflow completes for an asset
- **THEN** the asset no longer appears in the active held-inventory view

#### Scenario: Keep pledged asset visible during active contract
- **WHEN** an asset is linked to an active contract and remains in business custody
- **THEN** the asset appears in active inventory results for the correct tenant and store
