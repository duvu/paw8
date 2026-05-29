## Why

paw8 is a multi-tenant SaaS platform for pawn shop chain management. Currently the repository has only requirements documentation and no application code. MVP1 must be built from scratch to deliver a production-ready foundation: tenant-aware backend, web portal, and lightweight mobile app that supports the full pawn operation lifecycle.

## What Changes

- Scaffold the NestJS modular monolith backend (`apps/api-gateway/`, `libs/`) with all domain modules
- Implement PostgreSQL database schema with tenant isolation (`tenant_id` on every business table) and migrations
- Build the Auth module: JWT-based login, current user context, tenant resolution from token
- Build Tenant, Store, User/RBAC modules with full CRUD and role-based access control
- Build Customer module with profile management and document upload
- Build Asset module with photo/document storage via MinIO
- Build Pawn Contract module with full contract lifecycle (draft → active → extended → settled)
- Build Transaction module: disbursement, interest collection, extension, settlement (append-only)
- Build File module: MinIO presigned upload/download URLs with tenant + permission checks
- Build Reports module: dashboard metrics and operational reports
- Build Audit module: append-only audit log for all business operations
- Scaffold Next.js web app with portals for Platform Admin, Tenant Admin/Manager, and Staff
- Scaffold Flutter mobile app for staff: search, contract lookup, and photo capture/upload
- Seed data: sample tenant, store, and users for each role

## Capabilities

### New Capabilities

- `auth`: JWT login/logout, token refresh, current user context, tenant resolution from JWT — never trust client-supplied tenant_id
- `tenants`: Tenant CRUD, activation/locking, plan/license fields, tenant settings
- `stores`: Store/branch CRUD within a tenant, manager assignment, staff assignment
- `users-rbac`: User management, role assignment (Platform Admin, Tenant Owner, Tenant Admin, Store Manager, Staff, Accountant), store-scope assignment
- `customers`: Customer profile CRUD, duplicate CCCD/phone detection per tenant, emergency contact, document upload
- `assets`: Pawned asset CRUD by type (vehicle, phone, jewelry, etc.), photo/document upload, inventory location tracking
- `pawn-contracts`: Contract lifecycle management, contract code generation (`{store_code}-{YYYYMM}-{seq}`), interest calculation (daily/monthly/term), status transitions
- `transactions`: Append-only financial records — disbursement, interest collection, fee, extension, partial principal, settlement, void/reversal/adjustment
- `files`: MinIO presigned URL upload/download with tenant + entity ownership + store scope validation; metadata persisted in PostgreSQL
- `reports`: Dashboard metrics (active contracts, outstanding balance, due soon, overdue, assets held) and operational reports filterable by tenant/store/date/status
- `audit-log`: Append-only audit events for all sensitive operations with tenant_id, store_id, user_id, entity, old/new values, IP, user-agent
- `web-portal`: Next.js app — Platform Admin screens, Tenant Admin/Manager screens, Staff screens
- `mobile-app`: Flutter app — login, customer/contract search, due-soon/overdue lists, photo capture and upload

### Modified Capabilities

## Impact

- New monorepo structure under `apps/` and `libs/`
- New database migrations (PostgreSQL, all tables with `tenant_id`)
- New MinIO bucket configuration (private, tenant-prefixed object keys)
- New environment configuration: `.env` with DB, MinIO, JWT secrets
- New API surface: `/api/v1/...` versioned from day one
- New `package.json` workspaces (NestJS, Next.js, Flutter `pubspec.yaml`)
