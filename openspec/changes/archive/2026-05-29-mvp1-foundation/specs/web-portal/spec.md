## ADDED Requirements

### Requirement: Role-based portal routing
The Next.js app SHALL route authenticated users to the correct portal based on their role. Unauthenticated users SHALL be redirected to `/login`.

#### Scenario: Platform Admin login
- **WHEN** a user with role `platform_admin` logs in
- **THEN** they are redirected to `/platform/tenants`

#### Scenario: Staff login
- **WHEN** a user with role `staff` logs in
- **THEN** they are redirected to `/store/contracts`

#### Scenario: Unauthenticated access
- **WHEN** an unauthenticated user accesses any protected route
- **THEN** they are redirected to `/login`

### Requirement: Platform Admin screens
The web portal SHALL include: tenant list, create/edit tenant, lock/unlock tenant, create tenant owner.

#### Scenario: View tenant list
- **WHEN** Platform Admin visits `/platform/tenants`
- **THEN** they see a paginated list of all tenants with status, plan, and store/user counts

### Requirement: Tenant Admin/Manager screens
The web portal SHALL include: dashboard, store management, user management, customer list/detail, asset list/detail, contract list/detail, collection screens, reports, audit log.

#### Scenario: Contract detail view
- **WHEN** Tenant Admin or Store Manager navigates to `/contracts/:id`
- **THEN** they see contract info, linked customer, assets, transaction history, and available actions based on contract status

### Requirement: Staff screens
The web portal SHALL include: customer search/create, asset create + photo upload, contract create, collect interest/fee, extend contract, settle contract, print receipt.

#### Scenario: Create contract workflow
- **WHEN** staff navigates to `/contracts/new`
- **THEN** they can search/create customer, add assets, enter loan terms, and submit to create the contract and disbursement in one flow
