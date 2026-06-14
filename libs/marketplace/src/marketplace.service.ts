import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { MarketplaceRepository } from './marketplace.repository';
import { TransactionsRepository } from '../../transactions/src/transactions.repository';
import { AssetsRepository } from '../../assets/src/assets.repository';
import { AuditService } from '../../audit/src/audit.service';
import { FilesRepository } from '../../files/src/files.repository';
import { MinioService } from '../../files/src/minio.service';
import {
  CreateListingDto,
  UpdateListingDto,
  SellListingDto,
  ListingSearchDto,
  ListingResponseDto,
  PublicListingResponseDto,
  ListingStatus,
} from './dto/marketplace-listing.dto';
import { CreateInquiryDto, InquiryResponseDto } from './dto/buyer-inquiry.dto';
import { TransactionType, PaymentMethod } from '../../transactions/src/dto/transaction.dto';
import { ContractStatus } from '../../contracts/src/dto/contract.dto';

const PRESIGNED_URL_EXPIRY = 3600; // 1 hour

@Injectable()
export class MarketplaceService {
  constructor(
    private readonly marketplaceRepo: MarketplaceRepository,
    private readonly transactionsRepo: TransactionsRepository,
    private readonly assetsRepo: AssetsRepository,
    private readonly filesRepo: FilesRepository,
    private readonly minioService: MinioService,
    private readonly auditService: AuditService,
  ) {}

  async createListing(
    tenantId: string,
    storeId: string,
    dto: CreateListingDto,
    createdBy: string,
  ): Promise<ListingResponseDto> {
    // Verify asset belongs to tenant
    const asset = await this.assetsRepo.findById(tenantId, dto.assetId);
    if (!asset) throw new NotFoundException('Asset not found');

    const row = await this.marketplaceRepo.insertListing(tenantId, storeId, {
      assetId: dto.assetId,
      contractId: dto.contractId ?? null,
      listingPrice: dto.listingPrice,
      title: dto.title,
      description: dto.description ?? null,
      createdBy,
    });

    this.auditService.log({
      tenantId,
      storeId,
      userId: createdBy,
      action: 'marketplace.listing.create',
      entityType: 'marketplace_listing',
      entityId: row.id,
      newValue: { listingPrice: dto.listingPrice, title: dto.title },
    });

    return this.mapListingRow(row);
  }

  async updateListing(
    tenantId: string,
    id: string,
    dto: UpdateListingDto,
    updatedBy: string,
    storeId: string,
  ): Promise<ListingResponseDto> {
    const existing = await this.marketplaceRepo.findListingById(tenantId, id);
    if (!existing) throw new NotFoundException('Listing not found');
    if (existing.status === ListingStatus.SOLD || existing.status === ListingStatus.CANCELLED) {
      throw new BadRequestException('Cannot update a sold or cancelled listing');
    }

    const row = await this.marketplaceRepo.updateListing(tenantId, id, {
      title: dto.title,
      description: dto.description,
      listingPrice: dto.listingPrice,
      updatedBy,
    });

    this.auditService.log({
      tenantId,
      storeId,
      userId: updatedBy,
      action: 'marketplace.listing.update',
      entityType: 'marketplace_listing',
      entityId: id,
      oldValue: { listingPrice: existing.listing_price, title: existing.title },
      newValue: { listingPrice: dto.listingPrice, title: dto.title },
    });

    return this.mapListingRow(row);
  }

  async publishListing(
    tenantId: string,
    id: string,
    updatedBy: string,
    storeId: string,
  ): Promise<ListingResponseDto> {
    const existing = await this.marketplaceRepo.findListingById(tenantId, id);
    if (!existing) throw new NotFoundException('Listing not found');
    if (existing.status !== ListingStatus.DRAFT) {
      throw new BadRequestException('Only draft listings can be published');
    }

    const row = await this.marketplaceRepo.updateListing(tenantId, id, {
      status: ListingStatus.ACTIVE,
      updatedBy,
    });

    this.auditService.log({
      tenantId,
      storeId,
      userId: updatedBy,
      action: 'marketplace.listing.publish',
      entityType: 'marketplace_listing',
      entityId: id,
    });

    return this.mapListingRow(row);
  }

  async cancelListing(
    tenantId: string,
    id: string,
    updatedBy: string,
    storeId: string,
  ): Promise<ListingResponseDto> {
    const existing = await this.marketplaceRepo.findListingById(tenantId, id);
    if (!existing) throw new NotFoundException('Listing not found');
    if (existing.status === ListingStatus.SOLD) {
      throw new BadRequestException('Cannot cancel a sold listing');
    }

    const row = await this.marketplaceRepo.updateListing(tenantId, id, {
      status: ListingStatus.CANCELLED,
      updatedBy,
    });

    this.auditService.log({
      tenantId,
      storeId,
      userId: updatedBy,
      action: 'marketplace.listing.cancel',
      entityType: 'marketplace_listing',
      entityId: id,
    });

    return this.mapListingRow(row);
  }

  async findAll(tenantId: string, searchDto: ListingSearchDto): Promise<{ items: ListingResponseDto[]; total: number }> {
    const { items, total } = await this.marketplaceRepo.findListings(tenantId, {
      status: searchDto.status,
      storeId: searchDto.storeId,
      page: searchDto.page,
      limit: searchDto.limit,
    });
    return { items: items.map(this.mapListingRow), total };
  }

  async findOne(tenantId: string, id: string): Promise<ListingResponseDto> {
    const row = await this.marketplaceRepo.findListingById(tenantId, id);
    if (!row) throw new NotFoundException('Listing not found');
    return this.mapListingRow(row);
  }

  /**
   * executeSale — atomic DB transaction:
   * 1. SELECT listing FOR UPDATE
   * 2. Insert liquidation_sale transaction record
   * 3. Update asset status to 'redeemed'
   * 4. Update listing status to 'sold'
   * 5. If contract linked: update contract status to 'liquidated' + insert status history
   * 6. Audit log
   */
  async executeSale(
    tenantId: string,
    storeId: string,
    listingId: string,
    dto: SellListingDto,
    soldBy: string,
  ): Promise<ListingResponseDto> {
    return this.marketplaceRepo.transaction(async (manager) => {
      // 1. Lock listing row
      const listing = await this.marketplaceRepo.findListingByIdForUpdate(tenantId, listingId, manager);
      if (!listing) throw new NotFoundException('Listing not found');
      if (listing.status !== ListingStatus.ACTIVE) {
        throw new BadRequestException('Only active listings can be sold');
      }
      if (listing.tenant_id !== tenantId) throw new ForbiddenException('Access denied');

      // 2. Insert liquidation_sale transaction (only if contract is linked)
      if (listing.contract_id) {
        await this.transactionsRepo.insertTransaction(
          tenantId,
          listing.store_id,
          {
            contractId: listing.contract_id,
            transactionType: TransactionType.LIQUIDATION_SALE,
            amount: dto.soldPrice,
            paymentMethod: dto.paymentMethod ?? PaymentMethod.CASH,
            transactionDate: new Date(),
            note: `Bán thanh lý tài sản - ${dto.buyerName}`,
            createdBy: soldBy,
          },
          manager,
        );

        // 5. Update contract to 'liquidated' + history
        await this.transactionsRepo.updateContractStatus(tenantId, listing.contract_id, ContractStatus.LIQUIDATED, soldBy, manager);
        await this.transactionsRepo.insertStatusHistory(tenantId, listing.contract_id, ContractStatus.LIQUIDATED, soldBy, manager);
      }

      // 3. Update asset status via contract (uses contract_assets join) or direct
      if (listing.contract_id) {
        await this.transactionsRepo.updateAssetStatus(tenantId, listing.contract_id, 'redeemed', manager);
      } else {
        // No contract — update directly via manager query
        await manager.query(
          `UPDATE assets SET status = 'redeemed', updated_at = NOW() WHERE id = $1 AND tenant_id = $2`,
          [listing.asset_id, tenantId],
        );
      }

      // 4. Update listing to sold with buyer info
      const updatedListing = await this.marketplaceRepo.updateListing(
        tenantId,
        listingId,
        {
          status: ListingStatus.SOLD,
          soldAt: new Date(),
          soldPrice: dto.soldPrice,
          buyerName: dto.buyerName,
          buyerPhone: dto.buyerPhone,
          buyerIdNumber: dto.buyerIdNumber ?? null,
          paymentMethod: dto.paymentMethod ?? null,
          updatedBy: soldBy,
        },
        manager,
      );

      // 6. Audit (fire-and-forget, outside transaction is fine)
      this.auditService.log({
        tenantId,
        storeId: listing.store_id,
        userId: soldBy,
        action: 'marketplace.listing.sell',
        entityType: 'marketplace_listing',
        entityId: listingId,
        newValue: { soldPrice: dto.soldPrice, buyerName: dto.buyerName, buyerPhone: dto.buyerPhone },
      });

      return this.mapListingRow(updatedListing);
    });
  }

  // ── Public endpoints (no auth) ─────────────────────────────────────────

  async getPublicListings(
    tenantId: string,
    page: number,
    limit: number,
  ): Promise<{ items: PublicListingResponseDto[]; total: number }> {
    const { items, total } = await this.marketplaceRepo.findPublicListings(tenantId, { page, limit });
    return { items: items.map(this.mapPublicListingRow), total };
  }

  async getPublicListingById(tenantId: string, id: string): Promise<PublicListingResponseDto> {
    const row = await this.marketplaceRepo.findPublicListingById(tenantId, id);
    if (!row) throw new NotFoundException('Listing not found or not active');
    return this.mapPublicListingRow(row);
  }

  async createInquiry(
    tenantId: string,
    listingId: string,
    dto: CreateInquiryDto,
  ): Promise<InquiryResponseDto> {
    // Verify listing is active and public
    const listing = await this.marketplaceRepo.findPublicListingById(tenantId, listingId);
    if (!listing) throw new NotFoundException('Listing not found or not active');

    const row = await this.marketplaceRepo.insertInquiry(tenantId, listingId, {
      buyerName: dto.buyerName,
      buyerPhone: dto.buyerPhone,
      buyerEmail: dto.buyerEmail ?? null,
      message: dto.message ?? null,
    });

    return this.mapInquiryRow(row);
  }

  // ── Inquiries (authenticated) ──────────────────────────────────────────

  async getInquiries(tenantId: string, listingId: string): Promise<InquiryResponseDto[]> {
    const existing = await this.marketplaceRepo.findListingById(tenantId, listingId);
    if (!existing) throw new NotFoundException('Listing not found');

    const rows = await this.marketplaceRepo.findInquiries(tenantId, listingId);
    return rows.map(this.mapInquiryRow);
  }

  // ── Photo helpers (task 4) ─────────────────────────────────────────────

  async getListingWithPhotos(tenantId: string, id: string): Promise<ListingResponseDto> {
    const row = await this.marketplaceRepo.findListingById(tenantId, id);
    if (!row) throw new NotFoundException('Listing not found');

    const photos = await this.getAssetPhotos(tenantId, row.asset_id);
    return { ...this.mapListingRow(row), photos };
  }

  async getPublicListingWithPhotos(tenantId: string, id: string): Promise<PublicListingResponseDto> {
    const row = await this.marketplaceRepo.findPublicListingById(tenantId, id);
    if (!row) throw new NotFoundException('Listing not found or not active');

    const photos = await this.getAssetPhotosPublic(tenantId, row.asset_id);
    return { ...this.mapPublicListingRow(row), photos };
  }

  private async getAssetPhotos(
    tenantId: string,
    assetId: string,
  ): Promise<Array<{ id: string; url: string; originalFilename: string }>> {
    const files = await this.filesRepo.findByEntity(tenantId, 'asset', assetId);
    const photos = await Promise.all(
      files.map(async (f: any) => ({
        id: f.id as string,
        url: await this.minioService.getPresignedDownloadUrl(f.object_key as string, PRESIGNED_URL_EXPIRY),
        originalFilename: f.original_filename as string,
      })),
    );
    return photos;
  }

  private async getAssetPhotosPublic(
    tenantId: string,
    assetId: string,
  ): Promise<Array<{ id: string; url: string }>> {
    const files = await this.filesRepo.findByEntity(tenantId, 'asset', assetId);
    const photos = await Promise.all(
      files.map(async (f: any) => ({
        id: f.id as string,
        url: await this.minioService.getPresignedDownloadUrl(f.object_key as string, PRESIGNED_URL_EXPIRY),
      })),
    );
    return photos;
  }

  // ── Row mappers ────────────────────────────────────────────────────────

  private mapListingRow = (row: any): ListingResponseDto => ({
    id: row.id,
    tenantId: row.tenant_id,
    storeId: row.store_id,
    assetId: row.asset_id,
    contractId: row.contract_id ?? null,
    listingPrice: parseFloat(row.listing_price),
    status: row.status as ListingStatus,
    title: row.title,
    description: row.description ?? null,
    createdBy: row.created_by,
    updatedBy: row.updated_by ?? null,
    soldAt: row.sold_at ?? null,
    soldPrice: row.sold_price ? parseFloat(row.sold_price) : null,
    buyerName: row.buyer_name ?? null,
    buyerPhone: row.buyer_phone ?? null,
    buyerIdNumber: row.buyer_id_number ?? null,
    paymentMethod: row.payment_method ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });

  private mapPublicListingRow = (row: any): PublicListingResponseDto => ({
    id: row.id,
    title: row.title,
    description: row.description ?? null,
    listingPrice: parseFloat(row.listing_price),
    status: row.status as ListingStatus,
    assetId: row.asset_id,
    createdAt: row.created_at,
  });

  private mapInquiryRow = (row: any): InquiryResponseDto => ({
    id: row.id,
    tenantId: row.tenant_id,
    listingId: row.listing_id,
    buyerName: row.buyer_name,
    buyerPhone: row.buyer_phone,
    buyerEmail: row.buyer_email ?? null,
    message: row.message ?? null,
    createdAt: row.created_at,
  });
}
