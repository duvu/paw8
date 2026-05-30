## Context

The paw8 backend is a NestJS modular monolith with 11 domain libs. Current state:
- Services invoke `dataSource.query()` directly — SQL and business logic in the same class
- `AuthService.login()` and `refresh()` call `readFileSync(privateKeyPath)` on every HTTP request
- DTOs exist but no global `ValidationPipe` is wired in `main.ts`; `class-validator` annotations not confirmed on all DTOs
- `ContractsService` has a `generateContractCode()` public method AND the same sequence-increment logic duplicated inside `create()`
- No shared TypeScript types between `apps/web` (Next.js) and NestJS libs; frontend interfaces are hand-maintained and can drift
- No OpenAPI docs — API is opaque without running the server and reading source

## Goals / Non-Goals

**Goals:**
- Introduce Repository classes per domain so services are SQL-free
- Cache JWT signing keys at module init in `AuthService`
- Wire `ValidationPipe` globally and annotate all DTOs
- Remove duplicated contract code generation logic
- Create `libs/shared-types` consumed by both backend and frontend
- Add Swagger/OpenAPI via `@nestjs/swagger`
- Reorganize `apps/web/components/` to FSD-lite feature structure

**Non-Goals:**
- No database schema changes or migrations
- No API contract changes (pure internal refactor)
- No new business features
- No microservice extraction
- No frontend routing or page-level changes (only component folder structure)

## Decisions

### D1: Repository Pattern — TypeORM `DataSource` injected into Repository classes

**Decision**: Each domain lib gets a `*.repository.ts` that accepts `DataSource` via constructor injection and owns all `dataSource.query()` / `dataSource.transaction()` calls. Services import the repository class and call typed methods.

**Rationale**: NestJS/TypeORM pattern without introducing `@Entity` ORM magic (the codebase uses raw SQL which is fine for a pawn domain). Repository is a thin typed wrapper, not an ORM abstraction. Keeps SQL close to the domain while making services unit-testable by mocking the repository.

**Alternative considered**: Switch to TypeORM entities + `Repository<T>`. Rejected — would require writing `@Entity` decorators for all tables, significant migration risk, and the existing raw SQL is already well-optimized with advisory locks and transactions.

### D2: Key caching — instance property initialized in constructor

**Decision**: In `AuthService`, read `privateKey` and `publicKey` via `readFileSync` once in the constructor, store as `private readonly` instance properties. All sign/verify calls reference `this.privateKey`.

**Rationale**: NestJS services are singletons by default. Constructor runs once at application bootstrap. Zero change to runtime behavior, eliminates per-request blocking I/O. No lazy initialization needed.

### D3: ValidationPipe — global with `whitelist: true, transform: true`

**Decision**: Add `app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))` in `main.ts`. Annotate all existing DTOs with `class-validator` decorators. Add `class-transformer` for `@Type()` on nested objects.

**Rationale**: `whitelist: true` silently strips unknown properties (prevents over-posting attacks). `forbidNonWhitelisted: true` returns 400 for unknown fields during development. `transform: true` enables `@Type()` coercion without manual casting.

**Risk**: Some existing endpoints may currently accept payloads they shouldn't. `forbidNonWhitelisted: true` could break undocumented clients. Mitigated by auditing all DTOs before enabling.

### D4: Shared types — `libs/shared-types` as a plain TypeScript lib

**Decision**: Create `libs/shared-types/` as a standard NestJS lib (`nest g library shared-types`) exporting pure TypeScript interfaces (no decorators, no class-validator, no NestJS dependencies). Both `apps/web` (tsconfig path alias) and NestJS libs import from `@paw8/shared-types`.

**Rationale**: Interfaces-only means no runtime dependency on NestJS in the frontend. DTOs in NestJS libs extend or implement these interfaces. Frontend types import the same source of truth.

**Alternative**: Duplicate types in a `packages/types` directory outside `libs/`. Rejected — adds monorepo complexity; `libs/` is already set up for this.

### D5: Swagger — bootstrap in `main.ts`, decorators on DTOs/controllers

**Decision**: Add `DocumentBuilder` + `SwaggerModule.createDocument` in `main.ts`. Add `@ApiProperty()` to all DTO fields. Add `@ApiTags()` and `@ApiBearerAuth()` to controllers. Serve at `/api/docs`.

**Rationale**: Low-effort, high-value. NestJS Swagger integration is first-class. Docs auto-update as DTOs change. No separate doc maintenance.

### D6: Frontend component structure — FSD-lite (features + ui)

**Decision**: Keep generic primitives in `components/ui/` (button, input, table, etc.). Create `components/features/<domain>/` directories for feature-specific components (e.g., `ContractStatusBadge`, `CustomerSearchForm`). No forced migration of components that are already generic.

**Rationale**: Pure folder reorganization — no behavior change, no framework change. Gradual adoption: new feature components go in `features/`, existing generic ones stay in `ui/`.

## Risks / Trade-offs

- **[Repository extraction scope]** → 11 domain libs is significant work. Mitigation: each domain's repository is independent; can be done incrementally lib-by-lib without breaking anything in flight.
- **[ValidationPipe breaking change]** → `forbidNonWhitelisted: true` may reject payloads accepted today. Mitigation: full DTO audit before enabling; consider enabling `whitelist: true` first, `forbidNonWhitelisted` after verification.
- **[Shared types circular dependency]** → If NestJS DTOs implement shared interfaces, and frontend imports same interfaces, `libs/shared-types` must have zero NestJS imports. Mitigation: D4 explicitly restricts `shared-types` to plain TypeScript only.
- **[Frontend import path churn]** → Moving components to `features/` requires updating import paths throughout pages. Mitigation: use barrel `index.ts` in each feature folder; pages import from `components/features/contracts` not deep paths.

## Migration Plan

1. Fix `AuthService` key caching first (isolated, zero risk, immediate perf win)
2. Wire `ValidationPipe` with `whitelist: true` only (non-breaking)
3. Create `libs/shared-types` and migrate frontend interfaces
4. Add Swagger to `main.ts`; add `@ApiProperty` to DTOs alongside validation decorators
5. Extract repositories domain-by-domain (start with `customers`, then `contracts`)
6. Enable `forbidNonWhitelisted: true` after full DTO audit
7. Deduplicate contract code generation helper
8. Reorganize frontend components to FSD-lite

Rollback: every step is a pure refactor. Git revert of any commit restores prior behavior.

## Open Questions

- Should `ValidationPipe` use `forbidNonWhitelisted: true` from day one, or be enabled after a validation pass? → Recommend audit first, enable after.
- Should Swagger be gated behind `NODE_ENV !== 'production'`? → Yes, recommended for security.
