## Why

The paw8 system is now deployed at `https://paw8.x51.vn` with all migrations applied and demo accounts seeded, but no end-to-end happy-path coverage exists for the core pawn-shop workflows. Untested flows mean production regressions go undetected and bugs accumulate silently before users find them.

## What Changes

- Add a comprehensive E2E happy-path test suite covering every core domain workflow via API
- Execute all happy-path tests against the live deployment and fix any failures found
- Document verified production behaviour for each workflow

Specific flows to cover:
- Auth: login, token refresh, logout, change-password
- Tenants / Stores / Users: CRUD + status transitions
- Customers: create, search, update, attach document
- Assets: create, update, search by serial/IMEI
- Contracts: create (with customer + asset), generate contract code, status transition
- Transactions: disbursement, interest collection, extension, settlement, void
- Files: upload presigned URL, confirm, download URL, delete
- Reports/Dashboard: summary metrics endpoint

## Capabilities

### New Capabilities
- `e2e-happy-path-tests`: End-to-end API test suite that exercises every core happy-path workflow against the running paw8 stack and asserts correct HTTP status codes, response shapes, and business-rule side-effects

### Modified Capabilities
<!-- None — no spec-level requirement changes, only adding test coverage and fixing discovered bugs -->

## Impact

- New test files under `apps/api-gateway/test/e2e/` (happy-path scenarios per domain)
- Bug fixes in API handlers, service layer, or DTOs discovered during test execution
- No schema changes expected; if a migration is required it will be noted explicitly
- Affected domains: auth, tenants, stores, users, customers, assets, contracts, transactions, files, reports
