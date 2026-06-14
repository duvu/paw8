## 1. Test Infrastructure

- [ ] 1.1 Create `apps/api-gateway/test/helpers/api-client.ts` — supertest wrapper with `baseUrl`, `login()`, and `authHeader()` helpers
- [ ] 1.2 Create `apps/api-gateway/test/helpers/seed.ts` — creates isolated tenant+store+admin user per test suite using platform admin token; returns `{ tenantId, storeId, adminToken }`
- [ ] 1.3 Add Jest config alias or `globalSetup` pointing tests at `http://10.113.213.9:3028`

## 2. Auth E2E Tests

- [ ] 2.1 Write `test/e2e/auth.e2e.ts` — login returns 201+accessToken+refreshToken+expiresIn
- [ ] 2.2 Write refresh token scenario — POST /auth/refresh returns 201+new accessToken
- [ ] 2.3 Write logout scenario — POST /auth/logout returns 200
- [ ] 2.4 Run auth suite; fix any failures (wrong status codes, missing fields)

## 3. Tenants E2E Tests

- [ ] 3.1 Write `test/e2e/tenants.e2e.ts` — create tenant (201), get tenant (200)
- [ ] 3.2 Run tenants suite; fix any failures

## 4. Stores E2E Tests

- [ ] 4.1 Write `test/e2e/stores.e2e.ts` — create store (201), list stores (200)
- [ ] 4.2 Run stores suite; fix any failures

## 5. Users E2E Tests

- [ ] 5.1 Write `test/e2e/users.e2e.ts` — create user (201), list users (200)
- [ ] 5.2 Run users suite; fix any failures

## 6. Customers E2E Tests

- [ ] 6.1 Write `test/e2e/customers.e2e.ts` — create customer (201), search by phone (200)
- [ ] 6.2 Run customers suite; fix any failures

## 7. Assets E2E Tests

- [ ] 7.1 Write `test/e2e/assets.e2e.ts` — create asset (201), get asset by id (200)
- [ ] 7.2 Run assets suite; fix any failures

## 8. Contracts E2E Tests

- [ ] 8.1 Write `test/e2e/contracts.e2e.ts` — create contract (201) with contractCode, list upcoming-due (200)
- [ ] 8.2 Run contracts suite; fix any failures (contract code generation, asset linking)

## 9. Transactions E2E Tests

- [ ] 9.1 Write `test/e2e/transactions.e2e.ts` — disbursement (201), interest collection (201), calculate-settlement (200/201)
- [ ] 9.2 Run transactions suite; fix any failures (enum values, amount validation)

## 10. Files E2E Tests

- [ ] 10.1 Write `test/e2e/files.e2e.ts` — upload-url (201+uploadUrl+objectKey), confirm (201+id), download-url (200+downloadUrl)
- [ ] 10.2 Run files suite; fix any failures (MinIO connectivity, permission checks)

## 11. Reports E2E Tests

- [ ] 11.1 Write `test/e2e/reports.e2e.ts` — dashboard (200+activeContracts+totalOutstanding)
- [ ] 11.2 Run reports suite; fix any failures

## 12. Full Suite Run + Deploy Fixes

- [ ] 12.1 Run all E2E suites together; record pass/fail per scenario
- [ ] 12.2 For each remaining failure: apply minimal fix, rebuild paw8-api image, push, recreate container
- [ ] 12.3 Re-run full suite on deployed container; confirm all happy-path scenarios green
- [ ] 12.4 Update `deployment/worker-z440/.env` with new image tags and commit deployment repo
