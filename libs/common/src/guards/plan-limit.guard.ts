import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ModuleRef } from '@nestjs/core';
import { CurrentUserData } from '../decorators/current-user.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

export const PLAN_LIMIT_RESOURCE_KEY = 'plan_limit_resource';

/**
 * Decorator to mark which resource type this endpoint creates.
 * Usage: @PlanLimitResource('stores') or @PlanLimitResource('users')
 */
export function PlanLimitResource(resource: 'stores' | 'users') {
  return Reflect.metadata(PLAN_LIMIT_RESOURCE_KEY, resource);
}

/**
 * Plan enforcement guard — blocks POST /stores and POST /users when
 * tenant has reached plan limits (max_stores / max_users).
 *
 * Platform admin bypass: platform_admin role skips this guard entirely.
 * Uses lazy injection via ModuleRef to avoid circular dependencies.
 */
@Injectable()
export class PlanLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly moduleRef: ModuleRef,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const resource = this.reflector.get<'stores' | 'users' | undefined>(
      PLAN_LIMIT_RESOURCE_KEY,
      context.getHandler(),
    );
    // No resource annotation — skip guard
    if (!resource) return true;

    const request = context.switchToHttp().getRequest<{ user: CurrentUserData | undefined }>();
    const user = request.user;
    if (!user) return false;

    // Platform admin bypasses plan limits
    if (user.role === 'platform_admin') return true;

    const tenantId = user.tenantId;
    if (!tenantId) return true;

    // Lazy-load TenantsService to avoid circular dep
    // TenantsService must be in the same DI context (imported into the module that registers this guard)
    let tenantsService: { getUsage: (id: string) => Promise<{ stores: { current: number; max: number }; users: { current: number; max: number } }> };
    try {
      tenantsService = await this.moduleRef.resolve(
        'TenantsService',
        undefined,
        { strict: false },
      );
    } catch {
      // If TenantsService not found in context, skip limit check gracefully
      return true;
    }

    const usage = await tenantsService.getUsage(tenantId);

    if (resource === 'stores' && usage.stores.current >= usage.stores.max) {
      throw new ForbiddenException(
        `Plan limit reached: your plan allows a maximum of ${usage.stores.max} store(s). Current: ${usage.stores.current}.`,
      );
    }

    if (resource === 'users' && usage.users.current >= usage.users.max) {
      throw new ForbiddenException(
        `Plan limit reached: your plan allows a maximum of ${usage.users.max} user(s). Current: ${usage.users.current}.`,
      );
    }

    return true;
  }
}
