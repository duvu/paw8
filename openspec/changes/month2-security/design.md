## Context

The system has full RBAC enforcement (`JwtAuthGuard → TenantGuard → RolesGuard → StoreScopeGuard`) but four security gaps remain before production:

1. **Refresh token replay**: `refresh()` in `AuthService` finds a valid token and issues a new access token without revoking the old refresh token. Anyone who steals a refresh token can reuse it indefinitely until expiry (7 days).
2. **No rate limiting**: `POST /auth/login` and `POST /auth/refresh` have no throttle. Brute-force attacks are trivially possible.
3. **Weak password policy**: `ChangePasswordDto.newPassword` uses only `@MinLength(8)`. `CreateUserDto.password` uses `@MinLength(8)`. No complexity requirements for a financial app.
4. **Audit store_id gap**: `audit_logs.store_id` column exists but `AuditInterceptor` never populates it. Store-level audit queries produce incomplete results.

Existing infrastructure:
- `refresh_tokens` table: `id, user_id, token_hash, expires_at, revoked_at, created_at` (no `family_id` yet)
- `@nestjs/throttler` not installed
- `class-validator` fully wired (ValidationPipe with whitelist+transform)
- `AuditInterceptor` is a global `APP_INTERCEPTOR`; it reads route metadata via `@Audit()` decorator

## Goals / Non-Goals

**Goals:**
- Rotate refresh tokens on every use (single-use refresh tokens)
- Detect stolen token reuse via family tracking — revoke entire family on reuse
- Apply `@nestjs/throttler` globally with strict overrides on auth endpoints
- Custom `@IsStrongPassword()` class-validator decorator applied to all password fields
- Populate `store_id` in audit logs for store-scoped mutations
- Track and lockout after consecutive login failures (configurable threshold)

**Non-Goals:**
- OAuth2 / OIDC / SSO
- Two-factor authentication
- IP allowlist / geofencing
- Device fingerprinting
- Session management beyond JWT + refresh tokens

## Decisions

### D1: Single-use refresh tokens with family ID

**Decision**: On each `refresh()` call:
1. Look up the incoming token hash.
2. If token is **revoked** → reuse detected → revoke entire family (`UPDATE refresh_tokens SET revoked_at=now() WHERE family_id=$1`) → throw `UnauthorizedException('Token reuse detected')`.
3. If token is **valid** → revoke it atomically → issue new refresh token in same family → return new tokens.

**Why**: Token family pattern (RFC recommendation) lets us detect if a stolen token was used after rotation without needing a distributed session store. `family_id` is a UUID set at login and inherited by all rotated descendants.

**Alternative considered**: Simple revoke-on-use without family — simpler but can't detect stolen token reuse, only prevents replay after first use.

**Schema change**: `ALTER TABLE refresh_tokens ADD COLUMN family_id UUID, ADD COLUMN replaced_by_hash VARCHAR(255)`.

### D2: Rate limiting via @nestjs/throttler

**Decision**: Global throttle = 60 req/min per IP. Auth endpoint overrides:
- `POST /auth/login` → 10 req/min per IP (strict)
- `POST /auth/refresh` → 20 req/min per IP
- All other routes → global 60 req/min

**Why**: `@nestjs/throttler` is the standard NestJS solution, integrates with decorators (`@SkipThrottle()`, `@Throttle()`), and supports Redis storage for distributed environments. MVP1 uses in-memory storage (single instance). Redis upgrade is a config-only swap later.

**Alternative considered**: Custom middleware — more work, no ecosystem support.

**Package**: `@nestjs/throttler` + `ThrottlerGuard` registered as global `APP_GUARD` (before `JwtAuthGuard`).

### D3: @IsStrongPassword() as shared decorator

**Decision**: Create `libs/common/src/decorators/is-strong-password.decorator.ts` using `class-validator` `registerDecorator()`. Rules: min 8 chars, ≥1 uppercase, ≥1 lowercase, ≥1 digit. No special char requirement (UX trade-off for Vietnamese staff on mobile).

**Why**: Centralized decorator so policy can be changed in one place and is consistent across `CreateUserDto.password`, `ChangePasswordDto.newPassword`, and any future password fields.

### D4: Login lockout via user_login_attempts table

**Decision**: New table `user_login_attempts(id, email, ip_address, tenant_id, attempted_at, success)`. On failed login, increment failure count for email in last 15 min window. If ≥ `LOGIN_MAX_FAILURES` (default 5), return `429 Too Many Requests` and optionally lock user. Reset on successful login.

**Why**: DB-backed attempts survive restarts. Throttler (D2) handles IP-level limits; this handles credential-specific lockout. Avoids user_enumeration: always return same generic error.

**Config env vars**: `LOGIN_MAX_FAILURES=5` (default), `LOGIN_LOCKOUT_WINDOW_MIN=15` (default).

### D5: AuditInterceptor store_id enrichment

**Decision**: `AuditInterceptor` already reads `req.params`. Extend it to also read `req.body.storeId` and `req.params.storeId`. For store-scoped controllers, the `store_id` will be present in one of those. Fall back to `null` if absent (tenant-level operations have no store).

**Why**: Minimal change to the interceptor. No new decorator needed. `store_id` is always present in request path or body for store-scoped mutations.

## Risks / Trade-offs

- **Refresh rotation breaks concurrent requests**: If a client fires two requests with the same refresh token simultaneously (e.g. mobile app background refresh + foreground request), the second will fail. Mitigation: Issue access tokens with 15 min expiry; well-behaved clients queue refresh requests.
- **In-memory throttler resets on restart**: Single-instance MVP is fine; scale-out requires Redis. Mitigation: ThrottlerModule uses storage adapter interface — Redis swap is `ThrottlerModule.forRootAsync({ storage: RedisThrottlerStorage })` when needed.
- **Login attempt table grows**: Cleanup job needed to purge old rows. Mitigation: Add `created_at` index + `DELETE FROM user_login_attempts WHERE attempted_at < now() - interval '30 days'` via a weekly cron.

## Migration Plan

1. New migration `1700000011000-AddSecurityEnhancements.ts`:
   - `ALTER TABLE refresh_tokens ADD COLUMN family_id UUID, ADD COLUMN replaced_by_hash VARCHAR(255)`
   - `CREATE INDEX idx_refresh_tokens_family ON refresh_tokens(family_id)`
   - `CREATE TABLE user_login_attempts(id, email, ip_address, tenant_id, attempted_at, success BOOLEAN, created_at)`
   - `CREATE INDEX idx_login_attempts_email_time ON user_login_attempts(email, attempted_at)`
2. Install `@nestjs/throttler` in `apps/api-gateway/package.json`
3. Deploy: no data migration needed, existing refresh tokens simply have `family_id = NULL` (tolerated by new code — treated as legacy tokens, no family revocation)
4. Rollback: revert migration, remove throttler guard, remove new auth service logic

## Open Questions

- Should login lockout lock the DB `users.status` field or just block at application level? **Decision**: Application-level only (avoid hard locks from automated scanning); DB lock reserved for admin action.
