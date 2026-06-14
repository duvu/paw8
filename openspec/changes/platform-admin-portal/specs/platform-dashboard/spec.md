## ADDED Requirements

### Requirement: Platform dashboard with aggregate metrics
The system SHALL display a dashboard at `/platform/dashboard` showing system-wide metrics: total tenants (by status), total stores, total active contracts, total outstanding principal, and tenants expiring within 7 days.

#### Scenario: View platform dashboard
- **WHEN** Platform Admin opens `/platform/dashboard`
- **THEN** the system displays cards showing: Total Tenants, Active Tenants, Suspended Tenants, Trial Tenants, Total Stores, Total Active Contracts, Total Outstanding Principal, Tenants Expiring Soon (within 7 days)

#### Scenario: Dashboard data refreshes
- **WHEN** Platform Admin clicks refresh or navigates to the dashboard
- **THEN** the system fetches fresh aggregate data from `GET /api/v1/platform/stats`

### Requirement: Platform stats API endpoint
The system SHALL expose `GET /api/v1/platform/stats` (restricted to `platform_admin`) returning aggregate metrics across all tenants.

#### Scenario: Fetch platform stats
- **WHEN** Platform Admin calls `GET /api/v1/platform/stats`
- **THEN** the system returns JSON:
  ```json
  {
    "tenants": { "total": 12, "active": 8, "suspended": 2, "trial": 2 },
    "stores": { "total": 25 },
    "contracts": { "active": 342, "totalPrincipal": 5200000000 },
    "expiringSoon": { "count": 1, "tenants": [{ "id": "...", "name": "...", "trialEndDate": "..." }] }
  }
  ```

#### Scenario: Non-platform-admin rejected
- **WHEN** a user with role `tenant_admin` calls `GET /api/v1/platform/stats`
- **THEN** the system returns `403 Forbidden`

### Requirement: Recent activity feed
The platform dashboard SHALL display the 10 most recent platform-level audit events (tenant created, tenant suspended, owner assigned).

#### Scenario: View recent activity
- **WHEN** Platform Admin views the dashboard
- **THEN** the system shows the 10 most recent audit log entries filtered to platform-level actions (`tenant_created`, `tenant_suspended`, `tenant_activated`, `owner_assigned`, `trial_expired`)
