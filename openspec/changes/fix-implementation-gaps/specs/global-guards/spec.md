## ADDED Requirements

### Requirement: Global tenant isolation enforcement
The system SHALL enforce tenant isolation at the HTTP guard layer for all authenticated routes by registering `TenantGuard` as a global provider. All authenticated requests carrying a non-null `tenantId` in the JWT SHALL be rejected with HTTP 403 if the route's `:tenantId` param does not match the JWT `tenantId`. Platform admin users (JWT `tenantId` is null) SHALL bypass this check.

#### Scenario: Tenant mismatch is rejected
- **WHEN** an authenticated user with `tenantId = T1` accesses a route parameterised with `:tenantId = T2`
- **THEN** the API returns HTTP 403

#### Scenario: Platform admin bypasses tenant guard
- **WHEN** an authenticated platform admin (JWT `tenantId` is null) accesses any tenant-scoped route
- **THEN** the request is allowed through to the controller

#### Scenario: Same-tenant access is allowed
- **WHEN** an authenticated user with `tenantId = T1` accesses a route parameterised with `:tenantId = T1`
- **THEN** the request is allowed through to the controller

### Requirement: Global store-scope enforcement
The system SHALL enforce store-scope access at the HTTP guard layer for all authenticated routes by registering `StoreScopeGuard` as a global provider. Any authenticated request that includes a `storeId` in route params or request body SHALL be rejected with HTTP 403 if that `storeId` is not in the JWT `allowedStoreIds`, unless the user has a bypass role (`platform_admin`, `tenant_owner`, or `tenant_admin`).

#### Scenario: Unauthorized store access is rejected
- **WHEN** an authenticated user with `allowedStoreIds = [S1]` sends a request with `storeId = S2`
- **THEN** the API returns HTTP 403

#### Scenario: Bypass roles are not store-restricted
- **WHEN** an authenticated `tenant_admin` sends a request with any `storeId`
- **THEN** the request is allowed through to the controller

#### Scenario: Requests without storeId are not blocked by store guard
- **WHEN** an authenticated user sends a request with no `storeId` in params or body
- **THEN** the store guard allows the request through

### Requirement: Global audit interceptor with business event capture
The system SHALL register `AuditInterceptor` as a global interceptor. Controller actions decorated with `@Audit({ action, entityType })` SHALL produce an `audit_logs` row on every successful (non-error) response. The interceptor SHALL never throw or cause the primary response to fail. The following eight controller actions SHALL be decorated:
1. `POST /contracts` → action `CREATE_CONTRACT`, entityType `contract`
2. `POST /transactions` → action `RECORD_TRANSACTION`, entityType `transaction`
3. `POST /transactions/extend` → action `EXTEND_CONTRACT`, entityType `contract`
4. `POST /transactions/:id/void` → action `VOID_TRANSACTION`, entityType `transaction`
5. `PATCH /contracts/:id/status` → action `UPDATE_CONTRACT_STATUS`, entityType `contract`
6. `POST /customers` → action `CREATE_CUSTOMER`, entityType `customer`
7. `POST /files/confirm` → action `UPLOAD_FILE`, entityType `file`
8. `POST /auth/change-password` → action `CHANGE_PASSWORD`, entityType `user`

#### Scenario: Audited action produces a log row
- **WHEN** a staff user successfully creates a contract via `POST /contracts`
- **THEN** an `audit_logs` row is inserted with `action = 'CREATE_CONTRACT'`, the user's `tenant_id`, `user_id`, and `entity_type = 'contract'`

#### Scenario: Failed action does not produce a log row
- **WHEN** a request to `POST /contracts` returns an HTTP 400 validation error
- **THEN** no `audit_logs` row is inserted for that request

#### Scenario: Audit failure does not break the primary response
- **WHEN** the `audit_logs` insert fails (e.g., DB timeout)
- **THEN** the primary response is still returned successfully

### Requirement: Frontend auth contract alignment
All frontend clients (web and mobile) SHALL parse the authentication response using the field names emitted by the backend: `accessToken`, `refreshToken`, and `expiresIn`. Clients SHALL NOT use the snake_case aliases `access_token` or `refresh_token` when reading the login or refresh response body.

#### Scenario: Web login succeeds with correct token parsing
- **WHEN** the web client calls `POST /auth/login` and the backend returns `{ "accessToken": "...", "refreshToken": "...", "expiresIn": 900 }`
- **THEN** the web client stores the token and navigates to the dashboard

#### Scenario: Mobile login succeeds with correct token parsing
- **WHEN** the mobile client calls `POST /auth/login` and the backend returns `{ "accessToken": "...", "refreshToken": "...", "expiresIn": 900 }`
- **THEN** the mobile client stores the token in secure storage and navigates to the home screen

### Requirement: Web page endpoint alignment
All web pages SHALL call the backend API using the correct endpoint paths and query parameter names as implemented in the backend controllers:
- Reports: tabs map to `/reports/contracts`, `/reports/collections`, `/reports/outstanding`, `/reports/overdue`, `/reports/stores`, `/reports/staff`, `/reports/assets/inventory`; date filter params are `dateFrom` and `dateTo`
- Audit logs: calls `/audit/logs`
- Customer search: sends query param `query`

#### Scenario: Reports page loads store performance data
- **WHEN** a user navigates to the stores tab on the reports page
- **THEN** the web client fetches `/reports/stores` (not `/reports/by-store`)

#### Scenario: Audit log page loads data
- **WHEN** a user navigates to the audit logs page
- **THEN** the web client fetches `/audit/logs` (not `/audit-logs`)

#### Scenario: Customer search sends correct param
- **WHEN** a user types a search term on the customers page
- **THEN** the web client sends `?query=<term>` (not `?q=<term>`)

### Requirement: Schema and service SQL alignment
All service-layer SQL queries and enum comparisons SHALL use the column names and enum values as defined in the database migrations, not alternate names introduced in service code.

#### Scenario: Asset created with correct status
- **WHEN** a new asset is registered
- **THEN** its initial `status` in the database is `holding` (matching the `asset_status` enum in the migration)

#### Scenario: Contract extension records correct status history columns
- **WHEN** a contract is extended
- **THEN** the `contract_status_history` INSERT uses columns `to_status` and `created_at` (matching the migration schema)

#### Scenario: Void transaction uses correct reference column
- **WHEN** a transaction is voided
- **THEN** the void row's reference to the original transaction uses the `void_of_id` column (matching the migration schema)
