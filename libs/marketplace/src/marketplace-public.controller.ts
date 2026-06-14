import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { MarketplaceService } from './marketplace.service';
import { Public } from '../../common/src/decorators/public.decorator';
import { CreateInquiryDto, InquiryResponseDto } from './dto/buyer-inquiry.dto';
import { PublicListingResponseDto } from './dto/marketplace-listing.dto';
import { TenantsRepository } from '../../tenants/src/tenants.repository';

@ApiTags('Marketplace (Public)')
@Public()
@Controller('marketplace/public')
export class MarketplacePublicController {
  constructor(
    private readonly marketplaceService: MarketplaceService,
    private readonly tenantsRepo: TenantsRepository,
  ) {}

  private async resolveTenantId(tenant: string): Promise<string> {
    if (!tenant) throw new BadRequestException('tenant query param is required');
    const found = await this.tenantsRepo.findByCode(tenant.toUpperCase());
    if (!found) throw new NotFoundException(`Tenant '${tenant}' not found`);
    return found.id;
  }

  @Get('listings')
  @ApiOperation({ summary: 'Browse active marketplace listings (no auth)' })
  @ApiQuery({ name: 'tenant', required: true, description: 'Tenant code (e.g. MT-HN01)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getPublicListings(
    @Query('tenant') tenantCode: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{ items: PublicListingResponseDto[]; total: number }> {
    const tenantId = await this.resolveTenantId(tenantCode);
    return this.marketplaceService.getPublicListings(
      tenantId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('listings/:id')
  @ApiOperation({ summary: 'Get public listing detail with asset photos' })
  @ApiQuery({ name: 'tenant', required: true, description: 'Tenant code' })
  async getPublicListingById(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('tenant') tenantCode: string,
  ): Promise<PublicListingResponseDto> {
    const tenantId = await this.resolveTenantId(tenantCode);
    return this.marketplaceService.getPublicListingWithPhotos(tenantId, id);
  }

  @Post('listings/:id/inquiries')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a buyer inquiry (rate limited: 5/min per IP)' })
  @ApiQuery({ name: 'tenant', required: true, description: 'Tenant code' })
  @ApiResponse({ status: 201, description: 'Inquiry submitted' })
  async createInquiry(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('tenant') tenantCode: string,
    @Body() dto: CreateInquiryDto,
  ): Promise<InquiryResponseDto> {
    const tenantId = await this.resolveTenantId(tenantCode);
    return this.marketplaceService.createInquiry(tenantId, id, dto);
  }
}
