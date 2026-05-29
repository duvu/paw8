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
import { RolesGuard, CurrentUser, Roles } from '../../common/src';
import type { CurrentUserData } from '../../common/src';
import { AssetsService } from './assets.service';
import {
  CreateAssetDto,
  UpdateAssetDto,
  UpdateAssetStatusDto,
  AssetSearchDto,
} from './dto/asset.dto';

@Controller('assets')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get('inventory')
  getInventory(
    @CurrentUser() user: CurrentUserData,
    @Query('storeId') storeId?: string,
  ) {
    return this.assetsService.getInventory(user.tenantId!, storeId);
  }

  @Post()
  @Roles('staff', 'store_manager', 'tenant_admin', 'tenant_owner')
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateAssetDto) {
    const storeId = user.allowedStoreIds[0] ?? '';
    return this.assetsService.create(user.tenantId!, storeId, user.sub, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: CurrentUserData,
    @Query() searchDto: AssetSearchDto,
  ) {
    return this.assetsService.findAll(user.tenantId!, searchDto);
  }

  @Get(':id')
  findOne(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.assetsService.findOne(user.tenantId!, id);
  }

  @Patch(':id')
  @Roles('staff', 'store_manager', 'tenant_admin', 'tenant_owner')
  update(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: UpdateAssetDto,
  ) {
    return this.assetsService.update(user.tenantId!, id, dto);
  }

  @Patch(':id/status')
  @Roles('store_manager', 'tenant_admin', 'tenant_owner')
  updateStatus(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: UpdateAssetStatusDto,
  ) {
    return this.assetsService.updateStatus(user.tenantId!, id, dto.status);
  }
}
