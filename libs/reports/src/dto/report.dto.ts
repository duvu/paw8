import { IsOptional, IsString, IsUUID, IsNumber, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DashboardQueryDto {
  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional()
  storeId?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional()
  dateTo?: string;
}

export class ReportQueryDto extends DashboardQueryDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  status?: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional()
  staffId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  assetType?: string;

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
  limit?: number = 20;
}
