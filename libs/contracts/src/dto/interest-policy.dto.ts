import {
  IsString,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsInt,
  Min,
  Max,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InterestType } from './contract.dto';

export class CreateInterestPolicyDto {
  @ApiProperty({ example: 'Standard 3%/month' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Default policy for standard loans' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ example: 3.0 })
  @IsNumber()
  @Min(0)
  @Max(100)
  interestRate: number;

  @ApiProperty({ enum: InterestType })
  @IsEnum(InterestType)
  interestType: InterestType;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  gracePeriodDays?: number;

  @ApiPropertyOptional({ example: 0.1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  lateFeeRate?: number;

  @ApiPropertyOptional({ example: 5000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  storageFeeDailyVnd?: number;

  @ApiPropertyOptional({ example: 0.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  extensionFeeRate?: number;

  @ApiPropertyOptional({ example: 1000000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minLoanAmount?: number;

  @ApiPropertyOptional({ example: 100000000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxLoanAmount?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  minDurationDays?: number;

  @ApiPropertyOptional({ example: 365 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxDurationDays?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateInterestPolicyDto {
  @ApiPropertyOptional({ example: 'VIP 2%/month' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: 2.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  interestRate?: number;

  @ApiPropertyOptional({ enum: InterestType })
  @IsOptional()
  @IsEnum(InterestType)
  interestType?: InterestType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  gracePeriodDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  lateFeeRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  storageFeeDailyVnd?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  extensionFeeRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  minLoanAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxLoanAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  minDurationDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  maxDurationDays?: number;
}

export interface InterestPolicyResponseDto {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  interestRate: number;
  interestType: InterestType;
  gracePeriodDays: number;
  lateFeeRate: number;
  storageFeeDailyVnd: number;
  extensionFeeRate: number;
  minLoanAmount: number | null;
  maxLoanAmount: number | null;
  minDurationDays: number;
  maxDurationDays: number;
  isDefault: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}
