import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, CurrentUser, Roles } from '../../common/src';
import type { CurrentUserData } from '../../common/src';
import { ReportsService } from './reports.service';
import { DashboardQueryDto, ReportQueryDto } from './dto/report.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @Roles('platform_admin', 'tenant_owner', 'tenant_admin', 'store_manager')
  getDashboard(
    @CurrentUser() user: CurrentUserData,
    @Query() query: DashboardQueryDto,
  ) {
    return this.reportsService.getDashboard(
      user.tenantId!,
      user.allowedStoreIds,
      query,
    );
  }

  @Get('contracts')
  @Roles('platform_admin', 'tenant_owner', 'tenant_admin', 'store_manager')
  getContractReport(
    @CurrentUser() user: CurrentUserData,
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getContractReport(
      user.tenantId!,
      user.allowedStoreIds,
      query,
    );
  }

  @Get('collections')
  @Roles('platform_admin', 'tenant_owner', 'tenant_admin', 'store_manager', 'accountant')
  getCollectionReport(
    @CurrentUser() user: CurrentUserData,
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getCollectionReport(
      user.tenantId!,
      user.allowedStoreIds,
      query,
    );
  }

  @Get('outstanding')
  @Roles('platform_admin', 'tenant_owner', 'tenant_admin', 'store_manager', 'accountant')
  getOutstandingReport(
    @CurrentUser() user: CurrentUserData,
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getOutstandingReport(
      user.tenantId!,
      user.allowedStoreIds,
      query,
    );
  }

  @Get('overdue')
  @Roles('platform_admin', 'tenant_owner', 'tenant_admin', 'store_manager')
  getOverdueReport(
    @CurrentUser() user: CurrentUserData,
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getOverdueReport(
      user.tenantId!,
      user.allowedStoreIds,
      query,
    );
  }

  @Get('stores')
  @Roles('platform_admin', 'tenant_owner', 'tenant_admin')
  getStoreReport(
    @CurrentUser() user: CurrentUserData,
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getStoreReport(user.tenantId!, query);
  }

  @Get('staff')
  @Roles('platform_admin', 'tenant_owner', 'tenant_admin', 'store_manager')
  getStaffReport(
    @CurrentUser() user: CurrentUserData,
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getStaffReport(
      user.tenantId!,
      user.allowedStoreIds,
      query,
    );
  }

  @Get('assets/inventory')
  getAssetInventoryReport(
    @CurrentUser() user: CurrentUserData,
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getAssetInventoryReport(
      user.tenantId!,
      user.allowedStoreIds,
      query,
    );
  }
}
