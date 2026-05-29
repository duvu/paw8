import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  IsEnum,
  IsArray,
  IsUUID,
} from 'class-validator';

export enum UserRole {
  TENANT_OWNER = 'tenant_owner',
  TENANT_ADMIN = 'tenant_admin',
  STORE_MANAGER = 'store_manager',
  STAFF = 'staff',
  ACCOUNTANT = 'accountant',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  LOCKED = 'locked',
}

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  fullName: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsEnum(UserRole)
  role: UserRole;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}

export class SetStatusDto {
  @IsEnum(UserStatus)
  status: UserStatus;
}

export class AssignStoreDto {
  @IsArray()
  @IsUUID('4', { each: true })
  storeIds: string[];
}

export class UserResponseDto {
  id: string;
  tenantId: string;
  email: string;
  fullName: string;
  phone: string | null;
  status: string;
  role: string;
  allowedStoreIds: string[];
  createdAt: Date;
}
