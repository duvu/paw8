import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum AssetType {
  MOTORCYCLE = 'motorcycle',
  CAR = 'car',
  PHONE = 'phone',
  LAPTOP = 'laptop',
  WATCH = 'watch',
  JEWELRY = 'jewelry',
  ELECTRONICS = 'electronics',
  OTHER = 'other',
}

export enum AssetStatus {
  PAWNED = 'pawned',
  REDEEMED = 'redeemed',
  OVERDUE = 'overdue',
  PENDING_LIQUIDATION = 'pending_liquidation',
  LIQUIDATED = 'liquidated',
}

export class CreateAssetDto {
  @IsEnum(AssetType)
  assetType: AssetType;

  @IsString()
  assetName: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsOptional()
  @IsString()
  imei?: string;

  @IsOptional()
  @IsString()
  licensePlate?: string;

  @IsOptional()
  @IsString()
  chassisNumber?: string;

  @IsOptional()
  @IsString()
  engineNumber?: string;

  @IsOptional()
  @IsString()
  conditionDescription?: string;

  @IsNumber()
  @IsPositive()
  valuationAmount: number;

  @IsNumber()
  @IsPositive()
  proposedLoanAmount: number;

  @IsOptional()
  @IsString()
  locationCode?: string;

  @IsOptional()
  @IsString()
  locationNote?: string;
}

export class UpdateAssetDto {
  @IsOptional()
  @IsEnum(AssetType)
  assetType?: AssetType;

  @IsOptional()
  @IsString()
  assetName?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsOptional()
  @IsString()
  imei?: string;

  @IsOptional()
  @IsString()
  licensePlate?: string;

  @IsOptional()
  @IsString()
  chassisNumber?: string;

  @IsOptional()
  @IsString()
  engineNumber?: string;

  @IsOptional()
  @IsString()
  conditionDescription?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  valuationAmount?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  proposedLoanAmount?: number;

  @IsOptional()
  @IsString()
  locationCode?: string;

  @IsOptional()
  @IsString()
  locationNote?: string;

  @IsOptional()
  @IsEnum(AssetStatus)
  status?: AssetStatus;
}

export class UpdateAssetStatusDto {
  @IsEnum(AssetStatus)
  status: AssetStatus;
}

export class AssetSearchDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsString()
  storeId?: string;

  @IsOptional()
  @IsEnum(AssetStatus)
  status?: AssetStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  limit?: number;
}

export class AssetResponseDto {
  id: string;
  tenantId: string;
  storeId: string;
  assetType: string;
  assetName: string;
  status: string;
  valuationAmount: number;
  proposedLoanAmount: number;
  createdAt: Date;
  contractId?: string | null;
}
