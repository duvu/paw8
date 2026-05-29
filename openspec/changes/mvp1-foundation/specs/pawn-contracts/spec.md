## ADDED Requirements

### Requirement: Create pawn contract
The system SHALL allow staff to create a pawn contract linking a customer, one or more assets, loan amount, interest rate, and due date.

#### Scenario: Successful contract creation
- **WHEN** staff calls `POST /api/v1/contracts` with customer_id, asset_ids, principal_amount, interest_rate, interest_type, start_date, due_date
- **THEN** the system creates the contract with `status=active`, generates contract code, creates disbursement transaction, and sets asset status to `holding`

#### Scenario: Contract code generation
- **WHEN** a contract is created for store `HN01` in tenant in June 2025
- **THEN** the contract code follows pattern `HN01-202506-00001` with per-store-month sequence

### Requirement: Contract status lifecycle
The system SHALL manage contract status transitions: `draft` → `active` → `near_due` / `overdue` / `extended` → `settled` / `cancelled` / `pending_liquidation` / `liquidated`.

#### Scenario: Contract approaching due date
- **WHEN** a contract's `due_date` is within 7 days and status is `active`
- **THEN** the system transitions status to `near_due` (via scheduled job)

#### Scenario: Contract past due date
- **WHEN** a contract's `due_date` has passed and it has not been settled or extended
- **THEN** the system transitions status to `overdue` (via scheduled job)

### Requirement: Search and filter contracts
The system SHALL allow filtering contracts by code, customer name, phone, CCCD, asset, status, store, and date range within the tenant.

#### Scenario: Filter by status
- **WHEN** `GET /api/v1/contracts?status=overdue` is called
- **THEN** the system returns paginated overdue contracts for `currentUser.tenantId` filtered by `allowedStoreIds`

### Requirement: Contract history
The system SHALL record every status change in `contract_status_history`.

#### Scenario: Status change recorded
- **WHEN** a contract transitions from `active` to `overdue`
- **THEN** a new row is inserted in `contract_status_history` with `previous_status`, `new_status`, `changed_at`, `changed_by`

### Requirement: Interest calculation
The system SHALL calculate interest owed to a given date based on `interest_type` (daily/monthly/term) and `interest_rate`.

#### Scenario: Daily interest calculation
- **WHEN** `GET /api/v1/contracts/:id/settlement-preview` is called
- **THEN** the system returns `{ principalDue, interestDue, feesDue, totalDue }` calculated to today
