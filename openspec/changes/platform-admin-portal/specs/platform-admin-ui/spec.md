## ADDED Requirements

### Requirement: Platform Admin route group with dedicated layout
The system SHALL provide a separate Next.js route group `(platform-admin)` at URL prefix `/platform/` with its own sidebar layout, accessible ONLY to users with `platform_admin` role.

#### Scenario: Platform Admin accesses portal
- **WHEN** a user with role `platform_admin` navigates to `/platform/dashboard`
- **THEN** the system renders the Platform Admin layout with navigation items: Dashboard, Tenants

#### Scenario: Non-platform-admin redirected away
- **WHEN** a user with role `tenant_admin` navigates to any `/platform/*` URL
- **THEN** the system redirects them to their default route (e.g., `/dashboard`)

#### Scenario: Unauthenticated user redirected to login
- **WHEN** an unauthenticated user navigates to `/platform/tenants`
- **THEN** the system redirects them to `/login`

### Requirement: Tenant list page with pagination and filtering
The system SHALL display a paginated list of all tenants at `/platform/tenants` showing: name, code, status, plan, stores used/max, users used/max, created date.

#### Scenario: View tenant list
- **WHEN** Platform Admin opens `/platform/tenants`
- **THEN** the system displays a table of tenants with columns: Name, Code, Status (badge), Plan, Stores (used/max), Users (used/max), Created

#### Scenario: Filter by status
- **WHEN** Platform Admin selects status filter "suspended"
- **THEN** the system displays only tenants with `status = 'suspended'`

#### Scenario: Paginate through tenants
- **WHEN** Platform Admin clicks "Next" on a 20-item page
- **THEN** the system fetches and displays the next 20 tenants

### Requirement: Tenant detail page with edit capability
The system SHALL display tenant details at `/platform/tenants/:id` with editable fields: name, plan, max_stores, max_users, trial_end_date.

#### Scenario: View tenant detail
- **WHEN** Platform Admin clicks a tenant row in the list
- **THEN** the system navigates to `/platform/tenants/:id` showing all tenant fields, current usage stats, and tenant owner info

#### Scenario: Edit tenant plan
- **WHEN** Platform Admin changes the plan field and clicks Save
- **THEN** the system calls `PATCH /api/v1/tenants/:id` and displays a success toast

### Requirement: Tenant status management (lock/unlock)
The system SHALL allow Platform Admin to change tenant status between active, suspended, trial, and expired via a status action menu.

#### Scenario: Suspend a tenant
- **WHEN** Platform Admin clicks "Suspend" on an active tenant
- **THEN** the system calls `PATCH /api/v1/tenants/:id/status` with `{ status: "suspended" }` and updates the badge

#### Scenario: Reactivate a suspended tenant
- **WHEN** Platform Admin clicks "Activate" on a suspended tenant
- **THEN** the system sets status to `active` and all tenant users can log in again

### Requirement: Create tenant page
The system SHALL provide a form at `/platform/tenants/new` to create a standalone tenant (without onboarding wizard).

#### Scenario: Create minimal tenant
- **WHEN** Platform Admin fills in name, code, plan and submits
- **THEN** the system calls `POST /api/v1/tenants` and redirects to the new tenant's detail page

#### Scenario: Duplicate code rejected
- **WHEN** Platform Admin submits a code that already exists
- **THEN** the system displays a validation error "Tenant code already exists"

### Requirement: Platform Admin default route
The system SHALL redirect `platform_admin` users who log in to `/platform/dashboard` instead of `/dashboard`.

#### Scenario: Login redirect for platform admin
- **WHEN** a user with role `platform_admin` successfully authenticates
- **THEN** the system redirects to `/platform/dashboard`
