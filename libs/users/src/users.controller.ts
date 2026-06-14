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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, CurrentUser, Roles, PlanLimitGuard, PlanLimitResource } from '../../common/src';
import type { CurrentUserData } from '../../common/src';
import { UsersService } from './users.service';
import {
  CreateUserDto,
  UpdateUserDto,
  SetStatusDto,
  AssignStoreDto,
} from './dto/user.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('tenant_owner', 'tenant_admin')
  @UseGuards(PlanLimitGuard)
  @PlanLimitResource('users')
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateUserDto) {
    return this.usersService.create(user.tenantId!, dto);
  }

  @Get()
  @Roles('tenant_owner', 'tenant_admin', 'store_manager')
  findAll(
    @CurrentUser() user: CurrentUserData,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.usersService.findAll(user.tenantId!, page, limit);
  }

  @Get(':id')
  @Roles('tenant_owner', 'tenant_admin', 'store_manager')
  findOne(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.usersService.findOne(user.tenantId!, id);
  }

  @Patch(':id')
  @Roles('tenant_owner', 'tenant_admin')
  update(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(user.tenantId!, id, dto);
  }

  @Patch(':id/status')
  @Roles('tenant_owner', 'tenant_admin')
  setStatus(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: SetStatusDto,
  ) {
    return this.usersService.setStatus(user.tenantId!, id, dto.status);
  }

  @Post(':id/stores')
  @Roles('tenant_owner', 'tenant_admin')
  @HttpCode(HttpStatus.OK)
  assignStores(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: AssignStoreDto,
  ) {
    return this.usersService.assignStores(user.tenantId!, id, dto);
  }
}
