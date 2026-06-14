import {
  IsUUID,
  IsString,
  IsOptional,
  IsNumber,
  IsPositive,
  IsEnum,
  MaxLength,
  IsNotEmpty,
  IsEmail,
  IsPhoneNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum ListingStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  SOLD = 'sold',
  CANCELLED = 'cancelled',
}

export class CreateListingDto {
  @IsUUID()
  @ApiProperty()
  assetId: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional()
  contractId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @ApiProperty()
  title: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  description?: string;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  @ApiProperty()
  listingPrice: number;
}

export class UpdateListingDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @ApiPropertyOptional()
  title?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  description?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  @ApiPropertyOptional()
  listingPrice?: number;
}

export class SellListingDto {
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  @ApiProperty({ description: 'Actual sale price' })
  soldPrice: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @ApiProperty()
  buyerName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @ApiProperty()
  buyerPhone: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @ApiPropertyOptional()
  buyerIdNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @ApiPropertyOptional({ enum: ['cash', 'bank_transfer', 'other'] })
  paymentMethod?: string;
}

export class ListingSearchDto {
  @IsOptional()
  @IsEnum(ListingStatus)
  @ApiPropertyOptional({ enum: ListingStatus })
  status?: ListingStatus;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional()
  storeId?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiPropertyOptional({ default: 1 })
  page?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiPropertyOptional({ default: 20 })
  limit?: number;
}

export class ListingResponseDto {
  id: string;
  tenantId: string;
  storeId: string;
  assetId: string;
  contractId: string | null;
  listingPrice: number;
  status: ListingStatus;
  title: string;
  description: string | null;
  createdBy: string;
  updatedBy: string | null;
  soldAt: Date | null;
  soldPrice: number | null;
  buyerName: string | null;
  buyerPhone: string | null;
  buyerIdNumber: string | null;
  paymentMethod: string | null;
  createdAt: Date;
  updatedAt: Date;
  photos?: Array<{ id: string; url: string; originalFilename: string }>;
}

export class PublicListingResponseDto {
  id: string;
  title: string;
  description: string | null;
  listingPrice: number;
  status: ListingStatus;
  assetId: string;
  createdAt: Date;
  photos?: Array<{ id: string; url: string }>;
}
