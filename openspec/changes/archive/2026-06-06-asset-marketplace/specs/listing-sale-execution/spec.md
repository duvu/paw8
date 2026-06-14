## ADDED Requirements

### Requirement: Execute sale atomically
Store managers and owners SHALL be able to execute a sale on an `active` listing, recording all outcome data and atomically updating asset, contract, and listing status.

#### Scenario: Successful sale execution
- **WHEN** `POST /api/v1/marketplace/listings/:id/sell` is submitted with `soldPrice`, `paymentMethod`, `buyerName`, `buyerPhone`, and optional `buyerIdNumber`
- **THEN** within a single DB transaction: (1) a `contract_transactions` row of type `liquidation_sale` is inserted, (2) asset status becomes `liquidated`, (3) listing status becomes `sold` with sold_at/sold_price/buyer fields populated, (4) contract status becomes `liquidated` with a `contract_status_history` entry, (5) audit log entry is created — all or nothing

#### Scenario: Sale blocked when listing not active
- **WHEN** `sell` is called on a listing with status `draft`, `sold`, or `cancelled`
- **THEN** system returns 422 with error `LISTING_NOT_ACTIVE`

#### Scenario: Sale blocked when asset already liquidated
- **WHEN** asset associated with the listing has status `liquidated` (e.g., due to a race condition)
- **THEN** system returns 422 with error `ASSET_ALREADY_LIQUIDATED`

#### Scenario: Concurrent sale attempts are safe
- **WHEN** two requests attempt to execute a sale on the same listing simultaneously
- **THEN** only one succeeds; the other receives 422 with error `LISTING_NOT_ACTIVE` (first write wins via SELECT FOR UPDATE)

#### Scenario: Sale with no linked contract
- **WHEN** the listing has `contract_id = null` (asset forfeited outside a formal contract)
- **THEN** the sale proceeds without inserting a `contract_transactions` row; only asset and listing status are updated

### Requirement: Sale creates financial transaction record
Every executed sale SHALL produce an append-only `contract_transactions` record for audit and reporting.

#### Scenario: Transaction record fields
- **WHEN** a sale is executed
- **THEN** the `contract_transactions` row has `transaction_type = 'liquidation_sale'`, `amount = soldPrice`, `payment_method`, `created_by = userId`, and `created_at` timestamp

### Requirement: Sold price may differ from listing price
The system SHALL accept a `soldPrice` that differs (higher or lower) from the original `listing_price`.

#### Scenario: Sold price below listing price
- **WHEN** `soldPrice` is less than `listing_price`
- **THEN** sale executes normally; both prices are stored for comparison in reports

#### Scenario: Sold price must be positive
- **WHEN** `soldPrice` is zero or negative
- **THEN** system returns 400 with validation error

### Requirement: Sale is audit logged with full context
Every sale execution SHALL be recorded in `audit_logs`.

#### Scenario: Audit log on successful sale
- **WHEN** a sale is executed successfully
- **THEN** `audit_logs` entry contains `action=marketplace_sale_executed`, `entity_type=marketplace_listing`, `entity_id=<listingId>`, `new_value` JSON with soldPrice, paymentMethod, buyerName, and assetId
