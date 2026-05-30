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
 * Validates that the store_id in the request body/params is within
 * currentUser.allowedStoreIds. Platform admins and tenant owners are exempt.
 */
@Injectable()
export class StoreScopeGuard implements CanActivate {
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
      body: Record<string, string>;
    }>();
    const user = request.user;

    // No user — skip (JwtAuthGuard will handle it)
    if (!user) return true;

    // Platform admins and tenant owners skip store scope check
    if (!user.tenantId || ['platform_admin', 'tenant_owner', 'tenant_admin'].includes(user.role)) {
      return true;
    }

    const storeId = request.params?.storeId ?? request.body?.storeId;
    if (!storeId) {
      return true; // no store param — allowed (filtering happens in service)
    }

    if (!user.allowedStoreIds.includes(storeId)) {
      throw new ForbiddenException(`Access to store '${storeId}' is not allowed`);
    }

    return true;
  }
}
