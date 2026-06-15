import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, CurrentUser, Roles, Audit } from '../../common/src';
import type { CurrentUserData } from '../../common/src';
import { TransactionsService } from './transactions.service';
import {
  RecordTransactionDto,
  CalculateSettlementDto,
  ExtendContractDto,
  VoidTransactionDto,
} from './dto/transaction.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('transactions')
@ApiBearerAuth()
@Controller('transactions')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @Roles('staff', 'store_manager', 'tenant_admin', 'tenant_owner')
  @Audit({ action: 'RECORD_TRANSACTION', entityType: 'transaction' })
  @HttpCode(HttpStatus.CREATED)
  recordTransaction(@CurrentUser() user: CurrentUserData, @Body() dto: RecordTransactionDto) {
    const storeId = user.allowedStoreIds[0] ?? '';
    return this.transactionsService.recordTransaction(user.tenantId!, storeId, user.sub, dto);
  }

  @Get()
  @Roles('tenant_owner', 'tenant_admin', 'store_manager', 'staff', 'accountant')
  listTransactions(
    @CurrentUser() user: CurrentUserData,
    @Query('contractId') contractId: string,
  ) {
    return this.transactionsService.getByContract(user.tenantId!, contractId);
  }

  @Get('contract/:contractId')
  @Roles('tenant_owner', 'tenant_admin', 'store_manager', 'staff', 'accountant')
  getByContract(@CurrentUser() user: CurrentUserData, @Param('contractId') contractId: string) {
    return this.transactionsService.getByContract(user.tenantId!, contractId);
  }

  @Post('calculate-settlement')
  @Roles('tenant_owner', 'tenant_admin', 'store_manager', 'staff', 'accountant')
  calculateSettlement(@CurrentUser() user: CurrentUserData, @Body() dto: CalculateSettlementDto) {
    return this.transactionsService.calculateSettlement(user.tenantId!, dto.contractId, dto.settlementDate ?? new Date().toISOString());
  }

  @Post('extend')
  @Roles('staff', 'store_manager', 'tenant_admin', 'tenant_owner')
  @Audit({ action: 'EXTEND_CONTRACT', entityType: 'contract' })
  @HttpCode(HttpStatus.CREATED)
  extendContract(@CurrentUser() user: CurrentUserData, @Body() dto: ExtendContractDto) {
    const storeId = user.allowedStoreIds[0] ?? '';
    return this.transactionsService.extendContract(user.tenantId!, storeId, user.sub, dto);
  }

  @Post(':id/void')
  @Roles('store_manager', 'tenant_admin', 'tenant_owner')
  @Audit({ action: 'VOID_TRANSACTION', entityType: 'transaction' })
  @HttpCode(HttpStatus.CREATED)
  voidTransaction(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: VoidTransactionDto,
  ) {
    return this.transactionsService.voidTransaction(user.tenantId!, id, user.sub, dto.reason);
  }

  @Get(':id/receipt/pdf')
  @Roles('staff', 'store_manager', 'tenant_admin', 'tenant_owner')
  async getReceiptPdf(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Query('save') save: string,
    @Res() res: Response,
  ) {
    const buffer = await this.transactionsService.generateReceiptPdf(user.tenantId!, id);
    if (save === 'true') {
      res.json({ message: 'save not yet implemented', size: buffer.length });
      return;
    }
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="receipt-${id}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('settlement/:contractId/pdf')
  @Roles('staff', 'store_manager', 'tenant_admin', 'tenant_owner')
  async getSettlementPdf(
    @CurrentUser() user: CurrentUserData,
    @Param('contractId') contractId: string,
    @Query('save') save: string,
    @Res() res: Response,
  ) {
    const buffer = await this.transactionsService.generateSettlementPdf(user.tenantId!, contractId);
    if (save === 'true') {
      res.json({ message: 'save not yet implemented', size: buffer.length });
      return;
    }
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="settlement-${contractId}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
