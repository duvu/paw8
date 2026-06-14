## ADDED Requirements

### Requirement: Daily trial expiry check
The system SHALL run a scheduled job daily (02:00 UTC) that identifies tenants with `status = 'trial'` whose `trial_end_date + grace_period_days` has passed and sets their status to `suspended`.

#### Scenario: Tenant past grace period
- **WHEN** the scheduled job runs and tenant T1 has `trial_end_date = 2025-01-01`, `grace_period_days = 3`, and current date is 2025-01-05
- **THEN** the system sets T1 status to `suspended`

#### Scenario: Tenant within grace period
- **WHEN** the scheduled job runs and tenant T2 has `trial_end_date = 2025-01-01`, `grace_period_days = 3`, and current date is 2025-01-03
- **THEN** the system does NOT change T2 status

#### Scenario: Non-trial tenants unaffected
- **WHEN** the scheduled job runs and tenant T3 has `status = 'active'` with a past `trial_end_date`
- **THEN** the system does NOT change T3 status (only `trial` status tenants are affected)

### Requirement: Grace period configuration
The system SHALL read `grace_period_days` from a global system configuration (default: 3 days) used by the trial expiry job.

#### Scenario: Default grace period
- **WHEN** no custom `grace_period_days` is configured
- **THEN** the system uses 3 days as the default grace period

### Requirement: Audit log for automatic suspension
The system SHALL create an audit log entry when a tenant is auto-suspended by the trial expiry job, with `action = 'trial_expired'` and `user_id = 'system'`.

#### Scenario: Audit trail for auto-suspension
- **WHEN** the trial expiry job suspends tenant T1
- **THEN** the system creates an audit log entry with `{ tenant_id: T1.id, action: 'trial_expired', entity_type: 'tenant', entity_id: T1.id, user_id: 'system' }`

### Requirement: Suspended tenant users cannot authenticate
The system SHALL reject login attempts for users belonging to a suspended tenant with an appropriate error message.

#### Scenario: Login rejected for suspended tenant
- **WHEN** a user of a suspended tenant attempts to log in
- **THEN** the system returns `403 Forbidden` with `{ message: "Your organization's account has been suspended. Please contact support." }`
