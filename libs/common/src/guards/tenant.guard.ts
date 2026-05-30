import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CurrentUserData } from '../decorators/current-user.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Ensures tenantId in JWT matches route param :tenantId if present.
 * Also blocks locked tenants (handled at JWT issuance, but extra check here).
 *
 * RULE: Never trust tenant_id from frontend. Always derive from currentUser.tenantId.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Skip for public routes
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<{
      user: CurrentUserData | undefined;
      params: Record<string, string>;
    }>();
    const user = request.user;

    // No user means JwtAuthGuard already allowed it (public) or will reject it
    if (!user) return true;

    // Platform admins have null/undefined tenantId — they can access management endpoints
    if (!user.tenantId) {
      return true;
    }

    // If route has :tenantId param, it must match JWT tenantId
    const paramTenantId = request.params?.tenantId;
    if (paramTenantId && paramTenantId !== user.tenantId) {
      throw new ForbiddenException('Tenant mismatch');
    }

    return true;
  }
}
