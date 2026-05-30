import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import { LoginDto, ChangePasswordDto } from './dto/auth.dto';
import { AuthRepository } from './auth.repository';

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
    const user = await this.authRepository.findUserWithRoleByEmail(dto.email);

    if (!user) {
      await this.logAudit(null, null, 'LOGIN_FAILED', null, null, ip, userAgent);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === 'locked') {
      throw new ForbiddenException('Account is locked');
    }

    if (user.tenant_id) {
      const tenant = await this.authRepository.findTenantStatus(user.tenant_id);
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

    const accessToken = this.jwtService.sign(payload, {
      secret: this.privateKey,
      algorithm: 'RS256',
      expiresIn: (process.env.JWT_ACCESS_TOKEN_EXPIRES_IN ?? '15m') as any,
    });

    const refreshTokenPlain = crypto.randomBytes(40).toString('hex');
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshTokenPlain)
      .digest('hex');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.authRepository.insertRefreshToken(user.id, refreshTokenHash, expiresAt);
    await this.logAudit(user.tenant_id, user.id, 'LOGIN', 'user', user.id, ip, userAgent);

    return { accessToken, refreshToken: refreshTokenPlain, expiresIn: 900 };
  }

  async refresh(refreshToken: string) {
    const tokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    const stored = await this.authRepository.findRefreshTokenWithUser(tokenHash);

    if (!stored) {
      throw new UnauthorizedException('Invalid or expired refresh token');
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

    return { accessToken, expiresIn: 900 };
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
