import { IsOptional, IsString, IsUUID, IsNumber, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuditQueryDto {
  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional()
  storeId?: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional()
  userId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  action?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  entityType?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  entityId?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional()
  dateTo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @ApiPropertyOptional()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @ApiPropertyOptional()
  limit?: number = 50;
}

export class AuditLogResponseDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  tenantId: string;
  @ApiProperty()
  storeId: string | null;
  @ApiProperty()
  userId: string | null;
  @ApiProperty()
  action: string;
  @ApiProperty()
  entityType: string;
  @ApiProperty()
  entityId: string | null;
  @ApiProperty()
  oldValue: any;
  @ApiProperty()
  newValue: any;
  @ApiProperty()
  ipAddress: string | null;
  @ApiProperty()
  userAgent: string | null;
  @ApiProperty()
  createdAt: Date;
}
