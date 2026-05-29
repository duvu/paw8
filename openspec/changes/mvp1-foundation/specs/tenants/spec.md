## ADDED Requirements

### Requirement: Create tenant
The system SHALL allow Platform Admin to create a new tenant with name, code, plan, and limits.

#### Scenario: Successful tenant creation
- **WHEN** Platform Admin calls `POST /api/v1/tenants` with valid payload
- **THEN** the system creates the tenant with `status=active` and returns the tenant record

#### Scenario: Duplicate tenant code
- **WHEN** a tenant with the same `code` already exists
- **THEN** the system returns HTTP 409 with error `TENANT_CODE_EXISTS`

### Requirement: Tenant activation and locking
The system SHALL allow Platform Admin to activate or lock a tenant. Locked tenants SHALL NOT allow any user login.

#### Scenario: Lock a tenant
- **WHEN** Platform Admin calls `PATCH /api/v1/tenants/:id/status` with `{ status: "locked" }`
- **THEN** all users under that tenant receive HTTP 403 on subsequent requests

#### Scenario: Activate a locked tenant
- **WHEN** Platform Admin sets status back to `active`
- **THEN** tenant users can log in again

### Requirement: Tenant settings
The system SHALL store per-tenant configuration including `maxStores`, `maxUsers`, and `trialEndDate`.

#### Scenario: Enforce max stores limit
- **WHEN** a tenant has reached its `maxStores` limit and an attempt is made to create another store
- **THEN** the system returns HTTP 422 with error `MAX_STORES_REACHED`

#### Scenario: Enforce max users limit
- **WHEN** a tenant has reached its `maxUsers` limit and an attempt is made to create another user
- **THEN** the system returns HTTP 422 with error `MAX_USERS_REACHED`
