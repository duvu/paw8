import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MarketplaceService } from './marketplace.service';
import { CurrentUser } from '../../common/src/decorators/current-user.decorator';
import { Roles } from '../../common/src/decorators/roles.decorator';
import {
  CreateListingDto,
  UpdateListingDto,
  SellListingDto,
  ListingSearchDto,
  ListingResponseDto,
} from './dto/marketplace-listing.dto';
import { InquiryResponseDto } from './dto/buyer-inquiry.dto';

@ApiTags('Marketplace (Authenticated)')
@ApiBearerAuth()
@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Post('listings')
  @Roles('tenant_owner', 'tenant_admin', 'store_manager', 'staff')
  @ApiOperation({ summary: 'Create a new marketplace listing' })
  @ApiResponse({ status: 201, description: 'Listing created' })
  async createListing(
    @CurrentUser() user: any,
    @Body() dto: CreateListingDto,
  ): Promise<ListingResponseDto> {
    const storeId = user.allowedStoreIds?.[0] ?? user.storeId;
    return this.marketplaceService.createListing(
      user.tenantId,
      storeId,
      dto,
      user.sub,
    );
  }

  @Get('listings')
  @Roles('tenant_owner', 'tenant_admin', 'store_manager', 'staff', 'accountant')
  @ApiOperation({ summary: 'List marketplace listings (authenticated)' })
  async findAll(
    @CurrentUser() user: any,
    @Query() query: ListingSearchDto,
  ): Promise<{ items: ListingResponseDto[]; total: number }> {
    return this.marketplaceService.findAll(user.tenantId, query);
  }

  @Get('listings/:id')
  @Roles('tenant_owner', 'tenant_admin', 'store_manager', 'staff', 'accountant')
  @ApiOperation({ summary: 'Get listing detail with asset photos' })
  async findOne(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ListingResponseDto> {
    return this.marketplaceService.getListingWithPhotos(user.tenantId, id);
  }

  @Patch('listings/:id')
  @Roles('tenant_owner', 'tenant_admin', 'store_manager', 'staff')
  @ApiOperation({ summary: 'Update listing details' })
  async updateListing(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateListingDto,
  ): Promise<ListingResponseDto> {
    return this.marketplaceService.updateListing(user.tenantId, id, dto, user.sub, user.allowedStoreIds?.[0] ?? user.storeId ?? '');
  }

  @Patch('listings/:id/publish')
  @Roles('tenant_owner', 'tenant_admin', 'store_manager', 'staff')
  @ApiOperation({ summary: 'Publish a draft listing' })
  async publishListing(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ListingResponseDto> {
    return this.marketplaceService.publishListing(user.tenantId, id, user.sub, user.allowedStoreIds?.[0] ?? user.storeId ?? '');
  }

  @Patch('listings/:id/cancel')
  @Roles('tenant_owner', 'tenant_admin', 'store_manager', 'staff')
  @ApiOperation({ summary: 'Cancel a listing' })
  async cancelListing(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ListingResponseDto> {
    return this.marketplaceService.cancelListing(user.tenantId, id, user.sub, user.allowedStoreIds?.[0] ?? user.storeId ?? '');
  }

  @Post('listings/:id/sell')
  @Roles('tenant_owner', 'tenant_admin', 'store_manager', 'staff')
  @ApiOperation({ summary: 'Execute sale — atomic liquidation transaction' })
  async executeSale(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SellListingDto,
  ): Promise<ListingResponseDto> {
    return this.marketplaceService.executeSale(
      user.tenantId,
      user.allowedStoreIds?.[0] ?? user.storeId ?? '',
      id,
      dto,
      user.sub,
    );
  }

  @Get('listings/:id/inquiries')
  @Roles('tenant_owner', 'tenant_admin', 'store_manager', 'staff')
  @ApiOperation({ summary: 'Get inquiries for a listing' })
  async getInquiries(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<InquiryResponseDto[]> {
    return this.marketplaceService.getInquiries(user.tenantId, id);
  }
}
