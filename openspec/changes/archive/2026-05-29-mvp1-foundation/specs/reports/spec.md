## ADDED Requirements

### Requirement: Tenant/store dashboard metrics
The system SHALL provide a dashboard endpoint returning key operational metrics filtered by tenant and optionally by store.

#### Scenario: Dashboard for store manager
- **WHEN** store manager calls `GET /api/v1/reports/dashboard?storeId=:id`
- **THEN** the system returns `{ activeContracts, totalOutstanding, disbursedToday, collectedToday, nearDueCount, overdueCount, assetsHeld }` for that store within the tenant

#### Scenario: Dashboard for tenant admin
- **WHEN** Tenant Admin calls `GET /api/v1/reports/dashboard` without storeId
- **THEN** the system aggregates metrics across all stores in the tenant

### Requirement: Operational reports
The system SHALL provide filterable reports: contracts by period, collections, outstanding balance, overdue contracts, by-store, by-staff, assets held.

#### Scenario: Overdue contracts report
- **WHEN** `GET /api/v1/reports/overdue-contracts?startDate=&endDate=` is called
- **THEN** the system returns paginated overdue contracts with days overdue and estimated balance, filtered to tenant + allowed stores

#### Scenario: Collection report
- **WHEN** `GET /api/v1/reports/collections?startDate=&endDate=&storeId=` is called
- **THEN** the system returns total collected interest, fees, and principal for the period

### Requirement: Report access control
Reports SHALL be filtered to the user's `tenantId` and `allowedStoreIds`. Tenant Admin can see all stores; Store Manager sees only assigned stores.

#### Scenario: Store manager sees only their store data
- **WHEN** a store manager requests a tenant-wide report without store filter
- **THEN** the system automatically applies their `allowedStoreIds` filter
