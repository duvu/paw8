import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { CurrentUserData } from '../decorators/current-user.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

export const AUDIT_ACTION_KEY = 'audit_action';

export interface AuditMeta {
  action: string;
  entityType?: string;
}

/**
 * Automatically inserts audit_log rows for decorated endpoints.
 * Usage: @Audit({ action: 'CREATE_CONTRACT', entityType: 'contract' })
 * (registered globally as APP_INTERCEPTOR — no @UseInterceptors needed)
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // Skip for public routes
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return next.handle();

    const auditMeta = this.reflector.getAllAndOverride<AuditMeta>(
      AUDIT_ACTION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!auditMeta) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<{
      user: CurrentUserData;
      ip: string;
      headers: Record<string, string>;
      params: Record<string, string>;
      body: Record<string, unknown>;
    }>();
    const user: CurrentUserData = request.user;
    const ip = request.ip;
    const userAgent = request.headers['user-agent'];

    const storeId: string | null =
      request.params?.storeId ??
      (request.body?.storeId as string | undefined) ??
      null;

    return next.handle().pipe(
      tap(async (responseBody: Record<string, unknown>) => {
        try {
          const entityId = responseBody?.id ??
            responseBody?.contractId ??
            responseBody?.customerId ??
            request.params?.id ??
            request.params?.contractId ?? null;

          await this.dataSource.query(
            `INSERT INTO audit_logs
              (id, tenant_id, store_id, user_id, action, entity_type, entity_id, new_value, ip_address, user_agent)
             VALUES
              (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8::inet, $9)`,
            [
              user?.tenantId ?? null,
              storeId,
              user?.sub ?? null,
              auditMeta.action,
              auditMeta.entityType ?? null,
              entityId ?? null,
              responseBody ? JSON.stringify(responseBody) : null,
              ip,
              userAgent,
            ],
          );
        } catch {
          // Audit failure must never break the main request
        }
      }),
    );
  }
}
