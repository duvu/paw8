import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserData {
  sub: string;
  tenantId: string | null;
  role: string;
  allowedStoreIds: string[];
}

/**
 * Extracts the JWT payload set by JwtAuthGuard.
 * NEVER trust tenantId from request body/params — always use this.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserData => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as CurrentUserData;
  },
);
