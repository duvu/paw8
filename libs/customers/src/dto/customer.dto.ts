import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerDto {
  @IsString()
  @ApiProperty()
  fullName: string;

  @IsString()
  @ApiProperty()
  phone: string;

  @IsString()
  @ApiProperty()
  identityNumber: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  permanentAddress?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  currentAddress?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  occupation?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  emergencyContactPhone?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  notes?: string;
}

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  fullName?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  phone?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  identityNumber?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  permanentAddress?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  currentAddress?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  occupation?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  emergencyContactPhone?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  notes?: string;
}

export class CustomerSearchDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  query?: string;

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

export class CustomerResponseDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  tenantId: string;
  @ApiProperty()
  fullName: string;
  @ApiProperty()
  phone: string;
  @ApiProperty()
  identityNumber: string;
  @ApiProperty()
  status: string;
  @ApiProperty()
  createdAt: Date;
  @ApiPropertyOptional()
  activeContracts?: number;
}
