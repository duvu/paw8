import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export enum EntityType {
  CUSTOMER = 'customer',
  ASSET = 'asset',
  CONTRACT = 'contract',
  RECEIPT = 'receipt',
}

export class RequestUploadUrlDto {
  @IsEnum(EntityType)
  entityType: EntityType;

  @IsUUID()
  entityId: string;

  @IsOptional()
  @IsUUID()
  storeId?: string;

  @IsNotEmpty()
  @IsString()
  originalFilename: string;

  @IsNotEmpty()
  @IsString()
  mimeType: string;

  @IsNumber()
  @Min(1)
  fileSize: number;
}

export class ConfirmUploadDto {
  @IsNotEmpty()
  @IsString()
  uploadToken: string; // objectKey returned from requestUploadUrl

  @IsOptional()
  @IsNumber()
  fileSize?: number;
}

export class FileResponseDto {
  id: string;
  tenantId: string;
  entityType: string;
  entityId: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  uploadedBy: string;
  createdAt: Date;
}
