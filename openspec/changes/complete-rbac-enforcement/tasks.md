# Tasks: complete-rbac-enforcement

## Schema
spec-driven

## Apply Requires
tasks

## Progress
0/27 complete

---

## Group 1: Fix InterestPoliciesController (5 tasks)

- [x] 1.1 Read `libs/contracts/src/interest-policies.controller.ts` — confirm current `@UseGuards(AuthGuard('jwt'))` class-level, no `RolesGuard`
- [x] 1.2 Add `RolesGuard` import from `../../common/src` to `interest-policies.controller.ts`
- [x] 1.3 Replace class-level `@UseGuards(AuthGuard('jwt'))` with `@UseGuards(AuthGuard('jwt'), RolesGuard)`
- [x] 1.4 Add `@Roles()` to each method:
  - `GET /interest-policies` → `@Roles('tenant_owner','tenant_admin','store_manager','staff','accountant')`
  - `GET /interest-policies/:id` → `@Roles('tenant_owner','tenant_admin','store_manager','staff','accountant')`
  - `POST /interest-policies` → `@Roles('tenant_owner','tenant_admin')`
  - `PATCH /interest-policies/:id` → `@Roles('tenant_owner','tenant_admin')`
  - `POST /interest-policies/:id/set-default` → `@Roles('tenant_owner','tenant_admin')`
- [x] 1.5 `lsp_diagnostics libs/contracts/src/interest-policies.controller.ts` — expect 0 errors

---

## Group 2: Fix CustomersController (5 tasks)

- [x] 2.1 Read `libs/customers/src/customers.controller.ts` — confirm which endpoints lack `@Roles()`
- [x] 2.2 Add `@Roles('tenant_owner','tenant_admin','store_manager','staff','accountant')` to `GET /customers` (search)
- [x] 2.3 Add `@Roles('tenant_owner','tenant_admin','store_manager','staff','accountant')` to `GET /customers/:id`
- [x] 2.4 Add `@Roles('tenant_owner','tenant_admin','store_manager','staff','accountant')` to `GET /customers/:id/contracts`
- [x] 2.5 Add `@Roles('tenant_owner','tenant_admin','store_manager','staff')` to `POST /customers`
- [x] 2.6 Add `@Roles('tenant_owner','tenant_admin','store_manager','staff')` to `PATCH /customers/:id`
- [x] 2.7 `lsp_diagnostics libs/customers/src/customers.controller.ts` — expect 0 errors

---

## Group 3: Fix AssetsController (3 tasks)

- [x] 3.1 Read `libs/assets/src/assets.controller.ts` — confirm which GET endpoints lack `@Roles()`
- [x] 3.2 Add `@Roles('tenant_owner','tenant_admin','store_manager','staff','accountant')` to:
  - `GET /assets`
  - `GET /assets/:id`
  - `GET /assets/inventory`
- [x] 3.3 `lsp_diagnostics libs/assets/src/assets.controller.ts` — expect 0 errors

---

## Group 4: Fix ContractsController (3 tasks)

- [x] 4.1 Read `libs/contracts/src/contracts.controller.ts` — confirm `GET /`, `GET :id`, `GET :id/allowed-transitions` lack `@Roles()`
- [x] 4.2 Add `@Roles('tenant_owner','tenant_admin','store_manager','staff','accountant')` to:
  - `GET /contracts`
  - `GET /contracts/:id`
  - `GET /contracts/:id/allowed-transitions`
- [x] 4.3 `lsp_diagnostics libs/contracts/src/contracts.controller.ts` — expect 0 errors

---

## Group 5: Fix TransactionsController (3 tasks)

- [x] 5.1 Read `libs/transactions/src/transactions.controller.ts` — confirm `GET /contract/:contractId` and `POST /calculate-settlement` lack `@Roles()`
- [x] 5.2 Add `@Roles('tenant_owner','tenant_admin','store_manager','staff','accountant')` to:
  - `GET /transactions/contract/:contractId`
  - `POST /transactions/calculate-settlement`
- [x] 5.3 `lsp_diagnostics libs/transactions/src/transactions.controller.ts` — expect 0 errors

---

## Group 6: Fix FilesController (3 tasks)

- [x] 6.1 Read `libs/files/src/files.controller.ts` — confirm 4 endpoints lack `@Roles()`
- [x] 6.2 Add `@Roles()` to:
  - `POST /files/upload-url` → `@Roles('tenant_owner','tenant_admin','store_manager','staff')`
  - `POST /files/confirm` → `@Roles('tenant_owner','tenant_admin','store_manager','staff')`
  - `GET /files/:id/download-url` → `@Roles('tenant_owner','tenant_admin','store_manager','staff','accountant')`
  - `GET /files/entity/:entityType/:entityId` → `@Roles('tenant_owner','tenant_admin','store_manager','staff','accountant')`
- [x] 6.3 `lsp_diagnostics libs/files/src/files.controller.ts` — expect 0 errors

---

## Group 7: Fix UsersController and StoresController (3 tasks)

- [x] 7.1 Read `libs/users/src/users.controller.ts` — confirm `GET /users/:id` lacks `@Roles()`
- [x] 7.2 Add `@Roles('tenant_owner','tenant_admin','store_manager')` to `GET /users/:id`
- [x] 7.3 Read `libs/stores/src/stores.controller.ts` — confirm `GET /stores/:id` lacks `@Roles()`
- [x] 7.4 Add `@Roles('tenant_owner','tenant_admin','store_manager','staff','accountant')` to `GET /stores/:id`
- [x] 7.5 `lsp_diagnostics libs/users/src/users.controller.ts libs/stores/src/stores.controller.ts` — expect 0 errors

---

## Group 8: Full Verification (4 tasks)

- [x] 8.1 `tsc --noEmit` on `apps/api-gateway` — expect 0 source errors (pre-existing supertest errors in test/ are acceptable)
- [x] 8.2 Start server on port 3005:
  ```bash
  cd apps/api-gateway && DATABASE_URL=postgresql://paw8:paw8_dev_password@localhost:5433/paw8_dev \
  NODE_ENV=development APP_PORT=3005 \
  JWT_PRIVATE_KEY_PATH=/tmp/jwt.key JWT_PUBLIC_KEY_PATH=/tmp/jwt.pub \
  MINIO_ENDPOINT=localhost MINIO_PORT=9000 MINIO_ACCESS_KEY=minioadmin MINIO_SECRET_KEY=minioadmin MINIO_BUCKET=paw8 \
  SCHEDULER_ENABLED=false \
  npx ts-node -r tsconfig-paths/register src/main.ts &
  ```
- [x] 8.3 Test role enforcement:
  - Login as `platform@paw8.demo`/`Demo@123456` → get platform_admin JWT
  - `GET /api/v1/customers` with platform_admin JWT → expect **403** (platform_admin excluded from tenant endpoints)
  - Login as `staff@paw8.demo`/`Demo@123456` → get staff JWT
  - `GET /api/v1/customers` with staff JWT → expect **200**
  - `POST /api/v1/interest-policies` with staff JWT → expect **403**
  - Login as `admin@paw8.demo`/`Demo@123456` → get tenant_admin JWT
  - `POST /api/v1/interest-policies` with tenant_admin JWT → expect **201** or validation error (not 403)
- [x] 8.4 Mark all tasks.md checkboxes `[x]`
