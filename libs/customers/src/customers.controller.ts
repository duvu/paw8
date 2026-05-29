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
import { RolesGuard, CurrentUser } from '../../common/src';
import type { CurrentUserData } from '../../common/src';
import { CustomersService } from './customers.service';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerSearchDto,
} from './dto/customer.dto';

@Controller('customers')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateCustomerDto) {
    const storeId = user.allowedStoreIds[0] ?? '';
    return this.customersService.create(user.tenantId!, storeId, user.sub, dto);
  }

  @Get()
  search(
    @CurrentUser() user: CurrentUserData,
    @Query() searchDto: CustomerSearchDto,
  ) {
    return this.customersService.search(user.tenantId!, searchDto);
  }

  @Get(':id')
  findOne(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.customersService.findOne(user.tenantId!, id);
  }

  @Get(':id/contracts')
  getContractHistory(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    return this.customersService.getContractHistory(user.tenantId!, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(user.tenantId!, id, dto);
  }
}
