## Context

paw8 is a multi-tenant pawn-shop SaaS deployed at `https://paw8.x51.vn` (web) and `https://api.paw8.x51.vn` (API). All 12 TypeORM migrations have been applied, demo seed data exists, and HTTPS is working. No happy-path E2E tests exist yet, meaning production behaviour is unverified.

The test stack is NestJS 11 with Jest and the existing `apps/api-gateway/test/` directory. The live API is accessible at `http://10.113.213.9:3028` (internal) or `https://api.paw8.x51.vn` (HTTPS).

## Goals / Non-Goals

**Goals:**
- Exercise every core API happy-path with a real HTTP request against the running paw8-api container
- Capture response shape and status for each endpoint
- Fix any bug discovered during test execution (wrong status codes, missing fields, constraint violations, missing service wiring)
- Produce a passing test suite that can be re-run after future deploys

**Non-Goals:**
- Negative / sad-path coverage (belongs in a separate change)
- Performance or load testing
- Mobile (Flutter) client testing
- Frontend browser automation
- Covering marketplace flows beyond what exists in the deployed image

## Decisions

### D1: Test execution target — internal API port, not HTTPS domain
Run tests against `http://10.113.213.9:3028` directly. Avoids TLS/DNS flakiness in automated runs. HTTPS is already smoke-tested manually.

*Alternative considered*: test via `https://api.paw8.x51.vn`. Rejected — adds Caddy/cert latency and breaks in offline CI.

### D2: Test framework — Jest + `supertest` (already in repo)
`apps/api-gateway/test/` uses Jest. Use `supertest` pointing at the running container rather than spinning up a NestJS test app. This tests the actual production binary including all middleware, guards, and interceptors.

*Alternative considered*: NestJS `Test.createTestingModule`. Rejected — requires mocking DB/MinIO, defeats the purpose of happy-path verification.

### D3: One test file per domain module
`auth.e2e.ts`, `tenants.e2e.ts`, `stores.e2e.ts`, `users.e2e.ts`, `customers.e2e.ts`, `assets.e2e.ts`, `contracts.e2e.ts`, `transactions.e2e.ts`, `files.e2e.ts`, `reports.e2e.ts`. Each is self-contained with its own setup/teardown using test-scoped tenant data.

### D4: Shared test client utility
`test/helpers/api-client.ts` — thin wrapper around `supertest` with bearer-token helpers. `test/helpers/seed.ts` — creates isolated tenant+store+admin for each suite using the platform admin account.

### D5: Fix strategy — minimal targeted patches
When a test fails, fix the minimal code path to make it pass without refactoring. One bug = one targeted fix. No opportunistic cleanup.

## Risks / Trade-offs

- **Shared DB state** → Each suite creates its own tenant via `platform@paw8.dev` admin token. Suites remain isolated even when run in parallel.  
  Mitigation: use unique `code` per test run (timestamp suffix).
- **Container must be running** → Tests require `paw8-api` and `paw8-postgres` healthy.  
  Mitigation: document as prerequisite; skip gracefully if API unreachable.
- **Test data accumulation** → Each run inserts real DB rows.  
  Mitigation: acceptable for now; add cleanup in a later change.
- **Discovered bugs may require image rebuild** → If a fix changes NestJS code, a new Docker image must be pushed and container recreated.  
  Mitigation: tag new images and update `.env` as part of fix tasks.
