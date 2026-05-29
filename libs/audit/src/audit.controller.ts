import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, CurrentUser, Roles } from '../../common/src';
import type { CurrentUserData } from '../../common/src';
import { AuditService } from './audit.service';
import { AuditQueryDto } from './dto/audit.dto';

@Controller('audit')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  @Roles('tenant_owner', 'tenant_admin', 'store_manager', 'accountant')
  getLogs(
    @CurrentUser() user: CurrentUserData,
    @Query() query: AuditQueryDto,
  ) {
    return this.auditService.query(user.tenantId!, query);
  }
}
