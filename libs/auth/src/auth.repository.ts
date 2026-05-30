import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AuthRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

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

  async insertRefreshToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await this.dataSource.query(
      `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
       VALUES (gen_random_uuid(), $1, $2, $3)`,
      [userId, tokenHash, expiresAt],
    );
  }

  async findRefreshTokenWithUser(tokenHash: string): Promise<any | null> {
    const [row] = await this.dataSource.query(
      `SELECT rt.*, u.id as user_id, u.tenant_id, u.status,
              string_agg(DISTINCT r.name, ',') AS roles,
              array_agg(DISTINCT usa.store_id) FILTER (WHERE usa.store_id IS NOT NULL) AS store_ids
       FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       LEFT JOIN user_store_assignments usa ON usa.user_id = u.id
       WHERE rt.token_hash = $1 AND rt.revoked_at IS NULL AND rt.expires_at > now()
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
