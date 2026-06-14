## Why

The system has full RBAC enforcement but several critical security gaps remain that block production go-live for a financial application: refresh tokens are never rotated on use (replay attack surface), rate limiting is absent on auth endpoints (brute-force risk), and password strength is not validated beyond minimum length. These are M2 roadmap items and are required before the first real deployment.

## What Changes

- **Refresh token rotation**: On each `/auth/refresh` call, the old token is revoked and a new refresh token is issued atomically — eliminates replay attack window.
- **Refresh token family tracking**: Detect refresh token reuse (stolen token scenario) by tracking token families; reuse of a revoked token triggers full family revocation.
- **Rate limiting on auth endpoints**: Apply `@nestjs/throttler` with strict limits on `POST /auth/login` and `POST /auth/refresh`; looser limits on all other routes.
- **Password strength validation**: Enforce minimum 8 chars, at least 1 uppercase, 1 lowercase, 1 digit on `CreateUserDto.password` and `ChangePasswordDto.newPassword` via custom class-validator decorator.
- **Store-scope audit enrichment**: Ensure `store_id` is captured in `audit_logs` for all mutations scoped to a store (currently `store_id` column exists but is not populated by the `AuditInterceptor`).
- **Login attempt tracking**: Record failed login attempts per email/IP; lock account after N consecutive failures (configurable).

## Capabilities

### New Capabilities
- `refresh-token-rotation`: Rotate refresh tokens on each use; detect and respond to token reuse by revoking entire family.
- `rate-limiting`: Per-endpoint throttle rules for login/refresh; global fallback throttle for all authenticated routes.
- `password-strength`: Custom class-validator decorator `@IsStrongPassword()` reused on user creation and password change DTOs.
- `login-lockout`: Track consecutive failed login attempts in `user_login_attempts` table; auto-lock after threshold; reset on successful login.

### Modified Capabilities
<!-- None — no existing spec-level behavior changes -->

## Impact

- `libs/auth/src/auth.service.ts` — `refresh()` now rotates token; `login()` records attempts + checks lockout
- `libs/auth/src/auth.repository.ts` — new methods: `revokeRefreshToken(tokenHash)`, `insertRefreshTokenWithFamily(...)`, `revokeTokenFamily(familyId)`, `upsertLoginAttempt(...)`, `resetLoginAttempts(...)`, `getLoginAttempts(...)`
- `apps/api-gateway/src/database/migrations/` — new migration: add `family_id` + `replaced_by_hash` to `refresh_tokens`; new table `user_login_attempts`
- `apps/api-gateway/src/app.module.ts` — add `ThrottlerModule.forRoot(...)` + `ThrottlerGuard` as global APP_GUARD
- `libs/auth/src/auth.controller.ts` — apply `@Throttle()` overrides on login/refresh endpoints
- `libs/common/src/decorators/` — new `is-strong-password.decorator.ts`
- `libs/users/src/dto/user.dto.ts` — apply `@IsStrongPassword()` to `CreateUserDto.password`
- `libs/auth/src/dto/auth.dto.ts` — apply `@IsStrongPassword()` to `ChangePasswordDto.newPassword`
- `libs/common/src/interceptors/audit.interceptor.ts` — extract `storeId` from request params/body and populate `store_id` in audit log
- `apps/api-gateway/package.json` — add `@nestjs/throttler`
