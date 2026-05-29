## 1. README.md

- [x] 1.1 Create `README.md` at repo root with project description, tech stack, and badges
- [x] 1.2 Add Quick Start section: clone, copy `.env.example`, `docker-compose up -d`, migrate, seed, start API, open web
- [x] 1.3 Add Documentation section with links to ARCHITECTURE.md and all docs/ files
- [x] 1.4 Add Contributing section with branch naming and PR guidance

## 2. ARCHITECTURE.md

- [x] 2.1 Create `ARCHITECTURE.md` at repo root with system components overview (NestJS, Next.js, Flutter, PostgreSQL, MinIO)
- [x] 2.2 Add Module Boundaries section listing all 12 NestJS libs with one-line responsibilities
- [x] 2.3 Add Tenant Isolation section explaining shared schema, tenant_id column, JWT-only tenant derivation, TenantGuard
- [x] 2.4 Add Mermaid ER diagram showing main entity relationships (tenants → stores → users, pawn_contracts → contract_transactions, assets → contract_assets)
- [x] 2.5 Add Data Flow section: contract creation flow, file upload flow, financial transaction flow
- [x] 2.6 Add Key Design Decisions section referencing design.md decisions (RS256 JWT, append-only transactions, contract code generation via advisory lock)

## 3. Development Guide

- [x] 3.1 Create `docs/development.md` with Prerequisites section (Node.js 20+, pnpm 9+, Docker, Flutter 3.x, bun)
- [x] 3.2 Add Environment Setup section: copy `.env.example`, generate RS256 keys, document every env var
- [x] 3.3 Add Docker section: `docker-compose up -d`, verify PostgreSQL on port 5433 and MinIO on port 9000
- [x] 3.4 Add Database Migration section: `pnpm migration:run`, verify output, `pnpm seed`, expected seed output
- [x] 3.5 Add Running the API section: `cd apps/api-gateway && pnpm start:dev`, document the current working local API port strategy (default runtime port `3000`)
- [x] 3.6 Add Running the Web Portal section: `cd apps/web && pnpm dev`, document the recommended local web port strategy
- [x] 3.7 Add Running Flutter section: `cd apps/mobile && flutter run`, emulator/device requirements
- [x] 3.8 Add Testing section: NestJS unit tests, e2e tests, Next.js build, Flutter analyze, i18n:check parity script

## 4. API Reference

- [x] 4.1 Create `docs/api-reference.md` with Auth section: POST /auth/login, POST /auth/refresh, POST /auth/logout, POST /auth/change-password
- [x] 4.2 Add Tenants section: GET/POST /tenants, GET/PATCH /tenants/:id, PATCH /tenants/:id/status
- [x] 4.3 Add Stores section: GET/POST /stores, GET/PATCH /stores/:id, PATCH /stores/:id/status, PATCH /stores/:id/manager
- [x] 4.4 Add Users section: GET/POST /users, GET/PATCH /users/:id, PATCH /users/:id/status, POST /users/:id/stores
- [x] 4.5 Add Customers section: GET/POST /customers, GET/PATCH /customers/:id, GET /customers/:id/contracts
- [x] 4.6 Add Assets section: GET/POST /assets, GET/PATCH /assets/:id, PATCH /assets/:id/status, GET /assets/inventory
- [x] 4.7 Add Contracts section: GET/POST /contracts, GET/PATCH /contracts/:id, PATCH /contracts/:id/status, GET /contracts/upcoming-due, GET /contracts/overdue, and note there is no current `GET /contracts/:id/calculate-interest` route
- [x] 4.8 Add Transactions section: document current transaction endpoints `POST /transactions`, `GET /transactions/contract/:contractId`, `POST /transactions/calculate-settlement`, `POST /transactions/extend`, `POST /transactions/:id/void`
- [x] 4.9 Add Files section: POST /files/upload-url, POST /files/confirm, GET /files/:id/download-url, GET /files/entity/:type/:id, DELETE /files/:id
- [x] 4.10 Add Reports section: GET /reports/dashboard, /reports/contracts, /reports/collections, /reports/outstanding, /reports/overdue, /reports/stores, /reports/staff, /reports/assets/inventory
- [x] 4.11 Add Audit section: GET /audit/logs
- [x] 4.12 Add Error Codes section with all HTTP status codes and example error response shape
- [x] 4.13 Add one curl example per module group showing authentication and a representative call

## 5. Database Schema Documentation

- [x] 5.1 Create `docs/database-schema.md` with overview and all table names from the 7 migration files
- [x] 5.2 Document tables 1-7: tenants, tenant_settings, stores, users, roles, user_roles, user_store_assignments
- [x] 5.3 Document tables 8-10: customers, customer_documents, assets
- [x] 5.4 Document tables 11-14: asset_inventory, pawn_contracts, contract_assets, contract_status_history
- [x] 5.5 Document tables 15-18: contract_transactions, contract_extensions, payment_receipts, contract_sequences
- [x] 5.6 Document tables 19-22: files, audit_logs, refresh_tokens, interest_policies
- [x] 5.7 Add Indexes section listing all indexes with columns and rationale
- [x] 5.8 Add Mermaid ERD for core tables
- [x] 5.9 Add Append-Only Transactions note explaining void/reversal/adjustment pattern

## 6. Deployment Guide

- [x] 6.1 Create `docs/deployment.md` with Docker Compose production setup (service images, volumes, ports, healthchecks)
- [x] 6.2 Add Environment Variables section listing all variables with purpose, example value, and secret/non-secret classification
- [x] 6.3 Add RS256 Key Generation section with `openssl` commands for generating private/public key pair
- [x] 6.4 Add Migration Runbook: run migrations, verify, revert procedure
- [x] 6.5 Add MinIO Initialization section: bucket creation, private policy, minio-init container pattern
- [x] 6.6 Add Health Check section: API endpoint, database connectivity, MinIO connectivity verification commands

## 7. Security Guide

- [x] 7.1 Create `docs/security.md` with JWT RS256 Setup section: key generation, env var names, token payload structure
- [x] 7.2 Add Tenant Isolation section: TenantGuard location, enforcement rule, "never trust tenant_id from frontend"
- [x] 7.3 Add Store-Scope Permissions section: StoreScopeGuard location, which roles bypass it, allowedStoreIds check
- [x] 7.4 Add File Access Policy section: object key prefix pattern, confirmUpload prefix verification, presigned URL permission checks
- [x] 7.5 Add Audit Log Coverage section: document the current implemented audit events, AuditInterceptor mechanism, captured fields, and current gaps
- [x] 7.6 Add Password Security section: bcrypt hashing, salt rounds, prohibition on plaintext storage

## 8. Verification

- [x] 8.1 Verify all 7 documentation files exist and are non-empty
- [x] 8.2 Check all internal cross-document links resolve (README → docs/, ARCHITECTURE.md)
- [x] 8.3 Verify Mermaid diagrams are syntactically valid (no unclosed blocks)
- [x] 8.4 Verify all API endpoint paths match actual controller routes in the codebase
- [x] 8.5 Verify all table names in database-schema.md match the migration files
