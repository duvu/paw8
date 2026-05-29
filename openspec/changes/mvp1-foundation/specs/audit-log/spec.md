## ADDED Requirements

### Requirement: Append-only audit log
The system SHALL insert an audit log entry for every sensitive business operation. Audit log rows SHALL NOT be updatable or deletable by any user role.

#### Scenario: Contract creation audit
- **WHEN** a pawn contract is created
- **THEN** the system inserts an `audit_logs` row with `action=contract.created`, `entity_type=pawn_contract`, `entity_id`, `tenant_id`, `store_id`, `user_id`, `ip_address`, `created_at`

#### Scenario: Transaction void audit
- **WHEN** a transaction void is recorded
- **THEN** the system inserts an audit row with `old_value` containing the original transaction JSON

### Requirement: Audit log events coverage
The system SHALL log the following events: login, login_failed, customer.created, customer.updated, file.uploaded, contract.created, contract.updated, contract.cancelled, disbursement.recorded, interest.collected, contract.extended, contract.settled, asset.status_changed, transaction.voided, transaction.reversed, transaction.adjusted.

#### Scenario: Failed login audit
- **WHEN** a login attempt fails
- **THEN** the system inserts an audit row with `action=login_failed`, `ip_address`, and the attempted email (NOT the password)

### Requirement: Audit log query
The system SHALL allow Tenant Admin to query audit logs filtered by tenant, store, user, action, entity, and date range.

#### Scenario: Audit log query by action
- **WHEN** `GET /api/v1/audit-logs?action=contract.created&startDate=` is called by Tenant Admin
- **THEN** the system returns paginated audit entries within the tenant

#### Scenario: Staff cannot query audit logs
- **WHEN** a user with role `staff` calls `GET /api/v1/audit-logs`
- **THEN** the system returns HTTP 403
