# Security Guide

This guide documents the security model that is currently visible in the codebase. It also calls out the gap between intended controls and controls that are visibly wired today.

## JWT RS256 Setup

The API uses RS256 JWT access tokens.

Relevant configuration:

- `JWT_PRIVATE_KEY_PATH`
- `JWT_PUBLIC_KEY_PATH`
- `JWT_ACCESS_TOKEN_EXPIRES_IN`
- `JWT_REFRESH_TOKEN_EXPIRES_IN`

Visible auth behavior:

- `libs/auth/src/auth.service.ts` signs access tokens with the private key
- `libs/auth/src/strategies/jwt.strategy.ts` validates bearer tokens with the public key
- access token payload shape is `{ sub, tenantId, role, allowedStoreIds }`
- refresh tokens are random values stored as SHA256 hashes in `refresh_tokens`
- login and refresh both return a short-lived access token; default runtime return value is `expiresIn: 900`

Key generation example:

```bash
mkdir -p keys
openssl genrsa -out keys/private.pem 2048
openssl rsa -in keys/private.pem -pubout -out keys/public.pem
```

Current caveat:

- the repository does not include generated key files; they must be provisioned separately for every environment

## Tenant Isolation

The intended tenant-isolation rule is: never trust `tenant_id` from the frontend.

Visible current implementation:

- controllers generally rely on `request.user.tenantId` from the JWT
- services usually filter queries by `tenant_id`
- `TenantGuard` exists in `libs/common/src/guards/tenant.guard.ts`
- `CurrentUser` data shape includes `tenantId`

What `TenantGuard` currently does:

- compares route `:tenantId` to `request.user.tenantId`
- allows users with no `tenantId` to pass, which matches platform-admin style access
- throws `ForbiddenException('Tenant mismatch')` on mismatch

Current caveat:

- `TenantGuard` is present in the shared library but is not visibly registered globally and is not visibly attached to controllers in the current code

## Store-Scope Permissions

Store scope is modeled through `allowedStoreIds` in the JWT payload.

Visible current implementation:

- `StoreScopeGuard` exists in `libs/common/src/guards/store-scope.guard.ts`
- it checks `request.params.storeId` or `request.body.storeId`
- bypass roles are `platform_admin`, `tenant_owner`, and `tenant_admin`
- if no `storeId` is present in the request, it returns `true` and leaves filtering to service logic

Current caveats:

- `StoreScopeGuard` is not visibly wired into controllers or registered globally
- some service queries visibly filter by tenant only and not always by `allowedStoreIds`
- several mutating flows use `allowedStoreIds[0]`, which assumes a default store choice in the current implementation

## File Access Policy

Visible file security rules in `libs/files/src/files.service.ts`:

- object keys are generated under `tenants/{tenantId}/...`
- `requestUploadUrl()` checks that the target entity belongs to the current tenant
- `confirmUpload()` rejects upload tokens that do not start with `tenants/{tenantId}/`
- `getDownloadUrl()` looks up the file by `id` and `tenant_id`

Current object key pattern:

```text
tenants/{tenantId}/{entityType}s/{entityId}/{timestamp}-{sanitizedFilename}
```

Current caveats:

- download authorization is currently based on file `id` plus `tenant_id`
- extra entity-level or store-scope checks described in the product requirements are not visibly enforced in `getDownloadUrl()` today
- stored MIME type is currently hardcoded to `application/octet-stream` in `confirmUpload()`

## Audit Log Coverage

The audit table is `audit_logs`.

Visible audit fields:

- `tenant_id`
- `store_id`
- `user_id`
- `action`
- `entity_type`
- `entity_id`
- `old_value`
- `new_value`
- `ip_address`
- `user_agent`
- `created_at`

Visible current audit writes:

- `LOGIN_FAILED`
- `LOGIN`
- `LOGOUT`
- `CHANGE_PASSWORD`

Supporting components:

- `libs/audit/src/audit.service.ts` can write and query audit rows
- `libs/common/src/interceptors/audit.interceptor.ts` defines a reusable interceptor-based mechanism
- `@Audit(...)` metadata helper exists in `libs/common/src/decorators/roles.decorator.ts`

Current caveat:

- `AuditInterceptor` is not visibly registered globally and is not visibly attached to controllers
- the broader list of business audit events described in the requirements is not yet clearly implemented in the current source

## Password Security

Visible password handling in auth code:

- passwords are hashed with bcrypt
- new password hashes use 12 salt rounds
- login uses bcrypt compare against `users.password_hash`
- plaintext passwords are not stored in the database schema

Seed-data caveat:

- demo users are all seeded with the shared password `Password@123`
- this is acceptable for local/demo use only and should never be used in production

## Current Security Gaps To Track

- guards and interceptor intended for stronger tenant/store/audit enforcement are present but not visibly wired
- some read paths appear tenant-scoped without full store-scope filtering
- web and mobile clients currently expect `access_token`, while the backend returns `accessToken`
- download URL authorization appears narrower than the full file-access policy described in the product requirements
- several migration-schema names and service SQL names diverge, which can affect the reliability of security-sensitive flows
