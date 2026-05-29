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
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsOptional()
  @IsEnum(TenantPlan)
  plan?: TenantPlan = TenantPlan.FREE;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  maxStores?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  maxUsers?: number = 5;

  @IsOptional()
  @IsDateString()
  trialEndDate?: string;
}

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  code?: string;

  @IsOptional()
  @IsEnum(TenantPlan)
  plan?: TenantPlan;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  maxStores?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  maxUsers?: number;

  @IsOptional()
  @IsDateString()
  trialEndDate?: string;

  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatus;
}

export class SetTenantStatusDto {
  @IsEnum(TenantStatus)
  status: TenantStatus;
}

export class TenantResponseDto {
  id: string;
  name: string;
  code: string;
  status: string;
  plan: string;
  maxStores: number;
  maxUsers: number;
  trialEndDate: string | null;
  createdAt: Date;
}
