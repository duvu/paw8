## ADDED Requirements

### Requirement: Create and manage users within a tenant
The system SHALL allow Tenant Admin to create users scoped to their tenant with a role and store assignments.

#### Scenario: Create user
- **WHEN** Tenant Admin calls `POST /api/v1/users` with name, email, role, and optional storeIds
- **THEN** the system creates the user with `tenant_id` from JWT and hashed password

#### Scenario: Duplicate email within tenant
- **WHEN** a user with the same email already exists in the tenant
- **THEN** the system returns HTTP 409 with error `EMAIL_EXISTS_IN_TENANT`

### Requirement: Role-based access control
The system SHALL enforce permissions based on role. Roles: `platform_admin`, `tenant_owner`, `tenant_admin`, `store_manager`, `staff`, `accountant`.

#### Scenario: Staff accessing tenant management
- **WHEN** a user with role `staff` calls `GET /api/v1/tenants`
- **THEN** the system returns HTTP 403

#### Scenario: Store manager accessing only assigned stores
- **WHEN** a store manager calls `GET /api/v1/stores/:id` for a store not in their `allowedStoreIds`
- **THEN** the system returns HTTP 404

### Requirement: Store-scope enforcement
The system SHALL verify that `store_id` in any request belongs to `currentUser.allowedStoreIds`.

#### Scenario: Staff creates contract in unassigned store
- **WHEN** staff submits a contract with a `store_id` not in their allowed stores
- **THEN** the system returns HTTP 403 with error `STORE_NOT_IN_SCOPE`

### Requirement: Lock and unlock users
The system SHALL allow Tenant Admin to lock/unlock user accounts.

#### Scenario: Locked user login
- **WHEN** a locked user attempts to log in
- **THEN** the system returns HTTP 403 with error `ACCOUNT_LOCKED`
