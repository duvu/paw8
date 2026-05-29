import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import { LoginDto, ChangePasswordDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto, ip?: string, userAgent?: string) {
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
      [dto.email],
    );

    if (!user) {
      await this.logAudit(null, null, 'LOGIN_FAILED', null, null, ip, userAgent);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === 'locked') {
      throw new ForbiddenException('Account is locked');
    }

    // Check tenant status
    if (user.tenant_id) {
      const [tenant] = await this.dataSource.query(
        `SELECT status FROM tenants WHERE id = $1`,
        [user.tenant_id],
      );
      if (tenant?.status === 'locked') {
        throw new ForbiddenException('Tenant account is locked');
      }
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password_hash);
    if (!isPasswordValid) {
      await this.logAudit(user.tenant_id, user.id, 'LOGIN_FAILED', 'user', user.id, ip, userAgent);
      throw new UnauthorizedException('Invalid credentials');
    }

    const role = user.roles?.split(',')[0] ?? 'staff';
    const allowedStoreIds = user.store_ids?.filter(Boolean) ?? [];

    const payload = {
      sub: user.id,
      tenantId: user.tenant_id ?? null,
      role,
      allowedStoreIds,
    };

    const privateKey = readFileSync(
      process.env.JWT_PRIVATE_KEY_PATH ?? join(process.cwd(), 'keys/private.pem'),
    );

    const accessToken = this.jwtService.sign(payload, {
      secret: privateKey,
      algorithm: 'RS256',
      expiresIn: (process.env.JWT_ACCESS_TOKEN_EXPIRES_IN ?? '15m') as any,
    });

    // Generate refresh token
    const refreshTokenPlain = crypto.randomBytes(40).toString('hex');
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshTokenPlain)
      .digest('hex');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.dataSource.query(
      `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
       VALUES (gen_random_uuid(), $1, $2, $3)`,
      [user.id, refreshTokenHash, expiresAt],
    );

    await this.logAudit(user.tenant_id, user.id, 'LOGIN', 'user', user.id, ip, userAgent);

    return { accessToken, refreshToken: refreshTokenPlain, expiresIn: 900 };
  }

  async refresh(refreshToken: string) {
    const tokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    const [stored] = await this.dataSource.query(
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

    if (!stored) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (stored.status === 'locked') {
      throw new ForbiddenException('Account is locked');
    }

    const role = stored.roles?.split(',')[0] ?? 'staff';
    const allowedStoreIds = stored.store_ids?.filter(Boolean) ?? [];
    const payload = { sub: stored.user_id, tenantId: stored.tenant_id ?? null, role, allowedStoreIds };

    const privateKey = readFileSync(
      process.env.JWT_PRIVATE_KEY_PATH ?? join(process.cwd(), 'keys/private.pem'),
    );

    const accessToken = this.jwtService.sign(payload, {
      secret: privateKey,
      algorithm: 'RS256',
      expiresIn: (process.env.JWT_ACCESS_TOKEN_EXPIRES_IN ?? '15m') as any,
    });

    return { accessToken, expiresIn: 900 };
  }

  async logout(userId: string) {
    await this.dataSource.query(
      `UPDATE refresh_tokens SET revoked_at = now()
       WHERE user_id = $1 AND revoked_at IS NULL`,
      [userId],
    );
    await this.logAudit(null, userId, 'LOGOUT', 'user', userId, null, null);
  }

  async changePassword(userId: string, tenantId: string | null, dto: ChangePasswordDto) {
    const [user] = await this.dataSource.query(
      `SELECT id, password_hash FROM users WHERE id = $1`,
      [userId],
    );
    if (!user) throw new UnauthorizedException('User not found');

    const isValid = await bcrypt.compare(dto.currentPassword, user.password_hash);
    if (!isValid) throw new UnauthorizedException('Current password is incorrect');

    const newHash = await bcrypt.hash(dto.newPassword, 12);
    await this.dataSource.query(
      `UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2`,
      [newHash, userId],
    );
    await this.logAudit(tenantId, userId, 'CHANGE_PASSWORD', 'user', userId, null, null);
  }

  private async logAudit(
    tenantId: string | null,
    userId: string | null,
    action: string,
    entityType: string | null,
    entityId: string | null,
    ip: string | undefined | null,
    userAgent: string | undefined | null,
  ) {
    try {
      await this.dataSource.query(
        `INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, ip_address, user_agent)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6::inet, $7)`,
        [tenantId, userId, action, entityType, entityId, ip, userAgent],
      );
    } catch { /* audit failures must not break main flow */ }
  }
}
