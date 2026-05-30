## 1. Schema / Service SQL Alignment (Backend)

- [x] 1.1 In `libs/assets/src/assets.service.ts`: change initial asset status insert from `'pawned'` to `'holding'`; change inventory status insert from `'in_store'` to `'in_storage'`
- [x] 1.2 In `libs/assets/src/dto/asset.dto.ts`: rename `AssetStatus.PAWNED = 'pawned'` to `HOLDING = 'holding'`; rename `AssetInventoryStatus.IN_STORE = 'in_store'` to `IN_STORAGE = 'in_storage'`
- [x] 1.3 In `libs/contracts/src/dto/contract.dto.ts`: rename `InterestType.TERM = 'term'` to `PER_PERIOD = 'per_period'`
- [x] 1.4 In `libs/contracts/src/contracts.service.ts`: update `status_history` INSERT to use correct column names (`from_status`, `to_status`, `note`, `changed_by`, `created_at` — replacing current `status`, `changed_at`)
- [x] 1.5 In `libs/transactions/src/transactions.service.ts`: update void transaction INSERT to use `void_of_id` column instead of `reference_transaction_id`; update contract settlement status history INSERT to use correct column names (same fix as 1.4)
- [x] 1.6 In `libs/transactions/src/transactions.service.ts`: update extension status history INSERT to use correct column names

## 2. API Health Endpoint

- [x] 2.1 Create `libs/common/src/health/health.controller.ts` with `GET /health` returning `{ status: 'ok', timestamp: new Date().toISOString() }` and `@Public()` decorator (or equivalent `IS_PUBLIC_KEY` metadata to skip JWT guard)
- [x] 2.2 Add `Public()` decorator to `libs/common/src/decorators/` (sets metadata key `IS_PUBLIC_KEY = 'isPublic'`)
- [x] 2.3 Update `libs/auth/src/strategies/jwt.strategy.ts` (or `AuthGuard`) to pass through when `IS_PUBLIC_KEY` metadata is `true` — implemented via `JwtAuthGuard` extending `AuthGuard('jwt')` with public-route bypass
- [x] 2.4 Register `HealthController` in `libs/common/src/index.ts` and export
- [x] 2.5 Import `HealthController` in `apps/api-gateway/src/app.module.ts`
- [x] 2.6 Verify `GET /api/v1/health` returns 200 without a token after build

## 3. Wire Global Guards & Interceptor

- [x] 3.1 In `apps/api-gateway/src/app.module.ts`: add `APP_GUARD` provider for `TenantGuard` (after `AuthGuard` order: JWT → Tenant → Roles → StoreScope)
- [x] 3.2 In `apps/api-gateway/src/app.module.ts`: add `APP_GUARD` provider for `StoreScopeGuard`
- [x] 3.3 In `apps/api-gateway/src/app.module.ts`: add `APP_INTERCEPTOR` provider for `AuditInterceptor`
- [x] 3.4 Ensure `TenantGuard`, `StoreScopeGuard`, `AuditInterceptor` are all exported from `libs/common/src/index.ts` and importable in `app.module.ts`
- [x] 3.5 Update `TenantGuard` bypass: check `!request.user?.tenantId` (null OR undefined) so platform admins and public routes both pass
- [x] 3.6 Verify the health endpoint still responds without auth after global guards are registered (public route bypass working)

## 4. Audit Decorators on High-Value Actions

- [x] 4.1 `libs/contracts/src/contracts.controller.ts`: add `@Audit({ action: 'CREATE_CONTRACT', entityType: 'contract' })` to `POST /contracts` handler
- [x] 4.2 `libs/contracts/src/contracts.controller.ts`: add `@Audit({ action: 'UPDATE_CONTRACT_STATUS', entityType: 'contract' })` to `PATCH /contracts/:id/status` handler
- [x] 4.3 `libs/transactions/src/transactions.controller.ts`: add `@Audit({ action: 'RECORD_TRANSACTION', entityType: 'transaction' })` to `POST /transactions` handler
- [x] 4.4 `libs/transactions/src/transactions.controller.ts`: add `@Audit({ action: 'EXTEND_CONTRACT', entityType: 'contract' })` to `POST /transactions/extend` handler
- [x] 4.5 `libs/transactions/src/transactions.controller.ts`: add `@Audit({ action: 'VOID_TRANSACTION', entityType: 'transaction' })` to `POST /transactions/:id/void` handler
- [x] 4.6 `libs/customers/src/customers.controller.ts`: add `@Audit({ action: 'CREATE_CUSTOMER', entityType: 'customer' })` to `POST /customers` handler
- [x] 4.7 `libs/files/src/files.controller.ts`: add `@Audit({ action: 'UPLOAD_FILE', entityType: 'file' })` to `POST /files/confirm` handler
- [x] 4.8 Update `libs/common/src/interceptors/audit.interceptor.ts`: ensure `entityId` is extracted from `response?.id ?? response?.contractId ?? response?.customerId ?? null`

## 5. Frontend Auth Contract Fix (Web)

- [x] 5.1 In `apps/web/contexts/auth.tsx`: in the `login()` method, change `res.data.access_token` to `res.data.accessToken` and `res.data.refresh_token` to `res.data.refreshToken`
- [x] 5.2 In `apps/web/contexts/auth.tsx`: in the `login()` method, update `storeSession({ accessToken: res.data.accessToken, refreshToken: res.data.refreshToken, expiresIn: res.data.expiresIn })`
- [x] 5.3 Verify web login flow with `pnpm build` — zero TypeScript errors

## 6. Frontend Auth Contract Fix (Mobile)

- [x] 6.1 In `apps/mobile/lib/features/auth/data/auth_repository.dart`: change `data['access_token']` to `data['accessToken']` and `data['refresh_token']` to `data['refreshToken']` in the login response parsing
- [x] 6.2 In `apps/mobile/lib/features/auth/data/auth_repository.dart`: update `AuthSession` construction to use `accessToken: data['accessToken']`, `refreshToken: data['refreshToken']`, `expiresIn: data['expiresIn']`
- [x] 6.3 Verify with `flutter analyze` — zero errors

## 7. Web Page Endpoint / Param Fixes

- [x] 7.1 In `apps/web/app/(dashboard)/reports/page.tsx`: already fixed in `responsive-tailwind-ui` — verify the tab endpoint map uses `/reports/stores`, `/reports/staff`, `/reports/assets/inventory` and params are `dateFrom`/`dateTo`; if any reverted, fix
- [x] 7.2 In `apps/web/app/(dashboard)/audit-logs/page.tsx`: already fixed — verify it calls `/audit/logs`; if reverted, fix
- [x] 7.3 In `apps/web/app/(dashboard)/customers/page.tsx`: already fixed — verify search sends `query`; if reverted, fix

## 8. Mobile Metadata Fix

- [x] 8.1 In `apps/mobile/pubspec.yaml`: description already updated to `"Secure mobile workspace for tenant-aware pawn operations."`

## 9. Verification

- [x] 9.1 Run `pnpm run build` in `apps/api-gateway` — zero TypeScript compilation errors
- [x] 9.2 Run `pnpm build` in `apps/web` — 18 routes compiled, zero errors
- [x] 9.3 Run `flutter analyze` in `apps/mobile` — zero errors, zero warnings
- [x] 9.4 Run `pnpm i18n:check` from root — all locale keys in parity
- [x] 9.5 Update this tasks.md: mark all completed tasks `[x]`
