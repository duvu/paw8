import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TenantPlan {
  FREE = 'free',
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
}

export enum TenantStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  TRIAL = 'trial',
  EXPIRED = 'expired',
}

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  code: string;

  @IsOptional()
  @IsEnum(TenantPlan)
  @ApiPropertyOptional()
  plan?: TenantPlan = TenantPlan.FREE;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @ApiPropertyOptional()
  maxStores?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @ApiPropertyOptional()
  maxUsers?: number = 5;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional()
  trialEndDate?: string;
}

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional()
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional()
  code?: string;

  @IsOptional()
  @IsEnum(TenantPlan)
  @ApiPropertyOptional()
  plan?: TenantPlan;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @ApiPropertyOptional()
  maxStores?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @ApiPropertyOptional()
  maxUsers?: number;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional()
  trialEndDate?: string;

  @IsOptional()
  @IsEnum(TenantStatus)
  @ApiPropertyOptional()
  status?: TenantStatus;
}

export class SetTenantStatusDto {
  @IsEnum(TenantStatus)
  @ApiProperty()
  status: TenantStatus;
}

export class TenantResponseDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  name: string;
  @ApiProperty()
  code: string;
  @ApiProperty()
  status: string;
  @ApiProperty()
  plan: string;
  @ApiProperty()
  maxStores: number;
  @ApiProperty()
  maxUsers: number;
  @ApiProperty()
  trialEndDate: string | null;
  @ApiProperty()
  createdAt: Date;
}
