import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum EntityType {
  CUSTOMER = 'customer',
  ASSET = 'asset',
  CONTRACT = 'contract',
  RECEIPT = 'receipt',
}

export class RequestUploadUrlDto {
  @IsEnum(EntityType)
  @ApiProperty()
  entityType: EntityType;

  @IsUUID()
  @ApiProperty()
  entityId: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional()
  storeId?: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  originalFilename: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  mimeType: string;

  @IsNumber()
  @Min(1)
  @ApiProperty()
  fileSize: number;
}

export class ConfirmUploadDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  uploadToken: string; // objectKey returned from requestUploadUrl

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional()
  fileSize?: number;
}

export class FileResponseDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  tenantId: string;
  @ApiProperty()
  entityType: string;
  @ApiProperty()
  entityId: string;
  @ApiProperty()
  originalFilename: string;
  @ApiProperty()
  mimeType: string;
  @ApiProperty()
  fileSize: number;
  @ApiProperty()
  uploadedBy: string;
  @ApiProperty()
  createdAt: Date;
}
