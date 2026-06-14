import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  MaxLength,
  IsPhoneNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInquiryDto {
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
  @IsEmail()
  @MaxLength(200)
  @ApiPropertyOptional()
  buyerEmail?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  message?: string;
}

export class InquiryResponseDto {
  id: string;
  tenantId: string;
  listingId: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string | null;
  message: string | null;
  createdAt: Date;
}
