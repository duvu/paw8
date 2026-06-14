## ADDED Requirements

### Requirement: Onboarding wizard UI
The system SHALL provide a multi-step wizard at `/platform/tenants/onboard` with three steps: Tenant Info, First Store, Tenant Owner. Each step validates before allowing progression to the next.

#### Scenario: Complete wizard successfully
- **WHEN** Platform Admin fills all three steps and clicks "Create Tenant"
- **THEN** the system calls `POST /api/v1/tenants/onboard` with combined payload and redirects to the new tenant detail page with a success message

#### Scenario: Step validation blocks progression
- **WHEN** Platform Admin leaves required "Tenant Code" field empty and clicks Next
- **THEN** the system highlights the field with an error and prevents navigation to step 2

#### Scenario: Wizard allows going back
- **WHEN** Platform Admin is on step 3 and clicks "Back"
- **THEN** the system returns to step 2 with all previously entered data preserved

### Requirement: Onboarding backend endpoint
The system SHALL expose `POST /api/v1/tenants/onboard` that accepts tenant info, first store, and owner user data. The operation MUST execute atomically within a single database transaction.

#### Scenario: Successful onboarding
- **WHEN** the endpoint receives valid data for tenant, store, and owner
- **THEN** the system creates all three entities in one transaction and returns `201` with `{ tenant, store, owner }` response

#### Scenario: Duplicate tenant code
- **WHEN** the endpoint receives a tenant code that already exists
- **THEN** the system returns `409 Conflict` with `{ message: "Tenant code already exists" }` and no entities are created

#### Scenario: Transaction rollback on failure
- **WHEN** tenant and store are created successfully but owner user creation fails (e.g., email already taken)
- **THEN** the system rolls back tenant and store creation and returns `409` with the specific error

### Requirement: Owner user created with correct role
The onboarding endpoint SHALL create the owner user with role `tenant_owner`, assign them to the new tenant, and assign them to the newly created store.

#### Scenario: Owner has tenant_owner role
- **WHEN** onboarding completes successfully
- **THEN** the created user has role `tenant_owner`, `tenant_id` matching the new tenant, and is assigned to the first store

### Requirement: Assign owner to existing tenant
The system SHALL expose `POST /api/v1/tenants/:id/owner` to create and assign a tenant owner to an existing tenant that has no owner yet.

#### Scenario: Assign owner to ownerless tenant
- **WHEN** Platform Admin calls `POST /api/v1/tenants/:id/owner` with user data and the tenant has no existing owner
- **THEN** the system creates the user with `tenant_owner` role and returns `201`

#### Scenario: Tenant already has an owner
- **WHEN** Platform Admin calls `POST /api/v1/tenants/:id/owner` and the tenant already has a user with `tenant_owner` role
- **THEN** the system returns `409 Conflict` with `{ message: "Tenant already has an owner" }`
