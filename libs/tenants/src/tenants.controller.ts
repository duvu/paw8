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
import { RolesGuard, Roles } from '../../common/src';
import { TenantsService } from './tenants.service';
import {
  CreateTenantDto,
  UpdateTenantDto,
  SetTenantStatusDto,
  OnboardTenantDto,
  SetTenantOwnerDto,
} from './dto/tenant.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiTags('tenants')
@ApiBearerAuth()
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @Roles('platform_admin')
  create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto);
  }

  @Post('onboard')
  @Roles('platform_admin')
  onboard(@Body() dto: OnboardTenantDto) {
    return this.tenantsService.onboard(dto);
  }

  @Get()
  @Roles('platform_admin')
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.tenantsService.findAll(page, limit);
  }

  @Get(':id')
  @Roles('platform_admin')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantsService.findOne(id);
  }

  @Get(':id/usage')
  @Roles('platform_admin')
  getUsage(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantsService.getUsage(id);
  }

  @Patch(':id')
  @Roles('platform_admin')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTenantDto,
  ) {
    return this.tenantsService.update(id, dto);
  }

  @Patch(':id/status')
  @Roles('platform_admin')
  setStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetTenantStatusDto,
  ) {
    return this.tenantsService.setStatus(id, dto.status);
  }

  @Post(':id/owner')
  @Roles('platform_admin')
  setOwner(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetTenantOwnerDto,
  ) {
    return this.tenantsService.setOwner(id, dto);
  }
}
