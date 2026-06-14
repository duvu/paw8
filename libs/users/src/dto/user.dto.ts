import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  IsEnum,
  IsArray,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsStrongPassword } from '../../../common/src/decorators/is-strong-password.decorator';

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
  @ApiProperty()
  email: string;

  @IsString()
  @ApiProperty()
  fullName: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  phone?: string;

  @IsString()
  @IsStrongPassword()
  @ApiProperty()
  password: string;

  @IsEnum(UserRole)
  @ApiProperty()
  role: UserRole;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  fullName?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  phone?: string;

  @IsOptional()
  @IsEnum(UserStatus)
  @ApiPropertyOptional()
  status?: UserStatus;
}

export class SetStatusDto {
  @IsEnum(UserStatus)
  @ApiProperty()
  status: UserStatus;
}

export class AssignStoreDto {
  @IsArray()
  @IsUUID('4', { each: true })
  @ApiProperty()
  storeIds: string[];
}

export class UserResponseDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  tenantId: string;
  @ApiProperty()
  email: string;
  @ApiProperty()
  fullName: string;
  @ApiProperty()
  phone: string | null;
  @ApiProperty()
  status: string;
  @ApiProperty()
  role: string;
  @ApiProperty()
  allowedStoreIds: string[];
  @ApiProperty()
  createdAt: Date;
}
