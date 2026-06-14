## Context

The paw8 backend (NestJS) already has a functional `TenantsController` with CRUD + status endpoints gated by `@Roles('platform_admin')`. The web frontend (`apps/web`) provides a `(dashboard)` route group for tenant-internal personas (tenant_owner through staff) with sidebar navigation, role-gated pages, and i18n. However, **no UI exists for the Platform Admin persona** — the role type is recognized in `role-access.ts` and the backend guards work, but there are no pages that a platform admin would land on.

Current state:
- Backend: `libs/tenants/` — CRUD, pagination, status toggle. No owner-creation endpoint, no aggregate stats, no limit enforcement.
- Frontend: Single `(dashboard)` layout. `platform_admin` is in `adminRoles` but shares the same sidebar as tenant admins.
- Database: `tenants` table has `max_stores`, `max_users`, `trial_end_date` columns but no enforcement logic.
- Auth: JWT-based, role stored on user record, `RolesGuard` checks role string against `@Roles()` decorator.

## Goals / Non-Goals

**Goals:**

- Dedicated Platform Admin area in the web app with clean separation from tenant-facing dashboard.
- Full tenant lifecycle management UI (create, edit, view, lock/unlock, assign owner).
- Onboarding wizard that creates tenant + first store + tenant_owner user atomically.
- Backend enforcement of plan limits (`max_stores`, `max_users`) at entity creation time.
- Automated trial expiry handling via scheduled job.
- Platform-level dashboard with aggregate metrics.

**Non-Goals:**

- Self-service tenant signup (MVP1 is admin-provisioned only).
- Billing/payment integration (placeholder view only — no Stripe/payment gateway).
- Per-tenant custom domain or white-labeling.
- Data migration tools or tenant data export.
- Full subscription management (plan upgrades/downgrades with proration).

## Decisions

### 1. Separate route group `(platform-admin)` vs. embedding in `(dashboard)`

**Decision**: Create `apps/web/app/(platform-admin)/` as a sibling to `(dashboard)`.

**Rationale**: Platform Admin operates at a fundamentally different scope (cross-tenant, system-wide). Sharing a sidebar/layout with tenant-internal navigation creates confusion and coupling. Separate layout allows distinct nav items (Tenants, Platform Stats, System Config) without polluting tenant views.

**Alternative considered**: Adding platform-admin pages inside `(dashboard)` with conditional nav items. Rejected because: layout semantics diverge (no store selector, no tenant context in header), and it couples two personas that should evolve independently.

### 2. Tenant onboarding as a multi-step wizard (frontend) + single transaction (backend)

**Decision**: Frontend presents a 3-step wizard (tenant info → first store → owner user). Backend receives all data in one `POST /api/v1/tenants/onboard` request and executes in a DB transaction.

**Rationale**: Atomicity prevents orphan tenants (created but no store/owner). Wizard UX guides the admin through required fields without overwhelming a single form. If any step fails, the entire operation rolls back.

**Alternative considered**: Separate API calls for each entity. Rejected because partial failures leave inconsistent state requiring manual cleanup.

### 3. Plan enforcement via guards on store/user creation endpoints

**Decision**: Add a `PlanLimitGuard` (custom NestJS guard) applied to `POST /stores` and `POST /users` that queries current counts vs tenant limits.

**Rationale**: Guards intercept before the controller body executes, providing clean 403/409 responses. Keeps business logic out of individual service methods.

**Alternative considered**: Enforcement inside service `create()` methods. Viable but scatters plan logic across modules. Guard centralizes it.

### 4. Trial expiry via `@nestjs/schedule` CRON job

**Decision**: A scheduled task in `libs/tenants/` runs daily at 02:00 UTC. Queries tenants where `status = 'trial' AND trial_end_date + grace_period < now()` and sets status to `suspended`.

**Rationale**: Simple, no external scheduler dependency. `@nestjs/schedule` is already lightweight. Daily granularity is sufficient for trial management.

**Alternative considered**: Event-driven approach (emit event on each login, check expiry). Rejected because it only triggers on activity — silent tenants wouldn't get suspended.

### 5. Platform stats as a new lightweight module

**Decision**: Create `libs/platform/` module with a `PlatformStatsService` that runs aggregate queries across tenants/stores/contracts tables (no tenant_id filter — system-wide).

**Rationale**: These queries intentionally bypass tenant isolation (Platform Admin sees everything). Keeping this in a separate module makes the privilege escalation explicit and auditable. The controller is gated with `@Roles('platform_admin')`.

**Alternative considered**: Adding stats methods to existing `TenantsService`. Rejected because it conflates tenant-scoped operations with system-wide aggregation.

### 6. Frontend routing: `/platform/*` URL prefix

**Decision**: Platform Admin pages live at `/platform/tenants`, `/platform/dashboard`, `/platform/tenants/new`, etc.

**Rationale**: Clear URL namespace separation. No collision with `(dashboard)` routes which use `/dashboard`, `/customers`, etc. If Platform Admin accidentally navigates to a tenant route, the role guard redirects them.

## Risks / Trade-offs

- **[Performance] Aggregate stats queries on large datasets** → Mitigation: Use `COUNT(*)` with appropriate indexes (already have `idx_stores_tenant_status`, etc.). For MVP the table sizes are small. Add materialized view or cache if >10k tenants later.

- **[Security] Platform stats bypasses tenant isolation** → Mitigation: Strict `@Roles('platform_admin')` guard + audit log every access. Module is self-contained and easily removable.

- **[UX] Platform Admin has no tenant context** → Mitigation: When viewing a specific tenant's detail, show read-only summary of their stores/users/contracts. Do NOT allow Platform Admin to operate within a tenant's business data (no creating contracts on behalf of a tenant).

- **[Trial expiry race condition] Tenant pays right before suspension** → Mitigation: Add `grace_period_days` (default 3) to the expiry check. If billing is later integrated, the payment event clears `trial_end_date` entirely.

- **[Onboarding wizard failure UX]** → Mitigation: Backend returns specific error messages per step (e.g., "code already taken"). Frontend highlights the failing step and allows editing without re-entering completed steps.

## Open Questions

1. Should Platform Admin be able to "impersonate" a tenant (act-as) for support purposes? — Defer to a future change.
2. Should trial expiry send a notification email to tenant owner before suspending? — Defer to Month 5 (Notifications module).
3. Where should `grace_period_days` be stored — per-plan config or global system setting? — Propose global for MVP, per-plan later.
