## ADDED Requirements

### Requirement: Create and manage stores within a tenant
The system SHALL allow Tenant Admin to create stores scoped to their tenant. All store records SHALL include `tenant_id`.

#### Scenario: Create store
- **WHEN** Tenant Admin calls `POST /api/v1/stores` with valid name, address, phone
- **THEN** the system creates the store with `tenant_id` from JWT and returns the store record

#### Scenario: Cross-tenant store access blocked
- **WHEN** a user from tenant A attempts to read/update a store belonging to tenant B
- **THEN** the system returns HTTP 404 (not 403, to avoid tenant enumeration)

### Requirement: Assign manager and staff to store
The system SHALL allow Tenant Admin to assign a user as store manager and assign staff to stores.

#### Scenario: Assign manager
- **WHEN** `PATCH /api/v1/stores/:id/manager` is called with a valid `userId` in the same tenant
- **THEN** the store's `manager_user_id` is updated

#### Scenario: Assign staff to store
- **WHEN** `POST /api/v1/stores/:id/staff` is called with a valid `userId`
- **THEN** a `user_store_assignments` record is created

### Requirement: Lock and unlock stores
The system SHALL allow Tenant Admin to lock/unlock a store. Staff assigned to a locked store SHALL NOT perform transactions.

#### Scenario: Transaction in locked store
- **WHEN** staff attempts to create a contract in a locked store
- **THEN** the system returns HTTP 422 with error `STORE_LOCKED`
