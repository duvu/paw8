## Why

The backend already exposes tenant CRUD endpoints (`/api/v1/tenants`) locked to `platform_admin` role, but no frontend UI exists for this persona. Platform Admins currently must use raw API calls (Swagger/Postman) to manage tenants, create tenant owners, or monitor platform health. This blocks any real multi-tenant deployment because onboarding a new pawn shop tenant requires manual DB/API intervention.

## What Changes

- New Next.js route group `(platform-admin)` with its own layout, sidebar, and auth guard scoped exclusively to `platform_admin` role.
- Tenant management screens: list, create, detail/edit, lock/unlock, assign tenant owner.
- Onboarding wizard: guided flow to create tenant → first store → first user (tenant_owner) in a single multi-step form.
- Plan enforcement API: backend guards that reject store/user creation when tenant exceeds `max_stores`/`max_users`.
- Trial expiry scheduler: background job that auto-suspends tenants past `trial_end_date` + grace period.
- Platform health dashboard: aggregate stats (tenant count, active/suspended breakdown, total stores, total contracts system-wide).
- New backend endpoints: `POST /api/v1/tenants/:id/owner` (create tenant owner user), `GET /api/v1/platform/stats` (aggregate metrics), `GET /api/v1/tenants/:id/usage` (current store/user counts vs limits).

## Capabilities

### New Capabilities

- `platform-admin-ui`: Next.js route group, layout, sidebar, and role-gated pages for Platform Admin persona
- `tenant-onboarding`: Multi-step wizard (tenant + first store + tenant owner) with backend transaction
- `plan-enforcement`: Backend guards enforcing `max_stores` and `max_users` limits at creation time
- `trial-expiry`: Scheduled job to auto-suspend tenants past `trial_end_date` + configurable grace period
- `platform-dashboard`: System-wide aggregate statistics for Platform Admin view

### Modified Capabilities

_(none — no existing spec-level requirements are changing)_

## Impact

- **Frontend**: New `apps/web/app/(platform-admin)/` route group with ~6 pages. Shared UI components reused from `components/ui/`.
- **Backend**: New endpoints in `libs/tenants/` (owner assignment, usage stats). New `libs/platform/` module for aggregate stats. Guards added to `libs/stores/` and `libs/users/` for limit enforcement. New CRON job in `libs/tenants/` for trial expiry.
- **Database**: New `tenant_plans` table (plan name, limits, features JSON). Migration to move `max_stores`/`max_users` into plan reference. Add `grace_period_days` column to tenants or plan config.
- **Auth**: Platform Admin detection already works via `@Roles('platform_admin')`. Frontend needs route-level guard redirecting non-platform-admins away from `(platform-admin)` group.
- **Dependencies**: `@nestjs/schedule` for CRON (trial expiry). No new frontend deps beyond existing stack.
