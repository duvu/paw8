# Spec: refresh-token-rotation

## Summary

Implement single-use refresh tokens with token family tracking to prevent refresh token replay and stolen token reuse.

## Background

Current `AuthService.refresh()` looks up a valid refresh token and issues a new access token without revoking the old refresh token. This means:
- A stolen refresh token can be replayed indefinitely until expiry (7 days)
- There is no way to detect that a token has been stolen and reused

Token family pattern: each login creates a `family_id` (UUID). Rotated tokens inherit the same `family_id`. If a revoked token from that family is used again, the entire family is revoked (detecting the theft).

## Schema Changes

File: `apps/api-gateway/src/database/migrations/1700000011000-AddSecurityEnhancements.ts`

```sql
ALTER TABLE refresh_tokens
  ADD COLUMN family_id UUID,
  ADD COLUMN replaced_by_hash VARCHAR(255);

CREATE INDEX idx_refresh_tokens_family ON refresh_tokens(family_id);
```

Existing rows with `family_id = NULL` are treated as legacy tokens — they are revoked on first use without family lookup (backward compatible).

## Repository Changes

File: `libs/auth/src/auth.repository.ts`

New methods:

```typescript
insertRefreshTokenWithFamily(
  userId: string,
  tokenHash: string,
  familyId: string,
  expiresAt: Date
): Promise<void>

revokeRefreshToken(tokenHash: string, replacedByHash?: string): Promise<void>
// UPDATE refresh_tokens SET revoked_at = now(), replaced_by_hash = $2
// WHERE token_hash = $1

revokeTokenFamily(familyId: string): Promise<void>
// UPDATE refresh_tokens SET revoked_at = now()
// WHERE family_id = $1 AND revoked_at IS NULL

findRefreshTokenByHash(tokenHash: string): Promise<{
  id: string;
  userId: string;
  familyId: string | null;
  expiresAt: Date;
  revokedAt: Date | null;
} | null>
```

Existing `insertRefreshToken()` is replaced by `insertRefreshTokenWithFamily()`.
Existing `revokeUserRefreshTokens()` retained for logout (revokes all user tokens).

## Service Changes

File: `libs/auth/src/auth.service.ts`

### login() — assign family ID

```typescript
const familyId = randomUUID();
const { tokenHash, token: refreshToken } = generateRefreshToken();
await this.authRepository.insertRefreshTokenWithFamily(
  user.id, tokenHash, familyId, expiresAt
);
```

### refresh() — rotate with reuse detection

```typescript
async refresh(refreshToken: string): Promise<TokenPair> {
  const incoming = hashToken(refreshToken);
  const record = await this.authRepository.findRefreshTokenByHash(incoming);

  if (!record) throw new UnauthorizedException('Invalid refresh token');

  // Reuse detection: token already revoked
  if (record.revokedAt) {
    if (record.familyId) {
      await this.authRepository.revokeTokenFamily(record.familyId);
    }
    throw new UnauthorizedException('Token reuse detected — all sessions invalidated');
  }

  if (record.expiresAt < new Date()) {
    throw new UnauthorizedException('Refresh token expired');
  }

  // Rotate: revoke old token, issue new one in same family
  const newFamilyId = record.familyId ?? randomUUID();
  const { tokenHash: newHash, token: newRefreshToken } = generateRefreshToken();
  await this.authRepository.revokeRefreshToken(incoming, newHash);
  await this.authRepository.insertRefreshTokenWithFamily(
    record.userId, newHash, newFamilyId, newExpiresAt
  );

  const accessToken = await this.generateAccessToken(record.userId);
  return { accessToken, refreshToken: newRefreshToken };
}
```

### logout() — revoke all tokens for user

```typescript
await this.authRepository.revokeUserRefreshTokens(userId);
```

## Token Hashing

Refresh tokens are stored as hashes (SHA-256). The raw token is only ever returned to the client.

```typescript
import { createHash } from 'crypto';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function generateRefreshToken(): { token: string; tokenHash: string } {
  const token = randomUUID() + '-' + randomUUID();
  return { token, tokenHash: hashToken(token) };
}
```

## Verification

1. Login → receive `refreshToken` (token A)
2. POST `/auth/refresh` with token A → receive token B; token A now `revoked_at IS NOT NULL`
3. POST `/auth/refresh` with token A again → expect `401 Token reuse detected`
4. After step 3, POST `/auth/refresh` with token B → expect `401` (family revoked)
5. Login again → new session, new family — works normally
