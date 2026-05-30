## Why

The codebase has a set of documented but unfixed inconsistencies between the implemented backend schema/services and the frontend clients, leaving the app partially broken at runtime: authentication fails because token field names mismatch, several web pages call wrong API routes, and key security/audit middleware exists in `libs/common` but is never wired, meaning tenant isolation and audit coverage are weaker than intended.

## What Changes

- Fix frontend auth contract: align web and mobile to parse `accessToken` / `refreshToken` / `expiresIn` from the backend login and refresh responses
- Fix web report page endpoint paths (`/reports/stores`, `/reports/staff`, `/reports/assets/inventory`) and query params (`dateFrom` / `dateTo`)
- Fix web audit-logs page endpoint path (`/audit/logs`)
- Fix web customer search query param (`query` not `q`)
- Wire `TenantGuard` globally in `AppModule` so all routes enforce tenant-from-JWT isolation
- Wire `StoreScopeGuard` globally in `AppModule` so store-scoped routes enforce `allowedStoreIds`
- Register `AuditInterceptor` globally so business events beyond auth are captured
- Add `@Audit(...)` decorators to the high-value controller actions (create contract, record transaction, extend contract, settle, void, create customer, upload file)
- Fix migration/service SQL naming mismatches: align `asset_status` enum values, `asset_inventory_status` values, `interest_type` enum values, `contract_status_history` column names, and `contract_transactions` reference column name
- Add a `/health` endpoint to the API
- Fix `pubspec.yaml` description (still says "A new Flutter project.")

## Capabilities

### New Capabilities

- `api-health`: GET `/api/v1/health` liveness endpoint
- `global-guards`: TenantGuard + StoreScopeGuard registered globally; AuditInterceptor registered globally with `@Audit` decorators on critical controller actions

### Modified Capabilities

- None. (All changes are implementation fixes; no spec-level requirement changes.)

## Impact

- `apps/web/contexts/auth.tsx` — token field name fix
- `apps/web/lib/api.ts` — token storage key consistency
- `apps/web/app/(dashboard)/reports/page.tsx` — endpoint + param fix
- `apps/web/app/(dashboard)/audit-logs/page.tsx` — endpoint fix
- `apps/web/app/(dashboard)/customers/page.tsx` — query param fix
- `apps/mobile/lib/features/auth/data/auth_repository.dart` — token field name fix
- `apps/mobile/lib/core/api/api_client.dart` — storage key consistency
- `apps/mobile/lib/core/router/router.dart` — storage key consistency
- `apps/api-gateway/src/app.module.ts` — global guard + interceptor registration
- `libs/common/src/guards/tenant.guard.ts` — minor: adjust bypass condition for clarity
- `libs/common/src/guards/store-scope.guard.ts` — minor: adjust bypass condition for clarity
- `libs/common/src/interceptors/audit.interceptor.ts` — minor: ensure it reads entity ID from response body
- `libs/contracts/src/contracts.controller.ts` — `@Audit` decorators
- `libs/transactions/src/transactions.controller.ts` — `@Audit` decorators
- `libs/customers/src/customers.controller.ts` — `@Audit` decorators
- `libs/files/src/files.controller.ts` — `@Audit` decorators
- `apps/api-gateway/src/database/migrations/` — new migration to fix enum values and column names
- `apps/mobile/pubspec.yaml` — description fix
- No DB data changes; migration is additive/rename-only
