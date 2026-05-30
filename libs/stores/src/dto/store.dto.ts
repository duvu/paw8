import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum StoreStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export class CreateStoreDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  code: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  address?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  phone?: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional()
  managerUserId?: string;
}

export class UpdateStoreDto {
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
  @IsString()
  @ApiPropertyOptional()
  address?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  phone?: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional()
  managerUserId?: string;

  @IsOptional()
  @IsEnum(StoreStatus)
  @ApiPropertyOptional()
  status?: StoreStatus;
}

export class SetStoreStatusDto {
  @IsEnum(StoreStatus)
  @ApiProperty()
  status: StoreStatus;
}

export class AssignManagerDto {
  @IsUUID()
  @ApiProperty()
  userId: string;
}

export class StoreResponseDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  tenantId: string;
  @ApiProperty()
  name: string;
  @ApiProperty()
  code: string;
  @ApiProperty()
  address: string | null;
  @ApiProperty()
  phone: string | null;
  @ApiProperty()
  managerUserId: string | null;
  @ApiProperty()
  status: string;
  @ApiProperty()
  createdAt: Date;
}
