import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, CurrentUser, Roles } from '../../common/src';
import type { CurrentUserData } from '../../common/src';
import { TransactionsService } from './transactions.service';
import {
  RecordTransactionDto,
  CalculateSettlementDto,
  ExtendContractDto,
  VoidTransactionDto,
} from './dto/transaction.dto';

@Controller('transactions')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @Roles('staff', 'store_manager', 'tenant_admin', 'tenant_owner')
  @HttpCode(HttpStatus.CREATED)
  recordTransaction(@CurrentUser() user: CurrentUserData, @Body() dto: RecordTransactionDto) {
    const storeId = user.allowedStoreIds[0] ?? '';
    return this.transactionsService.recordTransaction(user.tenantId!, storeId, user.sub, dto);
  }

  @Get('contract/:contractId')
  getByContract(@CurrentUser() user: CurrentUserData, @Param('contractId') contractId: string) {
    return this.transactionsService.getByContract(user.tenantId!, contractId);
  }

  @Post('calculate-settlement')
  calculateSettlement(@CurrentUser() user: CurrentUserData, @Body() dto: CalculateSettlementDto) {
    return this.transactionsService.calculateSettlement(user.tenantId!, dto.contractId, dto.settlementDate);
  }

  @Post('extend')
  @Roles('staff', 'store_manager', 'tenant_admin', 'tenant_owner')
  @HttpCode(HttpStatus.CREATED)
  extendContract(@CurrentUser() user: CurrentUserData, @Body() dto: ExtendContractDto) {
    const storeId = user.allowedStoreIds[0] ?? '';
    return this.transactionsService.extendContract(user.tenantId!, storeId, user.sub, dto);
  }

  @Post(':id/void')
  @Roles('store_manager', 'tenant_admin', 'tenant_owner')
  @HttpCode(HttpStatus.CREATED)
  voidTransaction(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: VoidTransactionDto,
  ) {
    return this.transactionsService.voidTransaction(user.tenantId!, id, user.sub, dto.reason);
  }
}
