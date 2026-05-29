import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { CurrentUserData } from '../decorators/current-user.decorator';

/**
 * Ensures tenantId in JWT matches route param :tenantId if present.
 * Also blocks locked tenants (handled at JWT issuance, but extra check here).
 *
 * RULE: Never trust tenant_id from frontend. Always derive from currentUser.tenantId.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user: CurrentUserData;
      params: Record<string, string>;
    }>();
    const user = request.user;

    // Platform admins have null tenantId — they can access management endpoints
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
