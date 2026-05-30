## Why

The paw8 project has a complete MVP1 backend (NestJS), web portal (Next.js), and mobile app (Flutter) with i18n support, but no developer-facing documentation. Without comprehensive docs, onboarding new developers, deploying the system, or understanding the architecture requires reading source code. This change produces the full documentation suite before the project grows further.

## What Changes

- Add `README.md` at repo root: project overview, architecture diagram, quick-start guide, links to sub-docs
- Add `ARCHITECTURE.md`: domain model, module boundaries, tenant isolation pattern, data flow diagrams, key design decisions
- Add `docs/development.md`: developer onboarding, local setup (Docker, pnpm, env vars), running all three apps, running tests
- Add `docs/api-reference.md`: all `/api/v1/*` endpoints grouped by module, request/response shapes, auth requirements, error codes
- Add `docs/database-schema.md`: all 20+ tables with columns, types, constraints, index rationale, ER summary
- Add `docs/deployment.md`: Docker Compose production setup, environment variable reference, MinIO bucket init, migration runbook, health checks
- Add `docs/security.md`: tenant isolation enforcement, JWT RS256 setup, store-scope permission model, file-access policy, audit log coverage

## Capabilities

### New Capabilities

- `readme`: Root README with project overview, tech stack badges, quick-start, and doc index
- `architecture-doc`: ARCHITECTURE.md covering domain model, module boundaries, tenant isolation, design decisions
- `development-guide`: Developer onboarding — local env setup, running services, testing workflow
- `api-reference`: Complete API reference for all `/api/v1` endpoints
- `database-schema-doc`: Database schema reference with all tables, columns, indexes, and ER summary
- `deployment-guide`: Production deployment runbook (Docker, migrations, MinIO, env vars, health checks)
- `security-guide`: Security model documentation — JWT, tenant isolation, RBAC, file access, audit log

### Modified Capabilities

## Impact

- No code changes; documentation only
- Creates/modifies files: `README.md`, `ARCHITECTURE.md`, `docs/development.md`, `docs/api-reference.md`, `docs/database-schema.md`, `docs/deployment.md`, `docs/security.md`
- Depends on existing implementation: all 12 NestJS modules, Next.js web portal, Flutter mobile app, 7 migrations, seed data, i18n setup
