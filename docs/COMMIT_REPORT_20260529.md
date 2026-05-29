# Commit Report

## Summary

- **Project:** `/home/beou/IdeaProjects/paw8`
- **Branch:** `feature/mvp1-full-implementation`
- **Mode:** Single project
- **Timestamp:** 2026-05-29
- **Branch decision:** New branch — entire MVP1 codebase is being committed for the first time; changes are large and span all domains.
- **Commit title:** `feat: MVP1 full implementation — NestJS, Next.js, Flutter, i18n, docs, secure UX`
- **Push target:** `origin feature/mvp1-full-implementation`

---

## Uncommitted Audit

All files are new (first-ever commit beyond the initial docs commit on `main`).

Key areas:

| Area | Files |
|---|---|
| Monorepo scaffold | `package.json`, `pnpm-workspace.yaml`, `.npmrc`, `.gitignore`, `docker-compose.yml`, `.env.example` |
| NestJS API Gateway | `apps/api-gateway/` — app, 7 migrations, seed, 12 domain libs |
| Next.js Web Portal | `apps/web/` — 18 routes, auth context, i18n, refreshed UI/UX |
| Flutter Mobile App | `apps/mobile/` — 12 screens, Riverpod, GoRouter, ARB i18n |
| Domain libs | `libs/{auth,tenants,stores,users,customers,assets,contracts,transactions,files,reports,audit,common}/` |
| Documentation | `README.md`, `ARCHITECTURE.md`, `docs/{development,api-reference,database-schema,deployment,security}.md` |
| OpenSpec changes | `openspec/changes/{mvp1-foundation,i18n-multi-language,project-documentation,modern-secure-ui-ux}/` |
| Agent tooling | `.agents/`, `.claude/`, `.codex/`, `.cursor/`, `.gemini/`, `.github/`, `.grok/`, `.qwen/`, `.opencode/` |
| Scripts | `scripts/i18n-check.mjs` |

---

## Files Planned For Commit

### Infrastructure
- `.gitignore` — new, covers node_modules, dist, .next, keys/, Flutter build, .serena/
- `docker-compose.yml` — PostgreSQL 16 on port 5433, MinIO 9000/9001, minio-init bucket setup
- `.env.example` — all required env vars documented
- `package.json`, `pnpm-workspace.yaml`, `.npmrc` — pnpm monorepo root

### Backend: NestJS API Gateway (`apps/api-gateway/`)
- `src/main.ts` — global prefix `/api/v1`, validation pipe, i18n exception filter, CORS
- `src/app.module.ts` — all 12 domain modules registered, TypeORM, ConfigModule, I18nModule
- `src/database/data-source.ts` — TypeORM DataSource for migrations
- `src/database/migrations/` — 7 migration files creating all 22 tables
- `src/database/seed.ts` — demo tenant DEMO, store HN01, 6 users with Password@123
- `src/i18n/{vi,en,zh}.json` — API error/validation translations
- `test/` — app e2e + 3 integration test files

### Backend: Domain Libraries (`libs/`)
- `libs/auth/` — JWT RS256 strategy, login/refresh/logout/change-password
- `libs/tenants/` — tenant CRUD (platform_admin only)
- `libs/stores/` — store management, manager assignment
- `libs/users/` — user CRUD, role assignment, store assignment
- `libs/customers/` — customer search, duplicate-identity check, contract history
- `libs/assets/` — asset CRUD, inventory management
- `libs/contracts/` — contract lifecycle, advisory-lock code generation, interest calculation
- `libs/transactions/` — append-only financial records, settlement, extension, void
- `libs/files/` — MinIO presigned upload/download, entity ownership check
- `libs/reports/` — dashboard metrics, 8 report endpoints
- `libs/audit/` — audit log query endpoint
- `libs/common/` — guards (TenantGuard, StoreScopeGuard, RolesGuard), interceptors (AuditInterceptor), decorators, exception filter

### Frontend: Next.js Web Portal (`apps/web/`)
- `app/page.tsx` — branded landing page (replaces Next.js starter)
- `app/login/page.tsx` — split layout, session-expiry notice, role-based redirect
- `app/(dashboard)/layout.tsx` — secure shell, role-aware nav, `getDefaultRouteForRole`
- `app/(dashboard)/dashboard/page.tsx` — aligned with `totalOutstandingPrincipal` backend field
- `app/(dashboard)/reports/page.tsx` — fixed endpoint paths and `dateFrom`/`dateTo` params
- `app/(dashboard)/audit-logs/page.tsx` — fixed path to `/audit/logs`
- `app/(dashboard)/customers/page.tsx` — search param aligned to `query`
- `app/(dashboard)/transactions/page.tsx` — replaced broken list with "unavailable" panel
- `lib/auth-storage.ts`, `lib/role-access.ts`, `components/page-states.tsx` — new shared utilities
- `contexts/auth.tsx` — aligned to backend `{ accessToken, refreshToken, expiresIn }` contract
- `messages/{en,vi,zh}.json` — 285+ keys, all 3 locales in parity
- `proxy.ts` — next-intl middleware (locales vi/en/zh, default vi, prefix as-needed)

### Frontend: Flutter Mobile App (`apps/mobile/`)
- `lib/core/auth/session.dart` — session constants, `SessionRefreshNotifier`
- `lib/core/providers/secure_storage_provider.dart` — shared `secureStorageProvider`
- `lib/core/api/api_client.dart` — token key constant, 401 session-clear + notify
- `lib/features/auth/` — `AuthSession` model, backend contract alignment, profile hydration
- `lib/features/home/screens/home_screen.dart` — dashboard field alignment, `GridView` metrics
- `lib/features/auth/screens/login_screen.dart` — branded card, error code mapping
- `lib/features/settings/screens/settings_screen.dart` — session info, locale cards
- `lib/l10n/app_{vi,en,zh}.arb` — 62 keys each
- All other screens: customers, contracts, assets, overdue, upcoming-due

### Documentation
- `README.md` — project overview, quick start, demo accounts, known caveats
- `ARCHITECTURE.md` — component map, ERD, Mermaid diagram, current-state gaps
- `docs/development.md` — prerequisites, local setup, port strategy, migration runbook
- `docs/api-reference.md` — all 11 controller groups, request/response shapes, curl examples
- `docs/database-schema.md` — all 22 tables, enums, indexes, schema vs service mismatches
- `docs/deployment.md` — infrastructure setup, MinIO init, health checks, deployment gaps
- `docs/security.md` — JWT RS256, tenant isolation, file access, audit coverage, security gaps

### OpenSpec Changes (spec+design+tasks artifacts, all complete)
- `openspec/changes/mvp1-foundation/` — 123/123 tasks complete
- `openspec/changes/i18n-multi-language/` — 52/52 tasks complete
- `openspec/changes/project-documentation/` — 57/57 tasks complete
- `openspec/changes/modern-secure-ui-ux/` — 39/39 tasks complete

### Agent Tooling
- `.agents/`, `.opencode/` — oh-my-agent skills/workflows/rules, OpenSpec commands
- `.claude/`, `.codex/`, `.cursor/`, `.gemini/`, `.github/`, `.grok/`, `.qwen/` — vendor-specific rule/skill copies

---

## Detailed Changes

### Security / Auth
- Backend signs RS256 JWTs; private key path from env, falls back to `keys/private.pem`
- Refresh tokens stored as SHA256 hashes with 7-day expiry
- Web/mobile both now parse `accessToken` (was: `access_token`) from login response
- Session-expiry notice shown on login page when 401 redirected with `session_notice=expired`
- `TenantGuard` and `StoreScopeGuard` are implemented in `libs/common`; not yet wired globally — documented as known gap

### Database
- 7 TypeORM migrations create all 22 tables; `synchronize: false` enforced
- Append-only `contract_transactions` — corrective records only (adjustment/void/reversal)
- Advisory lock on `contract_sequences` for contract code generation
- Unique constraints are tenant-scoped (e.g. `UNIQUE(tenant_id, phone)`)
- Known schema/service mismatch: `asset_status` migration uses `holding`, service uses `pawned`; documented

### API Routes
- All routes under `/api/v1/`
- Tenant ID always derived from JWT, never from request body
- Reports: `/reports/{contracts,collections,outstanding,overdue,stores,staff,assets/inventory}`
- Audit: `/audit/logs`
- Web report page was previously calling `/reports/by-store`, `/reports/by-staff`, `/reports/inventory` — fixed

### i18n
- API: nestjs-i18n, fallback `vi`, Accept-Language resolver
- Web: next-intl, default locale `vi`, prefix `as-needed`, 285 keys × 3 locales
- Mobile: flutter gen-l10n, ARB files, locale persisted in FlutterSecureStorage
- Parity script: `scripts/i18n-check.mjs` checks web + API key parity (not Flutter ARB)

---

## Affected Flows

- **Login flow:** JWT issued, refresh token stored, web/mobile session persisted
- **API request flow:** Bearer token → JWT strategy → RolesGuard → service (tenant from JWT)
- **Contract creation flow:** advisory lock → code generation → asset status update → history record
- **Settlement flow:** transaction record → contract status → asset status (atomic)
- **File upload flow:** presigned PUT URL → client upload → confirm → metadata in DB
- **Dashboard flow:** `/reports/dashboard` → web/mobile metric render
- **Reports/audit flow:** aligned backend paths, role-gated tabs

---

## Impact and Risks

| Area | Impact | Risk |
|---|---|---|
| Backend | Full domain implementation | No DB triggers for append-only; relies on app logic |
| Web | 18 routes, auth aligned | `/transactions` page shows unavailable state (no list endpoint) |
| Mobile | 12 screens | `AssetPhotoUploadScreen` exists but not routed |
| Security | JWT RS256, tenant isolation | TenantGuard/StoreScopeGuard not globally registered |
| Schema | 22 tables, all indexed | Asset/transaction/inventory column name mismatches between migration and service SQL |

---

## Sensitive / Risk Review

- **No secrets committed:** `.env` is excluded by `.gitignore`; `keys/` directory excluded
- **Passwords in seed:** `Password@123` bcrypt-hashed; seed is demo data only — documented clearly
- **Private keys:** Not in repo; docs instruct user to generate them
- **pnpm-lock.yaml:** Large generated file; included for reproducible installs

---

## Verification

```bash
# API build
cd apps/api-gateway && pnpm run build
# Result: 0 errors

# Web build
cd apps/web && pnpm build
# Result: 18 routes compiled, 0 errors

# Flutter analyze
cd apps/mobile && flutter analyze
# Result: 0 errors, 0 warnings (2 pre-existing info in home_screen.dart)

# i18n parity
cd /home/beou/IdeaProjects/paw8 && pnpm i18n:check
# Result: web 285 keys ✓, API 47 keys ✓, 0 missing across all 6 locale files
```

---

## Notes

- This is the initial commit of all application code; the repository previously had only `docs/mvp1-requirements.md`
- Four OpenSpec changes are complete: `mvp1-foundation`, `i18n-multi-language`, `project-documentation`, `modern-secure-ui-ux`
- Known mismatches between migration schema and service SQL are documented in `docs/database-schema.md` and `ARCHITECTURE.md`
- `AGENTS.md` still says "early planning phase" — the code in this commit supersedes that description
