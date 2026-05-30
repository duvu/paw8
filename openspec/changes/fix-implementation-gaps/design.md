## Context

The paw8 codebase has a complete backend and frontend implementation but several known mismatches between them that prevent the app from working correctly at runtime. These were discovered and documented during the `project-documentation` change but intentionally deferred. This change fixes them all.

Current broken/incomplete states:
- Web and mobile auth contexts expect `access_token` (snake_case) but the backend login returns `accessToken` (camelCase) — login silently fails on every frontend
- Web reports page calls `/reports/by-store`, `/reports/by-staff`, `/reports/inventory`; backend exposes `/reports/stores`, `/reports/staff`, `/reports/assets/inventory`
- Web audit logs page calls `/audit-logs`; backend route is `/audit/logs`
- Web customer search sends `q`; backend DTO expects `query`
- `TenantGuard`, `StoreScopeGuard` exist in `libs/common` but are never registered — tenant isolation relies entirely on individual service-layer SQL filtering
- `AuditInterceptor` exists but is never registered — only auth events (`LOGIN`, `LOGOUT`, etc.) are audited; business events (create contract, collect, settle, void, upload) are not
- Migration enums and service SQL use different names for `asset_status`, `asset_inventory_status`, `interest_type`, contract history columns, and transaction reference column — the app works now only because PostgreSQL is permissive about implicit casts in some cases, but this will cause silent data integrity issues
- No `/health` endpoint — cannot health-check the API in any deployment
- `apps/mobile/pubspec.yaml` description is still the Flutter scaffold default

## Goals / Non-Goals

**Goals:**
- All frontend clients correctly authenticate using the backend's actual response contract
- All web pages call the correct backend endpoints and send the correct query parameters
- `TenantGuard` is wired globally so every authenticated request has tenant isolation enforced at the HTTP layer, not just at the service layer
- `StoreScopeGuard` is wired globally so store-scoped mutations are protected at the HTTP layer
- `AuditInterceptor` is wired globally with `@Audit` on the 8 highest-value actions: create contract, record transaction, extend contract, settle, void transaction, create customer, confirm file upload, update contract status
- Schema/service SQL naming is aligned via a new migration and service code updates
- API has a `/health` liveness endpoint
- All fixes are verified: NestJS build passes, Next.js build passes, Flutter analyze passes

**Non-Goals:**
- Not adding new business features
- Not changing any API contracts or DB schema structure (only fixing naming alignment)
- Not adding comprehensive audit coverage for every action — only the 8 highest-value ones
- Not implementing cookie-based session or other auth architecture changes
- Not fixing the `Button asChild` limitation in the web component library
- Not fixing the `MoreMenu` CSS toggle approach

## Decisions

**D1: Register guards and interceptor as global providers in `AppModule`, not per-controller.**

Rationale: Adding `@UseGuards` to each of the 11 controllers individually is error-prone — future controllers would default to unprotected. Global registration via `APP_GUARD` and `APP_INTERCEPTOR` in the `providers` array guarantees everything is covered. Guards run in registration order: `AuthGuard('jwt')` first, then `TenantGuard`, then `RolesGuard`, then `StoreScopeGuard`. `AuditInterceptor` runs after the response is generated.

Bypass rules already in the guards:
- `TenantGuard`: passes if `request.user.tenantId` is null (platform_admin)
- `StoreScopeGuard`: passes if user is `platform_admin`, `tenant_owner`, or `tenant_admin`; passes if no `storeId` is present in request

**D2: Fix frontend token field via a single source-of-truth constant, not scattered string literals.**

Rationale: The bug exists because web `auth.tsx` and mobile `auth_repository.dart` hardcoded `access_token` while the backend emits `accessToken`. Both already use storage helpers (`auth-storage.ts` on web, `session.dart` on mobile) that define the storage key. The fix is to update the response field being read in each auth context — one change per frontend. No new abstraction needed.

**D3: Fix schema/service mismatches via a corrective migration + service code update.**

The mismatches are:
- `asset_status` migration values: `holding` (not `pawned`); service code uses `pawned` → fix service to use `holding`; same for `redeemed` (matches), `overdue` (matches), `pending_liquidation` (matches), `liquidated` (matches)
- `asset_inventory_status` migration values: `in_storage` (not `in_store`); fix service to use `in_storage`; `returned` (matches)
- `interest_type` migration values: `per_period` (not `term`); fix DTO enum and service references to use `per_period`
- `contract_status_history` migration columns: `from_status`, `to_status`, `note`, `changed_by`, `created_at`; service inserts `status` and `changed_at` as column names → fix service INSERT to use correct column names
- `contract_transactions` migration column: `void_of_id`; service inserts `reference_transaction_id` → fix service to use `void_of_id`

These are service-code fixes only. No new migration needed because the DB schema is already correct — only the application code has wrong column/value references.

**D4: `@Audit` decorators on the 8 highest-value actions only.**

Too many `@Audit` decorators increase noise and can slow writes. The 8 actions that matter most for a pawn-shop operations audit trail are:
1. `contracts.controller` POST (create contract) → `CREATE_CONTRACT`
2. `transactions.controller` POST (record transaction) → `RECORD_TRANSACTION`
3. `transactions.controller` POST /extend → `EXTEND_CONTRACT`
4. `transactions.controller` POST /:id/void → `VOID_TRANSACTION`
5. `contracts.controller` PATCH /:id/status → `UPDATE_CONTRACT_STATUS`
6. `customers.controller` POST (create customer) → `CREATE_CUSTOMER`
7. `files.controller` POST /confirm → `UPLOAD_FILE`
8. `auth.controller` POST /change-password → already audited in service; add interceptor decorator for completeness

**D5: `AuditInterceptor` reads entity ID from response body.**

The interceptor currently tries to get `entityId` from the response. The interceptor should look for `id` or `contractId` or `customerId` at the root of the JSON response. This works for all 8 target actions because each returns an object with `id` at the root.

## Risks / Trade-offs

- **Global `TenantGuard` may break platform-admin routes** → The guard already bypasses when `request.user.tenantId` is null. Platform admin users have `tenant_id = null` in DB, which means the JWT payload has `tenantId: null`. The bypass condition covers this.
- **Global `StoreScopeGuard` may block legitimate reads** → The guard already passes when no `storeId` is in the request. Most list/read operations don't send a `storeId` in params/body; they rely on service-layer filtering. This is the existing behavior.
- **Schema value fixes may surface latent DB rows with wrong values** → All existing seed data uses the correct migration-defined enum values (`holding`, `in_storage`, `per_period`). Service-layer bugs would only affect rows created since the last deployment. Because DB is still empty in dev, this is safe.
- **`AuditInterceptor` global registration adds a write on every successful response** → Only routes decorated with `@Audit(...)` trigger an actual DB insert; undecorated routes pass through without a write. Risk is low.

## Migration Plan

1. Fix service-layer SQL in `libs/contracts`, `libs/transactions`, `libs/assets` (schema alignment fixes — no DB migration needed)
2. Fix frontend auth token field in `apps/web/contexts/auth.tsx` and `apps/mobile/lib/features/auth/data/auth_repository.dart`
3. Fix web page endpoint/param bugs in `reports/page.tsx`, `audit-logs/page.tsx`, `customers/page.tsx`
4. Add `APP_GUARD` / `APP_INTERCEPTOR` providers in `apps/api-gateway/src/app.module.ts`
5. Add `@Audit(...)` decorators to 8 controller actions
6. Add `/health` endpoint
7. Fix `pubspec.yaml` description
8. Run build + analyze + verify

Rollback: remove the `APP_GUARD` / `APP_INTERCEPTOR` entries from `app.module.ts` if global guards cause unexpected failures in integration tests.

## Open Questions

- None. All issues are clearly identified and the fixes are deterministic.
