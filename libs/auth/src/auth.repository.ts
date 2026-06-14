import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AuthRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  private async loginAttemptTableExists(): Promise<boolean> {
    const [row] = await this.dataSource.query(
      `SELECT EXISTS (
         SELECT 1
         FROM information_schema.tables
         WHERE table_schema = 'public'
           AND table_name = 'user_login_attempts'
       ) AS exists`,
    );
    return row?.exists === true || row?.exists === 't';
  }

  async findUserWithRoleByEmail(email: string): Promise<any | null> {
    const [user] = await this.dataSource.query(
      `SELECT u.id, u.tenant_id, u.email, u.password_hash, u.status,
              string_agg(DISTINCT r.name, ',') AS roles,
              array_agg(DISTINCT usa.store_id) FILTER (WHERE usa.store_id IS NOT NULL) AS store_ids
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       LEFT JOIN user_store_assignments usa ON usa.user_id = u.id
       WHERE u.email = $1
       GROUP BY u.id`,
      [email],
    );
    return user ?? null;
  }

  async findTenantStatus(tenantId: string): Promise<{ status: string } | null> {
    const [tenant] = await this.dataSource.query(
      `SELECT status FROM tenants WHERE id = $1`,
      [tenantId],
    );
    return tenant ?? null;
  }

  // Legacy: used for logout (revokeAll) — keep this
  async insertRefreshToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await this.dataSource.query(
      `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
       VALUES (gen_random_uuid(), $1, $2, $3)`,
      [userId, tokenHash, expiresAt],
    );
  }

  /** Group 5: Insert refresh token with family tracking */
  async insertRefreshTokenWithFamily(
    userId: string,
    tokenHash: string,
    familyId: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.dataSource.query(
      `INSERT INTO refresh_tokens (id, user_id, token_hash, family_id, expires_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
      [userId, tokenHash, familyId, expiresAt],
    );
  }

  /** Group 5: Revoke a single specific token (mark it as replaced + revoked) */
  async revokeSpecificToken(tokenHash: string, replacedByHash: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE refresh_tokens
       SET revoked_at = now(), replaced_by_hash = $2
       WHERE token_hash = $1`,
      [tokenHash, replacedByHash],
    );
  }

  /** Group 5: Revoke all tokens in a family (reuse detection) */
  async revokeTokenFamily(familyId: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE refresh_tokens
       SET revoked_at = now()
       WHERE family_id = $1 AND revoked_at IS NULL`,
      [familyId],
    );
  }

  async findRefreshTokenWithUser(tokenHash: string): Promise<any | null> {
    const [row] = await this.dataSource.query(
      `SELECT rt.id, rt.token_hash, rt.family_id, rt.replaced_by_hash, rt.revoked_at, rt.expires_at,
              u.id as user_id, u.tenant_id, u.status,
              string_agg(DISTINCT r.name, ',') AS roles,
              array_agg(DISTINCT usa.store_id) FILTER (WHERE usa.store_id IS NOT NULL) AS store_ids
       FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       LEFT JOIN user_store_assignments usa ON usa.user_id = u.id
       WHERE rt.token_hash = $1 AND rt.expires_at > now()
       GROUP BY rt.id, u.id`,
      [tokenHash],
    );
    return row ?? null;
  }

  async revokeUserRefreshTokens(userId: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE refresh_tokens SET revoked_at = now()
       WHERE user_id = $1 AND revoked_at IS NULL`,
      [userId],
    );
  }

  async findUserById(userId: string): Promise<{ id: string; password_hash: string } | null> {
    const [user] = await this.dataSource.query(
      `SELECT id, password_hash FROM users WHERE id = $1`,
      [userId],
    );
    return user ?? null;
  }

  async updateUserPassword(userId: string, newHash: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2`,
      [newHash, userId],
    );
  }

  /** Group 4: Record a login attempt */
  async insertLoginAttempt(
    email: string,
    ip: string | null | undefined,
    tenantId: string | null | undefined,
    success: boolean,
  ): Promise<void> {
    if (!(await this.loginAttemptTableExists())) {
      return;
    }
    await this.dataSource.query(
      `INSERT INTO user_login_attempts (id, email, ip_address, tenant_id, attempted_at, success)
       VALUES (gen_random_uuid(), $1, $2::inet, $3, now(), $4)`,
      [email, ip ?? null, tenantId ?? null, success],
    );
  }

  /** Group 4: Count recent failures within a time window (milliseconds) */
  async countRecentFailures(email: string, windowMs: number): Promise<number> {
    if (!(await this.loginAttemptTableExists())) {
      return 0;
    }
    const windowSec = Math.floor(windowMs / 1000);
    const [row] = await this.dataSource.query(
      `SELECT COUNT(*) AS cnt
       FROM user_login_attempts
       WHERE email = $1
         AND success = false
         AND attempted_at > now() - make_interval(secs => $2)`,
      [email, windowSec],
    );
    return parseInt(row?.cnt ?? '0', 10);
  }

  async insertAuditLog(
    tenantId: string | null,
    userId: string | null,
    action: string,
    entityType: string | null,
    entityId: string | null,
    ip: string | undefined | null,
    userAgent: string | undefined | null,
  ): Promise<void> {
    await this.dataSource.query(
      `INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, ip_address, user_agent)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6::inet, $7)`,
      [tenantId, userId, action, entityType, entityId, ip, userAgent],
    );
  }
}
