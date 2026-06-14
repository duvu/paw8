# Spec: login-lockout

## Summary

Track failed login attempts per email address and block logins when the failure count exceeds a configurable threshold within a rolling time window.

## Schema

File: `apps/api-gateway/src/database/migrations/1700000011000-AddSecurityEnhancements.ts`

```sql
CREATE TABLE user_login_attempts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL,
  ip_address    VARCHAR(64),
  tenant_id     UUID,
  attempted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  success       BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_login_attempts_email_time
  ON user_login_attempts(email, attempted_at);
```

Note: no FK constraint on `tenant_id` — platform admin logins have no tenant; `tenant_id` may be null.

## Repository Changes

File: `libs/auth/src/auth.repository.ts`

New methods:

```typescript
insertLoginAttempt(
  email: string,
  ipAddress: string | null,
  tenantId: string | null,
  success: boolean
): Promise<void>

countRecentFailures(
  email: string,
  windowMinutes: number
): Promise<number>
// SELECT COUNT(*) FROM user_login_attempts
// WHERE email = $1
//   AND success = false
//   AND attempted_at > now() - ($2 || ' minutes')::interval

resetLoginAttempts(email: string): Promise<void>
// DELETE FROM user_login_attempts
// WHERE email = $1 AND success = false
```

## Service Changes

File: `libs/auth/src/auth.service.ts`

### login() — lockout check + attempt tracking

```typescript
async login(dto: LoginDto, ipAddress?: string): Promise<TokenPair> {
  const maxFailures = parseInt(process.env.LOGIN_MAX_FAILURES ?? '5', 10);
  const windowMin = parseInt(process.env.LOGIN_LOCKOUT_WINDOW_MIN ?? '15', 10);

  // 1. Check lockout BEFORE attempting password verify
  const recentFailures = await this.authRepository.countRecentFailures(dto.email, windowMin);
  if (recentFailures >= maxFailures) {
    throw new HttpException(
      `Too many failed attempts. Try again in ${windowMin} minutes.`,
      HttpStatus.TOO_MANY_REQUESTS
    );
  }

  // 2. Find user (same as before)
  const user = await this.authRepository.findUserWithRoleByEmail(dto.email);
  const tenant = user ? await this.authRepository.findTenantStatus(user.tenantId) : null;

  // 3. Verify password
  const valid = user && (await bcrypt.compare(dto.password, user.passwordHash));

  // 4. Record attempt (success or failure)
  await this.authRepository.insertLoginAttempt(
    dto.email,
    ipAddress ?? null,
    user?.tenantId ?? null,
    !!valid
  );

  if (!valid) {
    // Generic error — never reveal whether email exists
    throw new UnauthorizedException('Invalid credentials');
  }

  // 5. Reset failure counter on successful login
  await this.authRepository.resetLoginAttempts(dto.email);

  // ... rest of login logic (check tenant status, issue tokens)
}
```

### AuthController — pass IP address

File: `libs/auth/src/auth.controller.ts`

```typescript
@Post('login')
@Throttle({ global: { ttl: 60000, limit: 10 } })
@Public()
async login(
  @Body() dto: LoginDto,
  @Req() req: Request,
) {
  const ip = req.headers['x-forwarded-for']?.toString() ?? req.socket.remoteAddress;
  return this.authService.login(dto, ip);
}
```

## Configuration

`.env.example`:

```
LOGIN_MAX_FAILURES=5
LOGIN_LOCKOUT_WINDOW_MIN=15
```

## Security Considerations

- **Anti-enumeration**: Always return `401 Invalid credentials` on wrong password — even after lockout is bypassed. Lockout returns `429` but with a generic message; email existence is never confirmed.
- **IP-level coverage**: `@nestjs/throttler` (D2) handles IP-level brute force. This table handles credential-targeted attacks across multiple IPs.
- **Application-level only**: Lockout does NOT set `users.status = 'locked'`. The lockout is time-bound and lifts automatically. Admin can manually lock a user via `PUT /users/:id/status` if needed.
- **Cleanup**: Old attempts accumulate. Add a monthly cron (`@Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)`) in `ContractSchedulerService` or a separate `AuthSchedulerService` to delete rows older than 30 days:
  ```sql
  DELETE FROM user_login_attempts WHERE attempted_at < now() - interval '30 days'
  ```

## Verification

1. Login with wrong password 5× in 1 min → 6th attempt returns `429 Too Many Requests`
2. Wait 15 min (or test with `LOGIN_LOCKOUT_WINDOW_MIN=1`) → login succeeds with correct password
3. Successful login resets failure counter → fresh 5-failure window
4. Login with correct password on first attempt → `200` (no lockout triggered)
5. Check `user_login_attempts` table: rows with `success=false` for failed, `success=true` for success
