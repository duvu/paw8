import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, CurrentUser, Roles, Audit } from '../../common/src';
import type { CurrentUserData } from '../../common/src';
import { ContractsService } from './contracts.service';
import { ContractSchedulerService } from './contract-scheduler.service';
import {
  CreateContractDto,
  UpdateContractDto,
  UpdateContractStatusDto,
  ContractSearchDto,
} from './dto/contract.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('contracts')
@ApiBearerAuth()
@Controller('contracts')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ContractsController {
  constructor(
    private readonly contractsService: ContractsService,
    private readonly contractSchedulerService: ContractSchedulerService,
  ) {}

  @Post()
  @Roles('staff', 'store_manager', 'tenant_admin', 'tenant_owner')
  @Audit({ action: 'CREATE_CONTRACT', entityType: 'contract' })
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateContractDto) {
    return this.contractsService.create(user.tenantId!, user.sub, dto);
  }

  @Get()
  @Roles('tenant_owner', 'tenant_admin', 'store_manager', 'staff', 'accountant')
  findAll(@CurrentUser() user: CurrentUserData, @Query() searchDto: ContractSearchDto) {
    return this.contractsService.findAll(user.tenantId!, searchDto);
  }

  @Get('upcoming-due')
  @Roles('store_manager', 'tenant_admin', 'tenant_owner')
  getUpcomingDue(
    @CurrentUser() user: CurrentUserData,
    @Query('days') days?: string,
    @Query('storeId') storeId?: string,
  ) {
    const storeIds = storeId ? [storeId] : user.allowedStoreIds;
    return this.contractsService.getUpcomingDue(user.tenantId!, storeIds, days ? parseInt(days, 10) : 7);
  }

  @Get('overdue')
  @Roles('store_manager', 'tenant_admin', 'tenant_owner')
  getOverdue(
    @CurrentUser() user: CurrentUserData,
    @Query('storeId') storeId?: string,
  ) {
    const storeIds = storeId ? [storeId] : user.allowedStoreIds;
    return this.contractsService.getOverdue(user.tenantId!, storeIds);
  }

  @Post('run-overdue-check')
  @Roles('platform_admin', 'tenant_owner', 'tenant_admin')
  @HttpCode(HttpStatus.OK)
  async runOverdueCheck() {
    const [overdueResult, nearDueResult] = await Promise.all([
      this.contractSchedulerService.markOverdue(),
      this.contractSchedulerService.markNearDue(),
    ]);
    return { overdue: overdueResult, nearDue: nearDueResult };
  }

  @Get(':id')
  @Roles('tenant_owner', 'tenant_admin', 'store_manager', 'staff', 'accountant')
  findOne(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.contractsService.findOne(user.tenantId!, id);
  }

  @Patch(':id')
  @Roles('staff', 'store_manager', 'tenant_admin', 'tenant_owner')
  update(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: UpdateContractDto,
  ) {
    return this.contractsService.update(user.tenantId!, id, dto);
  }

  @Patch(':id/status')
  @Roles('store_manager', 'tenant_admin', 'tenant_owner')
  @Audit({ action: 'UPDATE_CONTRACT_STATUS', entityType: 'contract' })
  updateStatus(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: UpdateContractStatusDto,
    @Query('force') force?: string,
  ) {
    const forceFlag = force === 'true';
    return this.contractsService.updateStatus(user.tenantId!, id, dto.status, user.sub, forceFlag);
  }

  @Get(':id/allowed-transitions')
  @Roles('tenant_owner', 'tenant_admin', 'store_manager', 'staff', 'accountant')
  getAllowedTransitions(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    void user;
    return this.contractsService.getAllowedTransitionsForContract(user.tenantId!, id);
  }

  @Get(':id/pdf')
  @Roles('staff', 'store_manager', 'tenant_admin', 'tenant_owner')
  async getContractPdf(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('save') save: string,
    @Res() res: Response,
  ) {
    const buffer = await this.contractsService.generateContractPdf(user.tenantId!, id);
    if (save === 'true') {
      res.json({ message: 'save not yet implemented', size: buffer.length });
      return;
    }
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="contract-${id}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get(':id/extension/pdf')
  @Roles('staff', 'store_manager', 'tenant_admin', 'tenant_owner')
  async getExtensionPdf(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('save') save: string,
    @Res() res: Response,
  ) {
    const buffer = await this.contractsService.generateExtensionPdf(user.tenantId!, id);
    if (save === 'true') {
      res.json({ message: 'save not yet implemented', size: buffer.length });
      return;
    }
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="extension-${id}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
