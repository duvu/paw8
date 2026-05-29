## ADDED Requirements

### Requirement: Append-only financial transactions
The system SHALL record all financial events as immutable rows. Direct UPDATE or DELETE on `contract_transactions` SHALL NOT be exposed via any API endpoint.

#### Scenario: Record disbursement
- **WHEN** a pawn contract is activated
- **THEN** the system inserts a `contract_transactions` row with `transaction_type=disbursement`, amount, payment method, created_by, created_at

#### Scenario: Attempt to delete a transaction
- **WHEN** any API call attempts to delete a financial transaction
- **THEN** the system returns HTTP 405 Method Not Allowed

### Requirement: Collect interest and fees
The system SHALL allow staff to record customer payments for interest and fees against an active contract.

#### Scenario: Record interest payment
- **WHEN** staff calls `POST /api/v1/contracts/:id/transactions` with `transaction_type=interest_payment`, amount, payment_method
- **THEN** the system inserts the transaction and returns the updated contract balance

### Requirement: Extend contract
The system SHALL allow extending a contract's due date after collecting required interest/fees.

#### Scenario: Contract extension
- **WHEN** `POST /api/v1/contracts/:id/extend` is called with `newDueDate`, `interestPaid`, `feePaid`
- **THEN** the system records the interest/fee transactions, inserts a `contract_extensions` row, updates `due_date`, and transitions status to `extended`

### Requirement: Settle contract
The system SHALL allow full settlement: collect remaining principal + interest + fees, mark contract settled, mark asset redeemed.

#### Scenario: Full settlement
- **WHEN** `POST /api/v1/contracts/:id/settle` is called with payment details
- **THEN** the system inserts a `settlement` transaction, updates contract status to `settled`, updates asset status to `redeemed`, and records asset return date

### Requirement: Void and reversal transactions
The system SHALL allow authorized users (Tenant Admin+) to create void or reversal transactions referencing an original transaction.

#### Scenario: Void a transaction
- **WHEN** Tenant Admin calls `POST /api/v1/contracts/:id/transactions/:txId/void` with a reason
- **THEN** the system inserts a new row with `transaction_type=void`, `reference_transaction_id=txId`, and the reason

#### Scenario: Unauthorized void attempt
- **WHEN** a user with role `staff` attempts to void a transaction
- **THEN** the system returns HTTP 403
