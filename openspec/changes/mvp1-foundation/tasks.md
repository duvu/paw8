## 1. Repo & Monorepo Scaffold

- [x] 1.1 Initialize pnpm workspace with `apps/` and `libs/` directories; add root `package.json` with workspaces config
- [x] 1.2 Scaffold NestJS app at `apps/api-gateway` with `@nestjs/cli`; configure `tsconfig`, `eslint`, `prettier`
- [x] 1.3 Add Docker Compose with PostgreSQL 16 and MinIO services for local dev
- [x] 1.4 Create root `.env.example` with all required env vars: DATABASE_URL, MINIO_*, JWT_*, APP_PORT
- [x] 1.5 Scaffold Next.js app at `apps/web` with TypeScript, App Router, and Tailwind CSS
- [x] 1.6 Scaffold Flutter app at `apps/mobile` with Riverpod, Dio, image_picker dependencies

## 2. Database Migrations & Seed

- [x] 2.1 Install TypeORM + pg driver in `apps/api-gateway`; configure `DataSource` with migrations path
- [x] 2.2 Create migration: `tenants`, `tenant_settings` tables with all fields from requirements
- [x] 2.3 Create migration: `stores`, `users`, `roles`, `user_roles`, `user_store_assignments` tables
- [x] 2.4 Create migration: `customers`, `customer_documents` tables with `UNIQUE(tenant_id, identity_number)` and `UNIQUE(tenant_id, phone)`
- [x] 2.5 Create migration: `assets`, `asset_inventory` tables
- [x] 2.6 Create migration: `pawn_contracts`, `contract_assets`, `contract_status_history`, `contract_sequences` tables
- [x] 2.7 Create migration: `contract_transactions`, `contract_extensions`, `payment_receipts` tables
- [x] 2.8 Create migration: `files`, `audit_logs` tables
- [x] 2.9 Add all recommended indexes from requirements doc (tenant_id, store_id, status, due_date combos)
- [x] 2.10 Write seed script: one tenant, one store, one user per role with hashed passwords

## 3. Common Infrastructure (libs/common)

- [x] 3.1 Create `libs/common` with shared DTOs, decorators, guards, interceptors
- [x] 3.2 Implement `CurrentUser` decorator that extracts user from JWT payload
- [x] 3.3 Implement `TenantGuard` that enforces `tenantId` comes from JWT (never from request)
- [x] 3.4 Implement `StoreScope` guard that validates request `store_id` ∈ `currentUser.allowedStoreIds`
- [x] 3.5 Implement `AuditInterceptor` that auto-inserts audit log rows for decorated endpoints
- [x] 3.6 Create base repository mixin that injects `tenant_id` into all TypeORM queries
- [x] 3.7 Add global exception filter with consistent error response shape
- [x] 3.8 Add global validation pipe with `class-validator` DTOs

## 4. Auth Module (libs/auth)

- [x] 4.1 Create `libs/auth` NestJS library module
- [x] 4.2 Implement `POST /api/v1/auth/login` with bcrypt password check and JWT issuance (RS256, payload: sub, tenantId, role, allowedStoreIds)
- [x] 4.3 Implement `POST /api/v1/auth/refresh` — validate refresh token, issue new access token
- [x] 4.4 Implement `POST /api/v1/auth/logout` — revoke refresh token (store invalidated tokens in DB)
- [x] 4.5 Implement `POST /api/v1/auth/change-password` — verify current password, update hash
- [x] 4.6 Write unit tests for login, refresh, logout, change-password

## 5. Tenants Module (libs/tenants)

- [x] 5.1 Create `libs/tenants` module with Tenant entity and repository
- [x] 5.2 Implement `POST /api/v1/tenants` (Platform Admin only) — create tenant
- [x] 5.3 Implement `GET /api/v1/tenants`, `GET /api/v1/tenants/:id` with pagination
- [x] 5.4 Implement `PATCH /api/v1/tenants/:id` — update tenant info
- [x] 5.5 Implement `PATCH /api/v1/tenants/:id/status` — activate/lock tenant; locked tenants block all user logins
- [x] 5.6 Write integration tests for tenant CRUD and lock enforcement

## 6. Stores Module (libs/stores)

- [x] 6.1 Create `libs/stores` module with Store entity
- [x] 6.2 Implement `POST /api/v1/stores`, `GET /api/v1/stores`, `GET /api/v1/stores/:id`, `PATCH /api/v1/stores/:id`
- [x] 6.3 Implement `PATCH /api/v1/stores/:id/manager` — assign manager
- [x] 6.4 Implement `POST /api/v1/stores/:id/staff` and `DELETE /api/v1/stores/:id/staff/:userId` — manage staff assignments
- [x] 6.5 Implement store lock/unlock; locked store blocks transaction creation
- [x] 6.6 Write integration tests including cross-tenant isolation assertion

## 7. Users & RBAC Module (libs/users)

- [x] 7.1 Create `libs/users` module with User, Role, UserRole entities
- [x] 7.2 Implement `POST /api/v1/users` — create user with role and optional store assignments
- [x] 7.3 Implement `GET /api/v1/users`, `GET /api/v1/users/:id`, `PATCH /api/v1/users/:id`
- [x] 7.4 Implement `PATCH /api/v1/users/:id/status` — lock/unlock user
- [x] 7.5 Implement role-based guards for all endpoints (Platform Admin, Tenant Admin, Store Manager, Staff)
- [x] 7.6 Write unit tests for role guard logic and store-scope enforcement

## 8. Customers Module (libs/customers)

- [x] 8.1 Create `libs/customers` module with Customer entity
- [x] 8.2 Implement `POST /api/v1/customers` with duplicate CCCD and phone detection within tenant
- [x] 8.3 Implement `GET /api/v1/customers` with search by name/phone/identity_number (tenant-scoped, paginated)
- [x] 8.4 Implement `GET /api/v1/customers/:id`, `PATCH /api/v1/customers/:id`
- [x] 8.5 Implement `GET /api/v1/customers/:id/contracts` — contract history
- [x] 8.6 Write integration tests for duplicate detection and cross-tenant isolation

## 9. Assets Module (libs/assets)

- [x] 9.1 Create `libs/assets` module with Asset and AssetInventory entities
- [x] 9.2 Implement `POST /api/v1/assets`, `GET /api/v1/assets`, `GET /api/v1/assets/:id`, `PATCH /api/v1/assets/:id`
- [x] 9.3 Implement asset search by IMEI, license plate, serial number (tenant-scoped)
- [x] 9.4 Implement `PATCH /api/v1/assets/:id/inventory` — update storage location
- [x] 9.5 Implement asset status transitions (holding → redeemed/overdue/pending_liquidation)
- [x] 9.6 Write integration tests for asset CRUD and status lifecycle

## 10. Pawn Contracts Module (libs/contracts)

- [x] 10.1 Create `libs/contracts` module with PawnContract, ContractAsset, ContractStatusHistory entities
- [x] 10.2 Implement contract code generation: `{store_code}-{YYYYMM}-{seq}` with advisory lock on `contract_sequences`
- [x] 10.3 Implement `POST /api/v1/contracts` — create contract, trigger disbursement, set asset status to `holding`
- [x] 10.4 Implement `GET /api/v1/contracts` with filters (status, store, customer, date range, pagination)
- [x] 10.5 Implement `GET /api/v1/contracts/:id` — full detail with assets, customer, transaction history
- [x] 10.6 Implement `GET /api/v1/contracts/:id/settlement-preview` — calculate interest to today
- [x] 10.7 Implement scheduled job (NestJS `@Cron`) to transition contracts to `near_due` and `overdue`
- [x] 10.8 Write integration tests for contract creation, code uniqueness, and status transitions

## 11. Transactions Module (libs/transactions)

- [x] 11.1 Create `libs/transactions` module with ContractTransaction, ContractExtension entities
- [x] 11.2 Implement `POST /api/v1/contracts/:id/transactions` — record interest, fee, partial principal payments
- [x] 11.3 Implement `POST /api/v1/contracts/:id/extend` — collect interest/fee, update due_date, record extension
- [x] 11.4 Implement `POST /api/v1/contracts/:id/settle` — full settlement flow with atomic DB transaction
- [x] 11.5 Implement `POST /api/v1/contracts/:id/transactions/:txId/void` (Tenant Admin+ only) — void transaction
- [x] 11.6 Verify no UPDATE/DELETE routes exist for `contract_transactions` table
- [x] 11.7 Write integration tests: disbursement, interest collection, extension, settlement, void; assert append-only

## 12. Files Module (libs/files)

- [x] 12.1 Create `libs/files` module; configure MinIO client (`@aws-sdk/client-s3` or `minio` package)
- [x] 12.2 Implement `POST /api/v1/files/presigned-upload` — validate permissions, generate objectKey, return presigned PUT URL
- [x] 12.3 Implement `POST /api/v1/files/confirm` — validate objectKey tenant prefix, insert `files` record
- [x] 12.4 Implement `GET /api/v1/files/:id/download-url` — check tenant + store scope, return presigned GET URL
- [x] 12.5 Implement cron job: scan MinIO for orphaned objects (>24h, no `files` record) and delete
- [x] 12.6 Write integration tests for upload flow, cross-tenant block, and orphan cleanup

## 13. Reports Module (libs/reports)

- [x] 13.1 Create `libs/reports` module
- [x] 13.2 Implement `GET /api/v1/reports/dashboard` — metrics filtered by tenant + allowedStoreIds
- [x] 13.3 Implement `GET /api/v1/reports/overdue-contracts` with date range + store filters
- [x] 13.4 Implement `GET /api/v1/reports/collections` — total collected by period/store
- [x] 13.5 Implement `GET /api/v1/reports/outstanding-balance` — current dư nợ report
- [x] 13.6 Implement `GET /api/v1/reports/assets-held` — assets currently in holding status
- [x] 13.7 Enforce store-scope on all reports (store managers auto-filtered to allowedStoreIds)

## 14. Audit Module (libs/audit)

- [x] 14.1 Create `libs/audit` module with AuditLog entity (no UPDATE/DELETE endpoints)
- [x] 14.2 Wire `AuditInterceptor` to log all required business events (from spec)
- [x] 14.3 Implement `GET /api/v1/audit-logs` with filters; Tenant Admin+ only
- [x] 14.4 Write tests asserting audit entries created for contract creation, void, login, login_failed

## 15. Next.js Web Portal

- [x] 15.1 Configure Next.js middleware for auth check and role-based redirect on login
- [x] 15.2 Create shared API client (wraps fetch with JWT header injection and token refresh)
- [x] 15.3 Implement Platform Admin screens: tenant list, create/edit tenant, lock/unlock, create tenant owner
- [x] 15.4 Implement Tenant Admin screens: dashboard, store management, user management
- [x] 15.5 Implement customer list, create, detail screens (with CCCD duplicate warning)
- [x] 15.6 Implement asset create screen with photo upload via presigned URL
- [x] 15.7 Implement contract create workflow: customer search → asset entry → loan terms → submit
- [x] 15.8 Implement contract detail screen: info, assets, transaction history, action buttons
- [x] 15.9 Implement collect interest/fee, extend contract, settle contract flows
- [x] 15.10 Implement due-soon and overdue contract list screens
- [x] 15.11 Implement reports screens: dashboard, overdue, collections, assets held
- [x] 15.12 Implement audit log screen (Tenant Admin+)
- [x] 15.13 Add receipt/contract PDF export (use `@react-pdf/renderer` or server-side PDF)

## 16. Flutter Mobile App

- [x] 16.1 Set up Riverpod providers and Dio HTTP client with JWT interceptor + token refresh
- [x] 16.2 Implement login screen with secure JWT storage (`flutter_secure_storage`)
- [x] 16.3 Implement home/dashboard screen showing personal stats
- [x] 16.4 Implement customer search screen (by name/phone/CCCD)
- [x] 16.5 Implement contract search screen (by code/customer/status)
- [x] 16.6 Implement contract detail screen (read-only)
- [x] 16.7 Implement due-soon and overdue contract list screens
- [x] 16.8 Implement customer ID photo capture and upload (presigned URL flow)
- [x] 16.9 Implement asset photo capture and upload
- [x] 16.10 Implement asset detail screen (read-only)
- [x] 16.11 Add note/comment input for customer and contract

## 17. Integration Testing & Verification

- [x] 17.1 Write cross-tenant isolation tests for every module (assert tenant A cannot read tenant B data)
- [x] 17.2 Write store-scope tests (staff/manager cannot access unassigned store data)
- [x] 17.3 Write append-only tests for transactions (assert no UPDATE/DELETE routes exist)
- [x] 17.4 Write file permission tests (cross-tenant presigned URL requests return 403)
- [x] 17.5 Run full `typeorm migration:run` from clean DB; verify schema matches requirements
- [x] 17.6 Run seed script; verify login works for each role
- [x] 17.7 Perform end-to-end smoke test: create tenant → store → user → customer → asset → contract → collect interest → settle → verify audit log
