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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum InterestType {
  DAILY = 'daily',
  MONTHLY = 'monthly',
  PER_PERIOD = 'per_period',
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
  @ApiProperty()
  storeId: string;

  @IsUUID()
  @ApiProperty()
  customerId: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  @ApiProperty()
  assetIds: string[];

  @IsNumber()
  @IsPositive()
  @ApiProperty()
  principalAmount: number;

  @IsNumber()
  @IsPositive()
  @Max(100)
  @ApiProperty()
  interestRate: number;

  @IsEnum(InterestType)
  @ApiProperty()
  interestType: InterestType;

  @IsDateString()
  @ApiProperty()
  startDate: string;

  @IsDateString()
  @ApiProperty()
  dueDate: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional()
  policyId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  notes?: string;
}

export class UpdateContractDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  notes?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional()
  dueDate?: string;
}

export class UpdateContractStatusDto {
  @IsEnum(ContractStatus)
  @ApiProperty()
  status: ContractStatus;
}

export class ContractSearchDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  contractCode?: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional()
  customerId?: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional()
  storeId?: string;

  @IsOptional()
  @IsEnum(ContractStatus)
  @ApiPropertyOptional()
  status?: ContractStatus;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional()
  dueDateFrom?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional()
  dueDateTo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @ApiPropertyOptional()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @ApiPropertyOptional()
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
