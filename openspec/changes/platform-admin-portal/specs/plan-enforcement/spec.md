## ADDED Requirements

### Requirement: Enforce max_stores limit
The system SHALL reject store creation requests when the tenant has reached its `max_stores` limit.

#### Scenario: Store creation within limit
- **WHEN** a user creates a store and the tenant currently has 2 stores with `max_stores = 5`
- **THEN** the system creates the store successfully

#### Scenario: Store creation at limit
- **WHEN** a user creates a store and the tenant currently has 5 stores with `max_stores = 5`
- **THEN** the system returns `403 Forbidden` with `{ message: "Store limit reached. Current plan allows maximum 5 stores." }`

### Requirement: Enforce max_users limit
The system SHALL reject user creation requests when the tenant has reached its `max_users` limit.

#### Scenario: User creation within limit
- **WHEN** a tenant admin creates a user and the tenant currently has 3 users with `max_users = 10`
- **THEN** the system creates the user successfully

#### Scenario: User creation at limit
- **WHEN** a tenant admin creates a user and the tenant currently has 10 users with `max_users = 10`
- **THEN** the system returns `403 Forbidden` with `{ message: "User limit reached. Current plan allows maximum 10 users." }`

### Requirement: Plan limits bypass for Platform Admin
Platform Admin MUST be able to create stores/users beyond plan limits when operating through the onboarding or admin endpoints.

#### Scenario: Platform Admin creates store beyond limit
- **WHEN** Platform Admin creates a store via `POST /api/v1/tenants/onboard` for a tenant at its limit
- **THEN** the system creates the store without plan limit check (the onboard endpoint is inherently exempt)

### Requirement: Usage endpoint for current counts
The system SHALL expose `GET /api/v1/tenants/:id/usage` returning current store count, user count, and their respective limits.

#### Scenario: Fetch tenant usage
- **WHEN** Platform Admin calls `GET /api/v1/tenants/:id/usage`
- **THEN** the system returns `{ stores: { current: 3, max: 5 }, users: { current: 7, max: 10 } }`
