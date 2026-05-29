import {
  IsUUID,
  IsArray,
  ArrayMinSize,
  IsNumber,
  IsPositive,
  IsEnum,
  IsDateString,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum InterestType {
  DAILY = 'daily',
  MONTHLY = 'monthly',
  TERM = 'term',
}

export enum ContractStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  NEAR_DUE = 'near_due',
  OVERDUE = 'overdue',
  EXTENDED = 'extended',
  SETTLED = 'settled',
  CANCELLED = 'cancelled',
  LIQUIDATION_PENDING = 'liquidation_pending',
  LIQUIDATED = 'liquidated',
}

export class CreateContractDto {
  @IsUUID()
  storeId: string;

  @IsUUID()
  customerId: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  assetIds: string[];

  @IsNumber()
  @IsPositive()
  principalAmount: number;

  @IsNumber()
  @IsPositive()
  @Max(100)
  interestRate: number;

  @IsEnum(InterestType)
  interestType: InterestType;

  @IsDateString()
  startDate: Date;

  @IsDateString()
  dueDate: Date;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateContractDto {
  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: Date;
}

export class UpdateContractStatusDto {
  @IsEnum(ContractStatus)
  status: ContractStatus;
}

export class ContractSearchDto {
  @IsOptional()
  @IsString()
  contractCode?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsUUID()
  storeId?: string;

  @IsOptional()
  @IsEnum(ContractStatus)
  status?: ContractStatus;

  @IsOptional()
  @IsDateString()
  dueDateFrom?: Date;

  @IsOptional()
  @IsDateString()
  dueDateTo?: Date;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;
}

export interface AssetInfo {
  id: string;
  assetType: string;
  assetName: string;
  brand?: string;
  model?: string;
  status: string;
}

export interface CustomerInfo {
  id: string;
  fullName: string;
  phone: string;
  identityNumber: string;
}

export interface ContractResponseDto {
  id: string;
  tenantId: string;
  storeId: string;
  customerId: string;
  contractCode: string;
  principalAmount: number;
  interestRate: number;
  interestType: InterestType;
  startDate: Date;
  dueDate: Date;
  status: ContractStatus;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  assets: AssetInfo[];
  customer: CustomerInfo;
}
