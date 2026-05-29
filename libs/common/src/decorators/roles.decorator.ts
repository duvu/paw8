import { SetMetadata } from '@nestjs/common';
import { REQUIRED_ROLES_KEY } from '../guards/roles.guard';
import { AUDIT_ACTION_KEY, AuditMeta } from '../interceptors/audit.interceptor';

export const Roles = (...roles: string[]) => SetMetadata(REQUIRED_ROLES_KEY, roles);

export const Audit = (meta: AuditMeta) => SetMetadata(AUDIT_ACTION_KEY, meta);
