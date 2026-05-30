import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
  HOLDING = 'holding',
  REDEEMED = 'redeemed',
  OVERDUE = 'overdue',
  PENDING_LIQUIDATION = 'pending_liquidation',
  LIQUIDATED = 'liquidated',
}

export class CreateAssetDto {
  @IsEnum(AssetType)
  @ApiProperty()
  assetType: AssetType;

  @IsString()
  @ApiProperty()
  assetName: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  brand?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  model?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  color?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  serialNumber?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  imei?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  licensePlate?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  chassisNumber?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  engineNumber?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  conditionDescription?: string;

  @IsNumber()
  @IsPositive()
  @ApiProperty()
  valuationAmount: number;

  @IsNumber()
  @IsPositive()
  @ApiProperty()
  proposedLoanAmount: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  locationCode?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  locationNote?: string;
}

export class UpdateAssetDto {
  @IsOptional()
  @IsEnum(AssetType)
  @ApiPropertyOptional()
  assetType?: AssetType;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  assetName?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  brand?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  model?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  color?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  serialNumber?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  imei?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  licensePlate?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  chassisNumber?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  engineNumber?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  conditionDescription?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @ApiPropertyOptional()
  valuationAmount?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @ApiPropertyOptional()
  proposedLoanAmount?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  locationCode?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  locationNote?: string;

  @IsOptional()
  @IsEnum(AssetStatus)
  @ApiPropertyOptional()
  status?: AssetStatus;
}

export class UpdateAssetStatusDto {
  @IsEnum(AssetStatus)
  @ApiProperty()
  status: AssetStatus;
}

export class AssetSearchDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  query?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  storeId?: string;

  @IsOptional()
  @IsEnum(AssetStatus)
  @ApiPropertyOptional()
  status?: AssetStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @ApiPropertyOptional()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @ApiPropertyOptional()
  limit?: number;
}

export class AssetResponseDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  tenantId: string;
  @ApiProperty()
  storeId: string;
  @ApiProperty()
  assetType: string;
  @ApiProperty()
  assetName: string;
  @ApiProperty()
  status: string;
  @ApiProperty()
  valuationAmount: number;
  @ApiProperty()
  proposedLoanAmount: number;
  @ApiProperty()
  createdAt: Date;
  @ApiPropertyOptional()
  contractId?: string | null;
}
