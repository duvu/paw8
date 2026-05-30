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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, CurrentUser, Roles, Audit } from '../../common/src';
import type { CurrentUserData } from '../../common/src';
import { ContractsService } from './contracts.service';
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
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  @Roles('staff', 'store_manager', 'tenant_admin', 'tenant_owner')
  @Audit({ action: 'CREATE_CONTRACT', entityType: 'contract' })
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateContractDto) {
    return this.contractsService.create(user.tenantId!, user.sub, dto);
  }

  @Get()
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

  @Get(':id')
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
  ) {
    return this.contractsService.updateStatus(user.tenantId!, id, dto.status, user.sub);
  }
}
