# Proposal: complete-rbac-enforcement

## Status
draft

## Why

The `RolesGuard` and `@Roles()` decorator are fully implemented and wired globally in `app.module.ts`. However, a systematic audit of all 12 controllers reveals that **27 read/write endpoints across 8 controllers have no `@Roles()` annotation**, meaning any authenticated user of any role can call them.

This is a critical security gap in a multi-tenant SaaS pawn shop system where:
- Staff must not access tenant-admin config (interest policies, user management)
- Accountants should only read financial data, not create contracts or customers
- Store managers should not manage other stores' data
- Platform admin endpoints must be strictly protected

The `InterestPoliciesController` is the worst case — it lacks even `RolesGuard` registration, so role checks are bypassed entirely for all 5 interest policy endpoints.

Completing RBAC enforcement is a prerequisite for any production deployment (MVP1 completion criterion §15.1: "API không cho truy cập dữ liệu khác tenant").

## What Changes

### New Capabilities
None — this change adds no new features.

### Modified Capabilities

**`auth`** — `AuthController`: no changes needed (logout/change-password correctly open to any authenticated user).

**`contracts`** — `ContractsController`: add `@Roles()` to 3 GET endpoints. `InterestPoliciesController`: add `RolesGuard` to controller decorator + `@Roles()` to all 5 endpoints.

**`customers`** — `CustomersController`: add `@Roles()` to all 5 endpoints.

**`assets`** — `AssetsController`: add `@Roles()` to 3 GET endpoints.

**`transactions`** — `TransactionsController`: add `@Roles()` to 2 endpoints.

**`files`** — `FilesController`: add `@Roles()` to 4 endpoints.

**`users`** — `UsersController`: add `@Roles()` to `GET :id` endpoint.

**`stores`** — `StoresController`: add `@Roles()` to `GET :id` endpoint.

## Impact

- **Backend**: 8 controller files modified — `@Roles()` annotations added, `InterestPoliciesController` gets `RolesGuard` in `@UseGuards()`
- **Frontend/Mobile**: No changes — the frontend already uses JWT tokens with the role embedded; unauthorized requests simply receive 403 instead of data
- **Database**: No schema changes
- **Tests**: Existing integration tests may need JWT tokens with appropriate roles for previously-open endpoints

## Scope

27 endpoints across 8 controllers. Zero new files. Zero new dependencies. Pure annotation work.
