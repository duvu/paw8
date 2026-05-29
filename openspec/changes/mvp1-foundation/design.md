## Context

paw8 starts with zero application code. The full requirements are in `docs/mvp1-requirements.md`. The system must be multi-tenant from day one: shared PostgreSQL database/schema with `tenant_id` isolation, a single private MinIO bucket with `tenants/{tenant_id}/...` key prefixes, and a NestJS modular monolith that is microservice-ready.

Current state: repo contains only requirements doc, OpenSpec/OpenCode config, and planning tooling.

## Goals / Non-Goals

**Goals:**
- Scaffold and implement all MVP1 backend modules (auth, tenants, stores, users-rbac, customers, assets, pawn-contracts, transactions, files, reports, audit)
- PostgreSQL schema with `tenant_id` on every business table, indexed correctly, with migration files
- MinIO file flow: presigned upload URL → client direct upload → confirm → metadata in PostgreSQL
- JWT auth where `tenant_id` is always derived from token — never accepted from request body/query
- Store-scope enforcement: `currentUser.allowedStoreIds` filters all store-level queries
- Append-only financial transactions (no UPDATE/DELETE on `contract_transactions`)
- Next.js web portal scaffolded with role-based screen routing
- Flutter mobile app scaffolded with login, search, and photo upload
- All API routes versioned under `/api/v1/`
- Seed data: one tenant, one store, one user per role
- Basic audit logging middleware wired to all sensitive operations

**Non-Goals (MVP1 exclusions per requirements):**
- eKYC/OCR, SMS/Zalo, bank payment, VietQR
- Full double-entry accounting
- Asset liquidation workflow
- Multi-level approval
- POS/receipt printer
- Mobile offline mode
- Data warehouse/BI
- Physical microservice split
- Subscription/billing

## Decisions

### D1: NestJS Modular Monolith with Nx or pnpm workspaces

**Decision:** Use a single NestJS app (`apps/api-gateway`) with domain libraries (`libs/*`) using **pnpm workspaces** (no Nx overhead for MVP1).

**Rationale:** Keeps the repo simple for MVP1 while enforcing domain boundaries through import paths. `libs/` modules can later be extracted to separate services. Nx adds complexity not justified at this scale.

**Alternative considered:** Nx monorepo — rejected: too much tooling overhead for a greenfield single-team project at MVP1 stage.

---

### D2: Database ORM — TypeORM with NestJS

**Decision:** Use **TypeORM** with NestJS's built-in `@nestjs/typeorm`.

**Rationale:** Native NestJS integration, decorator-based entities map well to the data model, migration support is built-in (`typeorm migration:generate`, `migration:run`). Widely used in the NestJS ecosystem.

**Alternative considered:** Prisma — good DX but requires a separate schema file; TypeORM stays closer to NestJS conventions.

---

### D3: Tenant isolation strategy — `tenant_id` column on all business tables

**Decision:** Shared schema, shared database, `tenant_id` UUID on every business entity. Application-layer enforcement via a `TenantGuard` + `CurrentUser` decorator that injects `tenantId` into every service method.

**Rationale:** Simplest approach for MVP1 with a small number of tenants. No need for row-level security or separate schemas yet.

**Risk mitigation:** Every repository method in business modules must receive `tenantId` from `currentUser` — never from request params. Enforced by code review and a custom `@TenantAware()` guard that short-circuits requests with missing tenant context.

---

### D4: JWT structure

**Decision:** JWT payload includes: `{ sub: userId, tenantId, role, allowedStoreIds[] }`. Signed with RS256 (asymmetric) for future microservice verification without sharing the secret.

**Rationale:** Embedding `tenantId` and `allowedStoreIds` in the token avoids a DB lookup on every request. RS256 allows services to verify tokens with only the public key.

---

### D5: File upload flow — presigned URL pattern

**Decision:** Client requests presigned PUT URL from NestJS → NestJS validates tenant/permission → returns short-lived URL + generated `objectKey` → client uploads directly to MinIO → client calls `POST /files/confirm` → NestJS saves metadata to `files` table.

**Rationale:** Avoids routing binary file data through NestJS, reducing memory pressure and latency. Standard pattern for MinIO/S3.

---

### D6: Contract code generation

**Decision:** Contract codes use pattern `{store_code}-{YYYYMM}-{seq:05d}` where `seq` is a per-`(tenant_id, store_id, year_month)` atomic counter stored in a `contract_sequences` table with a DB-level advisory lock on increment.

**Rationale:** Requirements explicitly forbid a global sequential code. This approach is tenant/store/month-scoped, human-readable, and collision-safe.

---

### D7: Financial transaction immutability

**Decision:** `contract_transactions` table has no UPDATE/DELETE exposed anywhere in the codebase. Corrections use new rows with `transaction_type IN ('void', 'reversal', 'adjustment')` that reference the original `transaction_id`.

**Rationale:** Explicit requirement from `docs/mvp1-requirements.md` section 5.7. Required for audit trail integrity.

---

### D8: Next.js app structure

**Decision:** Single Next.js app with route-group-based role separation: `(platform-admin)`, `(tenant-admin)`, `(store-manager)`, `(staff)`. Role checked server-side in middleware.

---

### D9: Flutter app — minimal scope

**Decision:** Flutter app targets staff-only MVP1 screens. State management with **Riverpod**, HTTP with **Dio**, image capture with **image_picker**.

## Risks / Trade-offs

- [Risk] Missing `tenant_id` filter in a repository method exposes cross-tenant data → **Mitigation:** TypeORM query builder wrapper that auto-injects `tenant_id`; integration tests assert cross-tenant isolation per module.
- [Risk] Presigned URL upload bypasses NestJS — object lands in MinIO without metadata if client crashes before `confirm` → **Mitigation:** Background job (cron) scans orphaned objects older than 24h without a `files` record and deletes them.
- [Risk] RS256 key rotation is operationally more complex than HS256 → **Mitigation:** Store keys in environment variables; document rotation procedure. Acceptable for MVP1.
- [Risk] TypeORM migration drift in a team setting → **Mitigation:** All schema changes go through `typeorm migration:generate`; raw SQL migrations are forbidden.
- [Risk] `contract_sequences` advisory lock becomes a bottleneck at high volume → **Mitigation:** Acceptable for MVP1 (low concurrency). Can switch to Redis-based counter in MVP2.

## Migration Plan

1. Set up PostgreSQL + MinIO locally via Docker Compose
2. Run `typeorm migration:run` to apply all schema migrations
3. Run seed script to create sample tenant/store/users
4. Start NestJS API gateway
5. Start Next.js web app
6. Start Flutter app (dev mode)

Rollback: drop and recreate DB from migrations; no live data in MVP1.

## Open Questions

- Should `interest_policies` live in `tenant_settings` (one JSON blob) or a separate normalized table? → Lean toward separate table for queryability; finalize in specs.
- Flutter app: iOS build environment not available in dev — confirm Android-only for MVP1 mobile testing.
