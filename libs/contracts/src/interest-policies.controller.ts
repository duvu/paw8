import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseUUIDPipe,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { InterestPoliciesService } from './interest-policies.service';
import { CreateInterestPolicyDto, UpdateInterestPolicyDto } from './dto/interest-policy.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles, CurrentUser } from '../../common/src';
import type { CurrentUserData } from '../../common/src';

@ApiTags('interest-policies')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('interest-policies')
export class InterestPoliciesController {
  constructor(private readonly interestPoliciesService: InterestPoliciesService) {}

  @Post()
  @Roles('tenant_owner', 'tenant_admin')
  create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateInterestPolicyDto) {
    if (!user.tenantId) throw new ForbiddenException('Tenant context required');
    return this.interestPoliciesService.create(user.tenantId, dto);
  }

  @Get()
  @Roles('tenant_owner', 'tenant_admin', 'store_manager', 'staff', 'accountant')
  findAll(
    @CurrentUser() user: CurrentUserData,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    if (!user.tenantId) throw new ForbiddenException('Tenant context required');
    return this.interestPoliciesService.findAll(user.tenantId, page, limit);
  }

  @Get(':id')
  @Roles('tenant_owner', 'tenant_admin', 'store_manager', 'staff', 'accountant')
  findOne(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    if (!user.tenantId) throw new ForbiddenException('Tenant context required');
    return this.interestPoliciesService.findOne(user.tenantId, id);
  }

  @Patch(':id')
  @Roles('tenant_owner', 'tenant_admin')
  update(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInterestPolicyDto,
  ) {
    if (!user.tenantId) throw new ForbiddenException('Tenant context required');
    return this.interestPoliciesService.update(user.tenantId, id, dto);
  }

  @Post(':id/set-default')
  @Roles('tenant_owner', 'tenant_admin')
  @HttpCode(HttpStatus.OK)
  setDefault(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    if (!user.tenantId) throw new ForbiddenException('Tenant context required');
    return this.interestPoliciesService.setDefault(user.tenantId, id);
  }
}
