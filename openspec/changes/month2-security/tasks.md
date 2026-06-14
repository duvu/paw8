# Tasks: month2-security

## Apply Requirements
- spec-driven
- applyRequires: ["tasks"]

## Group 1: DB Migration — refresh_tokens family_id + user_login_attempts

- [x] 1.1 Create `apps/api-gateway/src/database/migrations/1700000011000-AddSecurityEnhancements.ts`
  - ALTER TABLE refresh_tokens ADD COLUMN family_id UUID
  - ALTER TABLE refresh_tokens ADD COLUMN replaced_by_hash VARCHAR(255)
  - CREATE INDEX idx_refresh_tokens_family ON refresh_tokens(family_id)
  - CREATE TABLE user_login_attempts(id UUID PK, email VARCHAR(255) NOT NULL, ip_address VARCHAR(64), tenant_id UUID, attempted_at TIMESTAMPTZ DEFAULT now(), success BOOLEAN NOT NULL DEFAULT false)
  - CREATE INDEX idx_login_attempts_email_time ON user_login_attempts(email, attempted_at)
  - Implement down() that drops index, table, and removes columns
- [x] 1.2 Run migration: `cd apps/api-gateway && DATABASE_URL=postgresql://paw8:paw8_dev_password@localhost:5433/paw8_dev npx ts-node -r tsconfig-paths/register node_modules/typeorm/cli.js migration:run -d src/database/data-source.ts`
- [x] 1.3 Verify via psql: `\d refresh_tokens` shows family_id + replaced_by_hash; `\d user_login_attempts` exists

## Group 2: Rate Limiting — @nestjs/throttler

- [x] 2.1 Install in `apps/api-gateway/package.json`: `pnpm add @nestjs/throttler --filter @paw8/api-gateway` (or direct to apps/api-gateway)
- [x] 2.2 Add `ThrottlerModule.forRoot([{ name: 'global', ttl: 60000, limit: 60 }])` to imports in `apps/api-gateway/src/app.module.ts`
- [x] 2.3 Add `{ provide: APP_GUARD, useClass: ThrottlerGuard }` to providers in `app.module.ts` (before JwtAuthGuard)
- [x] 2.4 Add `@Throttle({ global: { ttl: 60000, limit: 10 } })` to `login()` in `libs/auth/src/auth.controller.ts`
- [x] 2.5 Add `@Throttle({ global: { ttl: 60000, limit: 20 } })` to `refresh()` in auth.controller.ts
- [x] 2.6 Add `@Throttle({ global: { ttl: 60000, limit: 10 } })` to `changePassword()` in auth.controller.ts
- [x] 2.7 Add `@SkipThrottle()` to health endpoint in `apps/api-gateway/src/app.controller.ts`
- [x] 2.8 LSP diagnostics on app.module.ts and auth.controller.ts — expect 0 errors

## Group 3: Password Strength Decorator

- [x] 3.1 Create `libs/common/src/decorators/is-strong-password.decorator.ts` using `registerDecorator()` from class-validator
  - Regex: `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/`
  - Error message: 'Password must be at least 8 characters and include an uppercase letter, lowercase letter, and number'
- [x] 3.2 Export `IsStrongPassword` from `libs/common/src/index.ts` (or decorators barrel)
- [x] 3.3 Replace `@MinLength(8)` on `password` field in `libs/users/src/dto/user.dto.ts` with `@IsStrongPassword()`
  - Import from `../../common/src` (or relative path to decorator)
- [x] 3.4 Replace `@MinLength(8)` on `newPassword` field in `libs/auth/src/dto/auth.dto.ts` with `@IsStrongPassword()`
- [x] 3.5 LSP diagnostics on both DTO files — expect 0 errors

## Group 4: Login Lockout

- [x] 4.1 Add 3 new methods to `libs/auth/src/auth.repository.ts`:
  - `insertLoginAttempt(email, ipAddress, tenantId, success)` → INSERT INTO user_login_attempts
  - `countRecentFailures(email, windowMinutes)` → SELECT COUNT(*) WHERE email=$1 AND success=false AND attempted_at > now() - window
  - `resetLoginAttempts(email)` → DELETE FROM user_login_attempts WHERE email=$1 AND success=false
- [x] 4.2 Modify `AuthService.login()` in `libs/auth/src/auth.service.ts`:
  - Accept optional `ipAddress?: string` second param
  - Read `LOGIN_MAX_FAILURES` and `LOGIN_LOCKOUT_WINDOW_MIN` from process.env (defaults: 5, 15)
  - Before password check: call `countRecentFailures(dto.email, windowMin)` → if ≥ maxFailures, throw `HttpException(message, 429)`
  - After bcrypt compare: call `insertLoginAttempt(...)` regardless of success/failure
  - On successful login: call `resetLoginAttempts(dto.email)`
- [x] 4.3 Modify `login()` in `libs/auth/src/auth.controller.ts` to extract IP from `@Req() req` and pass to `authService.login(dto, ip)`
  - Import `Request` from `@nestjs/common` (or `express`)
  - `const ip = req.headers['x-forwarded-for']?.toString() ?? req.socket.remoteAddress`
- [x] 4.4 Add env vars to `.env.example`:
  ```
  LOGIN_MAX_FAILURES=5
  LOGIN_LOCKOUT_WINDOW_MIN=15
  ```
- [x] 4.5 LSP diagnostics on auth.service.ts and auth.controller.ts — expect 0 errors

## Group 5: Refresh Token Rotation

- [x] 5.1 Add helper functions in `libs/auth/src/auth.service.ts` (or a new `libs/auth/src/token.utils.ts`):
  - `hashToken(token: string): string` — SHA-256 hex
  - `generateRefreshToken(): { token: string; tokenHash: string }` — uses `randomUUID()` + `randomUUID()` joined, then hashed
- [x] 5.2 Add 4 new methods to `libs/auth/src/auth.repository.ts`:
  - `insertRefreshTokenWithFamily(userId, tokenHash, familyId, expiresAt)` — INSERT with family_id
  - `revokeRefreshToken(tokenHash, replacedByHash?)` — UPDATE SET revoked_at=now(), replaced_by_hash=$2 WHERE token_hash=$1
  - `revokeTokenFamily(familyId)` — UPDATE SET revoked_at=now() WHERE family_id=$1 AND revoked_at IS NULL
  - `findRefreshTokenByHash(tokenHash)` — SELECT id, user_id, family_id, expires_at, revoked_at WHERE token_hash=$1
- [x] 5.3 Modify `AuthService.login()` to use `insertRefreshTokenWithFamily()` with new `familyId = randomUUID()`
  - Replace raw token string with `generateRefreshToken()` helper
  - Pass `familyId` to `insertRefreshTokenWithFamily()`
- [x] 5.4 Rewrite `AuthService.refresh()` with rotation + reuse detection:
  - Hash incoming token
  - Call `findRefreshTokenByHash(hash)` — if not found, throw `UnauthorizedException`
  - If `revokedAt IS NOT NULL` → reuse detected → if familyId exists, call `revokeTokenFamily(familyId)` → throw `UnauthorizedException('Token reuse detected')`
  - If `expiresAt < now()` → throw `UnauthorizedException('Refresh token expired')`
  - Generate new token via `generateRefreshToken()`
  - Call `revokeRefreshToken(oldHash, newHash)` atomically
  - Call `insertRefreshTokenWithFamily(userId, newHash, familyId, newExpiresAt)`
  - Return new access token + new refresh token
- [x] 5.5 LSP diagnostics on auth.service.ts and auth.repository.ts — expect 0 errors

## Group 6: Audit Store ID Enrichment

- [x] 6.1 Read `libs/common/src/interceptors/audit.interceptor.ts` to understand current implementation
- [x] 6.2 Modify `AuditInterceptor` to extract `store_id` from:
  - `req.params.storeId` (route param)
  - `req.body?.storeId` (body field)
  - Fall back to `null` if neither present
- [x] 6.3 Pass extracted `storeId` to the audit log insert alongside the existing fields
- [x] 6.4 LSP diagnostics on audit.interceptor.ts — expect 0 errors

## Group 7: Integration Verification

- [x] 7.1 `cd apps/api-gateway && npx tsc --noEmit --project tsconfig.json 2>&1 | grep -v "node_modules\|test/" | head -30` — expect 0 source errors
- [x] 7.2 Start server on port 3008: `DATABASE_URL=postgresql://paw8:paw8_dev_password@localhost:5433/paw8_dev NODE_ENV=development APP_PORT=3008 JWT_PRIVATE_KEY_PATH=/tmp/jwt.key JWT_PUBLIC_KEY_PATH=/tmp/jwt.pub MINIO_ENDPOINT=localhost MINIO_PORT=9000 MINIO_ACCESS_KEY=minioadmin MINIO_SECRET_KEY=minioadmin MINIO_BUCKET=paw8 SCHEDULER_ENABLED=false LOGIN_MAX_FAILURES=3 LOGIN_LOCKOUT_WINDOW_MIN=1 npx ts-node -r tsconfig-paths/register src/main.ts`
- [x] 7.3 Test rate limiting: fire 11 login requests → expect 10th OK, 11th `429`
- [x] 7.4 Test login lockout: login with wrong password 3× within 1 min (LOGIN_MAX_FAILURES=3) → 4th attempt returns `429`
- [x] 7.5 Test refresh token rotation: login → get token A → refresh with A → get token B → refresh with A again → expect `401 Token reuse detected`
- [x] 7.6 Test password strength: `POST /api/v1/users` with password `weakpass` → expect `400` with message about uppercase/digit
- [x] 7.7 Test password strength: `POST /api/v1/users` with password `Passw0rd` → expect `201` (or `400` if email conflict, but no password error)
