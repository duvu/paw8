import {
  IsUUID,
  IsEnum,
  IsNumber,
  IsPositive,
  IsDateString,
  IsOptional,
  IsString,
} from 'class-validator';

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
}

export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  OTHER = 'other',
}

export class RecordTransactionDto {
  @IsUUID()
  contractId: string;

  @IsEnum(TransactionType)
  transactionType: TransactionType;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsDateString()
  transactionDate: Date;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsUUID()
  referenceTransactionId?: string;
}

export class CalculateSettlementDto {
  @IsUUID()
  contractId: string;

  @IsDateString()
  settlementDate: Date;
}

export class ExtendContractDto {
  @IsUUID()
  contractId: string;

  @IsDateString()
  newDueDate: Date;

  @IsNumber()
  @IsPositive()
  interestPaid: number;

  @IsOptional()
  @IsNumber()
  feeAmount?: number;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  note?: string;
}

export class VoidTransactionDto {
  @IsString()
  reason: string;
}
