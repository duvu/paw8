# Spec: rate-limiting

## Summary

Apply `@nestjs/throttler` globally with stricter overrides on authentication endpoints to prevent brute-force and credential stuffing attacks.

## Package

Install in `apps/api-gateway/package.json`:

```json
"@nestjs/throttler": "^6"
```

## Module Configuration

File: `apps/api-gateway/src/app.module.ts`

```typescript
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'global',
        ttl: 60000,   // 60 seconds window
        limit: 60,    // 60 requests per window per IP
      },
    ]),
    // ... existing imports
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // ... existing providers (ThrottlerGuard runs before JwtAuthGuard)
  ],
})
```

Note: `ThrottlerGuard` as `APP_GUARD` runs in the global guards pipeline. NestJS applies guards in registration order, so `ThrottlerGuard` (first `APP_GUARD`) runs before `JwtAuthGuard`.

## Auth Controller Overrides

File: `libs/auth/src/auth.controller.ts`

```typescript
import { Throttle, SkipThrottle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  @Post('login')
  @Throttle({ global: { ttl: 60000, limit: 10 } })  // 10 req/min per IP
  @Public()
  async login(@Body() dto: LoginDto) { ... }

  @Post('refresh')
  @Throttle({ global: { ttl: 60000, limit: 20 } })  // 20 req/min per IP
  @Public()
  async refresh(@Body() dto: RefreshTokenDto) { ... }

  @Post('logout')
  // inherits global (60/min) — fine for auth'd users
  async logout(...) { ... }

  @Post('change-password')
  @Throttle({ global: { ttl: 60000, limit: 10 } })  // 10 req/min
  async changePassword(...) { ... }
}
```

## Rate Limit Response

When limit exceeded, `ThrottlerGuard` returns `429 Too Many Requests`:

```json
{
  "statusCode": 429,
  "message": "ThrottlerException: Too Many Requests"
}
```

Headers included: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

## Public Routes

Routes decorated with `@Public()` are NOT exempt from throttler — they still rate-limit by IP. This is intentional: login/refresh endpoints must be rate-limited precisely because they are public.

`@SkipThrottle()` can be applied to health check endpoint:

```typescript
@Get('health')
@SkipThrottle()
health() { return { status: 'ok' }; }
```

## Scaling Path

Current: in-memory storage (single instance, resets on restart).

Future (Redis): swap to `@nestjs/throttler-storage-redis`:

```typescript
ThrottlerModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (config) => ({
    throttlers: [{ ttl: 60000, limit: 60 }],
    storage: new ThrottlerStorageRedisService(config.get('REDIS_URL')),
  }),
})
```

This is a config-only change with no code modifications to controllers.

## Verification

1. Fire 11 POST `/auth/login` requests within 60s from same IP → 11th returns `429`
2. Fire 21 POST `/auth/refresh` requests within 60s → 21st returns `429`
3. Regular authenticated API request at 61st in 60s window → `429`
4. After window expires → requests succeed again
