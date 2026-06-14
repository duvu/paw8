# Tasks: platform-admin-portal

## Progress: 42/42 tasks complete

---

## Group 1: Database Migration

- [x] Create migration file `migrations/YYYYMMDDHHMMSS_add_tenant_plans.sql` with `tenant_plans` table (id, tenant_id FK, plan_code, max_stores, max_users, features jsonb, effective_from, created_at) and index `(tenant_id)`
- [x] Add `suspended` to `TenantStatus` enum in `libs/tenants/src/dto/tenant.dto.ts` and ensure DB column allows the value
- [x] Add `grace_period_days` column to `tenants` table with default 3 (migration alter table)
- [x] Verify migration runs cleanly: `npm run migration:run` exits 0

---

## Group 2: Backend — Tenants Module Additions

- [x] Add `POST /api/v1/tenants/onboard` endpoint to `TenantsController` decorated `@Roles('platform_admin')` — calls new `TenantsService.onboard()` method
- [x] Implement `TenantsService.onboard(dto: OnboardTenantDto)` in a single DB transaction: INSERT tenant → INSERT user (owner) → INSERT user_roles(owner role) → INSERT user_store_assignments if store provided → audit log `action='tenant_onboarded'`; rollback all on any failure
- [x] Create `OnboardTenantDto`: tenant fields (name, code, plan, max_stores, max_users, trial_end_date?) + owner fields (email, full_name, password, phone?)
- [x] Add `POST /api/v1/tenants/:id/owner` endpoint decorated `@Roles('platform_admin')` — calls `TenantsService.setOwner(tenantId, dto)`; return 409 if tenant already has a user with `owner` role
- [x] Add `GET /api/v1/tenants/:id/usage` endpoint `@Roles('platform_admin')` — returns `{ stores: { current: number, max: number }, users: { current: number, max: number } }`
- [x] Implement `TenantsService.getUsage(tenantId)`: COUNT stores WHERE tenant_id AND status != 'inactive', COUNT users WHERE tenant_id AND status != 'locked'

---

## Group 3: Backend — Platform Module

- [x] Create `libs/platform/` directory with `platform.module.ts`, `platform.service.ts`, `platform.controller.ts`, `platform.repository.ts`
- [x] Implement `PlatformRepository.getStats()`: aggregate query returning `{ tenants: { total, active, suspended, trial }, stores: { total }, contracts: { active, totalPrincipal }, expiringSoon: { count, tenants[] } }` — expiringSoon = trial tenants where `trial_end_date` within 7 days
- [x] Implement `PlatformController.getStats()`: `GET /api/v1/platform/stats` decorated `@Roles('platform_admin')` — calls `PlatformService.getStats()`
- [x] Implement `PlatformRepository.getRecentActivity()`: SELECT 10 most recent audit_logs WHERE action IN platform-level actions (tenant_created, tenant_suspended, tenant_onboarded, trial_expired) ORDER BY created_at DESC
- [x] Add `GET /api/v1/platform/activity` endpoint `@Roles('platform_admin')` returning recent activity feed array
- [x] Register `PlatformModule` in `apps/api-gateway/src/app.module.ts` imports array

---

## Group 4: Backend — Plan Enforcement Guard

- [x] Create `libs/common/src/guards/plan-limit.guard.ts` implementing `CanActivate` — injects `TenantsService`, reads `currentUser.tenantId`, calls `getUsage()`, compares vs tenant `max_stores`/`max_users`; returns 403 with `{ code: 'PLAN_LIMIT_REACHED', message: '...' }` when at/over limit
- [x] Apply `PlanLimitGuard` to `StoresController.create()` in `libs/stores/src/stores.controller.ts`
- [x] Apply `PlanLimitGuard` to `UsersController.create()` in `libs/users/src/users.controller.ts`
- [x] Export `PlanLimitGuard` from `libs/common/src/index.ts`

---

## Group 5: Backend — Trial Expiry Scheduler

- [x] Create `libs/platform/src/trial-expiry.service.ts` with `@Injectable()` class implementing `@Cron('0 2 * * *')` (daily 02:00 UTC) method `expireTrials()`
- [x] Implement `expireTrials()`: query tenants WHERE status='trial' AND `trial_end_date + grace_period_days < now()`; for each: call `TenantsService.setStatus(id, 'suspended')`; insert audit log `{ user_id: 'system', action: 'trial_expired', entity_type: 'tenant', entity_id: id }`
- [x] Register `TrialExpiryService` in `PlatformModule` providers

---

## Group 6: Backend — Auth: Block Suspended Tenant Login

- [x] In `libs/auth/src/auth.service.ts` `login()` method: add check for `tenant.status === 'suspended'` alongside existing `'locked'` check; throw `ForbiddenException('Tenant account suspended')` with HTTP 403

---

## Group 7: Frontend — Route Structure & Navigation

- [x] Create `apps/web/app/(platform-admin)/layout.tsx` — dedicated layout with platform-admin sidebar nav (links: Dashboard → `/platform/dashboard`, Tenants → `/platform/tenants`); no tenant-data sidebar items; applies only to `platform_admin` role via middleware
- [x] Create `apps/web/app/(platform-admin)/platform/layout.tsx` if nested layout needed, OR ensure the route group layout handles `/platform/*`
- [x] Update `apps/web/lib/role-access.ts` `getDefaultRouteForRole()`: return `/platform/dashboard` for `platform_admin` instead of `/dashboard`
- [x] Update `apps/web/middleware.ts` (or equivalent auth middleware): ensure `/platform/*` routes require `platform_admin` role; redirect other roles away
- [x] Update `apps/web/app/login/page.tsx` or login redirect logic: `platform_admin` lands at `/platform/dashboard` post-login (should flow through `getDefaultRouteForRole` fix above — verify)

---

## Group 8: Frontend — Platform Dashboard

- [x] Create `apps/web/app/(platform-admin)/platform/dashboard/page.tsx` — server component fetching `/api/v1/platform/stats`; renders 4 stat cards (tenants breakdown, stores total, active contracts + principal, expiring-soon count); renders recent activity table (10 rows)
- [x] Create `apps/web/lib/api/platform.ts` with typed API client functions: `getPlatformStats()`, `getPlatformActivity()`

---

## Group 9: Frontend — Tenant List

- [x] Create `apps/web/app/(platform-admin)/platform/tenants/page.tsx` — server component; paginated table of tenants with columns: name, code, plan, status, stores, users, trial_end_date, actions (view, edit, toggle status); filter bar: search by name/code, filter by status/plan
- [x] Create `apps/web/lib/api/tenants-platform.ts` with: `listTenants(params)`, `getTenant(id)`, `createTenant(dto)`, `updateTenant(id, dto)`, `setTenantStatus(id, status)`, `getTenantUsage(id)`

---

## Group 10: Frontend — Tenant Detail & Edit

- [x] Create `apps/web/app/(platform-admin)/platform/tenants/[id]/page.tsx` — tenant detail page; shows tenant info, usage bar (stores used / max, users used / max), status badge with toggle button (suspend/activate), list of tenant's stores, link to edit
- [x] Create `apps/web/app/(platform-admin)/platform/tenants/[id]/edit/page.tsx` — edit form for tenant fields (name, plan, max_stores, max_users, trial_end_date, grace_period_days); PATCH to `/api/v1/tenants/:id`

---

## Group 11: Frontend — Tenant Create (Simple)

- [x] Create `apps/web/app/(platform-admin)/platform/tenants/new/page.tsx` — simple create form (name, code, plan, max_stores, max_users, trial_end_date); POST to `/api/v1/tenants`; redirect to detail on success

---

## Group 12: Frontend — Onboarding Wizard

- [x] Create `apps/web/app/(platform-admin)/platform/tenants/onboard/page.tsx` — 3-step wizard component:
  - Step 1: Tenant details (name, code, plan, max_stores, max_users, trial_end_date)
  - Step 2: Owner account (email, full_name, password, phone)
  - Step 3: Review & confirm summary before submit
- [x] Implement wizard submit: POST to `/api/v1/tenants/onboard`; on success redirect to `/platform/tenants/:id`; on error show inline error with rollback note
- [x] Add "Onboard New Tenant" button/link on tenant list page pointing to `/platform/tenants/onboard`

---

## Group 13: Types & API Client

- [x] Create `apps/web/types/platform.ts` with interfaces: `PlatformStats`, `TenantUsage`, `PlatformActivity`, `OnboardTenantRequest`
- [x] Ensure all API client functions in `platform.ts` and `tenants-platform.ts` use proper TypeScript types (no `any`)

---

## Group 14: Testing

- [x] Write e2e test `apps/api-gateway/test/platform-admin.e2e-spec.ts`: test `GET /platform/stats` requires `platform_admin` role (401 for unauthenticated, 403 for staff)
- [x] Write e2e test for `POST /tenants/onboard`: success creates tenant + owner atomically; failure (duplicate code) returns error and leaves no partial data
- [x] Write unit test for `TrialExpiryService.expireTrials()`: mock tenants at expiry, assert `setStatus('suspended')` called and audit log inserted
- [x] Write unit test for `PlanLimitGuard`: at-limit returns 403; below-limit passes; `platform_admin` role bypasses guard
