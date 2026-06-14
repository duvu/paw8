import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import { LoginDto, ChangePasswordDto } from './dto/auth.dto';
import { AuthRepository } from './auth.repository';

const LOGIN_MAX_FAILURES = parseInt(process.env.LOGIN_MAX_FAILURES ?? '5', 10);
const LOGIN_LOCKOUT_WINDOW_MS =
  parseInt(process.env.LOGIN_LOCKOUT_WINDOW_MIN ?? '15', 10) * 60 * 1000;

@Injectable()
export class AuthService {
  private readonly privateKey: string;

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
  ) {
    this.privateKey = readFileSync(
      process.env.JWT_PRIVATE_KEY_PATH ?? join(process.cwd(), 'keys/private.pem'),
      'utf8',
    );
  }

  async login(dto: LoginDto, ip?: string, userAgent?: string) {
    // Group 4: check lockout before touching the DB for user lookup
    const recentFailures = await this.authRepository.countRecentFailures(
      dto.email,
      LOGIN_LOCKOUT_WINDOW_MS,
    );
    if (recentFailures >= LOGIN_MAX_FAILURES) {
      throw new HttpException(
        'Too many failed login attempts. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const user = await this.authRepository.findUserWithRoleByEmail(dto.email);

    if (!user) {
      await this.authRepository.insertLoginAttempt(dto.email, ip, null, false);
      await this.logAudit(null, null, 'LOGIN_FAILED', null, null, ip, userAgent);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === 'locked') {
      await this.authRepository.insertLoginAttempt(dto.email, ip, user.tenant_id, false);
      throw new ForbiddenException('Account is locked');
    }

    if (user.tenant_id) {
      const tenant = await this.authRepository.findTenantStatus(user.tenant_id);
      if (tenant?.status === 'locked') {
        throw new ForbiddenException('Tenant account is locked. Please contact support.');
      }
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password_hash);
    if (!isPasswordValid) {
      await this.authRepository.insertLoginAttempt(dto.email, ip, user.tenant_id, false);
      await this.logAudit(user.tenant_id, user.id, 'LOGIN_FAILED', 'user', user.id, ip, userAgent);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Group 4: record successful login attempt
    await this.authRepository.insertLoginAttempt(dto.email, ip, user.tenant_id, true);

    const role = user.roles?.split(',')[0] ?? 'staff';
    const allowedStoreIds = user.store_ids?.filter(Boolean) ?? [];

    const payload = {
      sub: user.id,
      tenantId: user.tenant_id ?? null,
      role,
      allowedStoreIds,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.privateKey,
      algorithm: 'RS256',
      expiresIn: (process.env.JWT_ACCESS_TOKEN_EXPIRES_IN ?? '15m') as any,
    });

    // Group 5: issue refresh token with family ID
    const refreshTokenPlain = crypto.randomBytes(40).toString('hex');
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshTokenPlain)
      .digest('hex');
    const familyId = crypto.randomUUID();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.authRepository.insertRefreshTokenWithFamily(
      user.id,
      refreshTokenHash,
      familyId,
      expiresAt,
    );
    await this.logAudit(user.tenant_id, user.id, 'LOGIN', 'user', user.id, ip, userAgent);

    return { accessToken, refreshToken: refreshTokenPlain, expiresIn: 900 };
  }

  async refresh(refreshToken: string) {
    const tokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    // Group 5: fetch token row including revoked_at and replaced_by_hash
    const stored = await this.authRepository.findRefreshTokenWithUser(tokenHash);

    if (!stored) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Group 5: reuse detection — token already revoked
    if (stored.revoked_at) {
      // If it has a family_id, revoke entire family (token theft scenario)
      if (stored.family_id) {
        await this.authRepository.revokeTokenFamily(stored.family_id);
      }
      throw new UnauthorizedException('Refresh token reuse detected. Please log in again.');
    }

    if (stored.status === 'locked') {
      throw new ForbiddenException('Account is locked');
    }

    const role = stored.roles?.split(',')[0] ?? 'staff';
    const allowedStoreIds = stored.store_ids?.filter(Boolean) ?? [];
    const payload = { sub: stored.user_id, tenantId: stored.tenant_id ?? null, role, allowedStoreIds };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.privateKey,
      algorithm: 'RS256',
      expiresIn: (process.env.JWT_ACCESS_TOKEN_EXPIRES_IN ?? '15m') as any,
    });

    // Group 5: issue new refresh token with same family, revoke old one
    const newRefreshTokenPlain = crypto.randomBytes(40).toString('hex');
    const newRefreshTokenHash = crypto
      .createHash('sha256')
      .update(newRefreshTokenPlain)
      .digest('hex');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Revoke current token, mark replaced_by_hash for audit trail
    await this.authRepository.revokeSpecificToken(tokenHash, newRefreshTokenHash);

    // Insert new token in same family
    await this.authRepository.insertRefreshTokenWithFamily(
      stored.user_id,
      newRefreshTokenHash,
      stored.family_id ?? crypto.randomUUID(),
      expiresAt,
    );

    return { accessToken, refreshToken: newRefreshTokenPlain, expiresIn: 900 };
  }

  async logout(userId: string) {
    await this.authRepository.revokeUserRefreshTokens(userId);
    await this.logAudit(null, userId, 'LOGOUT', 'user', userId, null, null);
  }

  async changePassword(userId: string, tenantId: string | null, dto: ChangePasswordDto) {
    const user = await this.authRepository.findUserById(userId);
    if (!user) throw new UnauthorizedException('User not found');

    const isValid = await bcrypt.compare(dto.currentPassword, user.password_hash);
    if (!isValid) throw new UnauthorizedException('Current password is incorrect');

    const newHash = await bcrypt.hash(dto.newPassword, 12);
    await this.authRepository.updateUserPassword(userId, newHash);
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
      await this.authRepository.insertAuditLog(tenantId, userId, action, entityType, entityId, ip, userAgent);
    } catch { /* audit failures must not break main flow */ }
  }
}
