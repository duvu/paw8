import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
} from 'class-validator';

export enum StoreStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export class CreateStoreDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsUUID()
  managerUserId?: string;
}

export class UpdateStoreDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  code?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsUUID()
  managerUserId?: string;

  @IsOptional()
  @IsEnum(StoreStatus)
  status?: StoreStatus;
}

export class SetStoreStatusDto {
  @IsEnum(StoreStatus)
  status: StoreStatus;
}

export class AssignManagerDto {
  @IsUUID()
  userId: string;
}

export class StoreResponseDto {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  managerUserId: string | null;
  status: string;
  createdAt: Date;
}
