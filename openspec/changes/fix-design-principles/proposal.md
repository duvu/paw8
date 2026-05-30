## Why

The codebase has working business logic but mixes infrastructure concerns with domain logic, missing a proper data access layer, input validation pipeline, and shared type contracts. These gaps create security risk (unvalidated input), performance issues (blocking I/O per request), and maintenance burden (untestable SQL-in-service, drifting frontend/backend types).

## What Changes

- Introduce per-domain Repository classes that own all SQL; services become SQL-free
- Fix `AuthService` to cache JWT signing keys at module init instead of reading from disk on every request
- Add global `ValidationPipe` + `class-validator` decorators on all DTOs
- Deduplicate `ContractsService` contract code generation into a single private helper
- Add `libs/shared-types` package with shared TypeScript interfaces for API contracts consumed by both NestJS services and the Next.js web app
- Add `@nestjs/swagger` with `@ApiProperty` decorators for auto-generated OpenAPI docs
- Reorganize frontend components from flat `components/ui/` into FSD-lite feature folders

## Capabilities

### New Capabilities

- `repository-layer`: Per-domain repository classes (`*.repository.ts`) that encapsulate all raw SQL; NestJS services call repositories instead of `dataSource.query()` directly
- `dto-validation`: Global `ValidationPipe` in `main.ts` plus `class-validator`/`class-transformer` annotations on all request DTOs across all domain modules
- `shared-types`: New `libs/shared-types` package exporting TypeScript interfaces for all API request/response shapes, consumed by both backend and `apps/web`
- `swagger-docs`: `@nestjs/swagger` bootstrap in `main.ts` with `@ApiProperty` on all DTOs and `@ApiTags`/`@ApiBearerAuth` on controllers
- `frontend-feature-components`: FSD-lite component reorganization — feature-specific components moved to `apps/web/components/features/<domain>/`

### Modified Capabilities

<!-- No existing spec-level behavior changes — all changes are implementation/structure -->

## Impact

- **Backend libs affected**: `auth`, `customers`, `contracts`, `assets`, `transactions`, `stores`, `tenants`, `users`, `reports`, `files`, `audit`, `common`
- **New lib**: `libs/shared-types/` (new NestJS library package)
- **Frontend**: `apps/web/components/` structure reorganized; import paths updated
- **`apps/api-gateway/src/main.ts`**: `ValidationPipe` + Swagger bootstrap added
- **`libs/auth/src/auth.service.ts`**: `readFileSync` moved to constructor
- **No API contract changes** — this is a purely internal structural refactor
- **No database migrations** — schema unchanged
