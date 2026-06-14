import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles, CurrentUser, PlanLimitGuard, PlanLimitResource } from '../../common/src';
import type { CurrentUserData } from '../../common/src';
import { StoresService } from './stores.service';
import {
  CreateStoreDto,
  UpdateStoreDto,
  SetStoreStatusDto,
  AssignManagerDto,
} from './dto/store.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiTags('stores')
@ApiBearerAuth()
@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  @Roles('tenant_owner', 'tenant_admin')
  @UseGuards(PlanLimitGuard)
  @PlanLimitResource('stores')
  create(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateStoreDto,
  ) {
    return this.storesService.create(user.tenantId as string, dto);
  }

  @Get()
  @Roles('tenant_owner', 'tenant_admin', 'store_manager', 'accountant')
  findAll(
    @CurrentUser() user: CurrentUserData,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.storesService.findAll(user.tenantId as string, page, limit);
  }

  @Get(':id')
  @Roles('tenant_owner', 'tenant_admin', 'store_manager', 'staff', 'accountant')
  findOne(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.storesService.findOne(user.tenantId as string, id);
  }

  @Patch(':id')
  @Roles('tenant_owner', 'tenant_admin')
  update(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStoreDto,
  ) {
    return this.storesService.update(user.tenantId as string, id, dto);
  }

  @Patch(':id/status')
  @Roles('tenant_owner', 'tenant_admin')
  setStatus(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetStoreStatusDto,
  ) {
    return this.storesService.setStatus(user.tenantId as string, id, dto.status);
  }

  @Patch(':id/manager')
  @Roles('tenant_owner', 'tenant_admin')
  assignManager(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignManagerDto,
  ) {
    return this.storesService.assignManager(user.tenantId as string, id, dto.userId);
  }
}
