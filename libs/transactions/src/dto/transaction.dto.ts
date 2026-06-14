import {
  IsUUID,
  IsEnum,
  IsNumber,
  IsPositive,
  IsDateString,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TransactionType {
  DISBURSEMENT = 'disbursement',
  INTEREST_COLLECTION = 'interest_collection',
  FEE_COLLECTION = 'fee_collection',
  EXTENSION = 'extension',
  PARTIAL_PRINCIPAL = 'partial_principal',
  SETTLEMENT = 'settlement',
  ADJUSTMENT = 'adjustment',
  VOID = 'void',
  REVERSAL = 'reversal',
  LIQUIDATION_SALE = 'liquidation_sale',
}

export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  OTHER = 'other',
}

export class RecordTransactionDto {
  @IsUUID()
  @ApiProperty()
  contractId: string;

  @IsEnum(TransactionType)
  @ApiProperty()
  transactionType: TransactionType;

  @IsNumber()
  @IsPositive()
  @ApiProperty()
  amount: number;

  @IsEnum(PaymentMethod)
  @ApiProperty()
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional()
  transactionDate?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  note?: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional()
  referenceTransactionId?: string;
}

export class CalculateSettlementDto {
  @IsUUID()
  @ApiProperty()
  contractId: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional()
  settlementDate?: string;
}

export class ExtendContractDto {
  @IsUUID()
  @ApiProperty()
  contractId: string;

  @IsDateString()
  @ApiProperty()
  newDueDate: string;

  @IsNumber()
  @IsPositive()
  @ApiProperty()
  interestPaid: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional()
  feeAmount?: number;

  @IsEnum(PaymentMethod)
  @ApiProperty()
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  note?: string;
}

export class VoidTransactionDto {
  @IsString()
  @ApiProperty()
  reason: string;
}
