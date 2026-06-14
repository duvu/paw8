import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { ListingStatus } from './dto/marketplace-listing.dto';

@Injectable()
export class MarketplaceRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async insertListing(
    tenantId: string,
    storeId: string,
    data: {
      assetId: string;
      contractId?: string | null;
      listingPrice: number;
      title: string;
      description?: string | null;
      createdBy: string;
    },
  ): Promise<any> {
    const result = await this.dataSource.query(
      `INSERT INTO marketplace_listings
         (tenant_id, store_id, asset_id, contract_id, listing_price, title, description, created_by, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
       RETURNING *`,
      [
        tenantId,
        storeId,
        data.assetId,
        data.contractId ?? null,
        data.listingPrice,
        data.title,
        data.description ?? null,
        data.createdBy,
      ],
    );
    return result[0];
  }

  async findListingById(tenantId: string, id: string, manager?: EntityManager): Promise<any | null> {
    const db = manager ?? this.dataSource;
    const result = await db.query(
      `SELECT * FROM marketplace_listings WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId],
    );
    return result[0] ?? null;
  }

  async findListingByIdForUpdate(tenantId: string, id: string, manager: EntityManager): Promise<any | null> {
    const result = await manager.query(
      `SELECT * FROM marketplace_listings WHERE id = $1 AND tenant_id = $2 FOR UPDATE`,
      [id, tenantId],
    );
    return result[0] ?? null;
  }

  async findListings(
    tenantId: string,
    filters: { status?: ListingStatus; storeId?: string; page?: number; limit?: number },
  ): Promise<{ items: any[]; total: number }> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions: string[] = ['tenant_id = $1'];
    const params: any[] = [tenantId];
    let idx = 2;

    if (filters.status) {
      conditions.push(`status = $${idx++}`);
      params.push(filters.status);
    }
    if (filters.storeId) {
      conditions.push(`store_id = $${idx++}`);
      params.push(filters.storeId);
    }

    const where = conditions.join(' AND ');

    const countResult = await this.dataSource.query(
      `SELECT COUNT(*) AS total FROM marketplace_listings WHERE ${where}`,
      params,
    );

    const items = await this.dataSource.query(
      `SELECT * FROM marketplace_listings WHERE ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx}`,
      [...params, limit, offset],
    );

    return { items, total: parseInt(countResult[0].total, 10) };
  }

  async updateListing(
    tenantId: string,
    id: string,
    data: {
      title?: string;
      description?: string | null;
      listingPrice?: number;
      status?: ListingStatus;
      updatedBy: string;
      soldAt?: Date | null;
      soldPrice?: number | null;
      buyerName?: string | null;
      buyerPhone?: string | null;
      buyerIdNumber?: string | null;
      paymentMethod?: string | null;
    },
    manager?: EntityManager,
  ): Promise<any> {
    const sets: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (data.title !== undefined) { sets.push(`title = $${idx++}`); params.push(data.title); }
    if (data.description !== undefined) { sets.push(`description = $${idx++}`); params.push(data.description); }
    if (data.listingPrice !== undefined) { sets.push(`listing_price = $${idx++}`); params.push(data.listingPrice); }
    if (data.status !== undefined) { sets.push(`status = $${idx++}`); params.push(data.status); }
    if (data.soldAt !== undefined) { sets.push(`sold_at = $${idx++}`); params.push(data.soldAt); }
    if (data.soldPrice !== undefined) { sets.push(`sold_price = $${idx++}`); params.push(data.soldPrice); }
    if (data.buyerName !== undefined) { sets.push(`buyer_name = $${idx++}`); params.push(data.buyerName); }
    if (data.buyerPhone !== undefined) { sets.push(`buyer_phone = $${idx++}`); params.push(data.buyerPhone); }
    if (data.buyerIdNumber !== undefined) { sets.push(`buyer_id_number = $${idx++}`); params.push(data.buyerIdNumber); }
    if (data.paymentMethod !== undefined) { sets.push(`payment_method = $${idx++}`); params.push(data.paymentMethod); }

    sets.push(`updated_by = $${idx++}`, `updated_at = NOW()`);
    params.push(data.updatedBy);

    params.push(id, tenantId);

    const db = manager ?? this.dataSource;
    await db.query(
      `UPDATE marketplace_listings SET ${sets.join(', ')} WHERE id = $${idx++} AND tenant_id = $${idx}`,
      params,
    );
    const fetched = await db.query(
      `SELECT * FROM marketplace_listings WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId],
    );
    return fetched[0] ?? null;
  }

  async findInquiries(tenantId: string, listingId: string): Promise<any[]> {
    return this.dataSource.query(
      `SELECT * FROM buyer_inquiries WHERE listing_id = $1 AND tenant_id = $2 ORDER BY created_at ASC`,
      [listingId, tenantId],
    );
  }

  async insertInquiry(
    tenantId: string,
    listingId: string,
    data: { buyerName: string; buyerPhone: string; buyerEmail?: string | null; message?: string | null },
  ): Promise<any> {
    const result = await this.dataSource.query(
      `INSERT INTO buyer_inquiries (tenant_id, listing_id, buyer_name, buyer_phone, buyer_email, message)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [tenantId, listingId, data.buyerName, data.buyerPhone, data.buyerEmail ?? null, data.message ?? null],
    );
    return result[0];
  }

  async findPublicListings(
    tenantId: string,
    filters: { page?: number; limit?: number },
  ): Promise<{ items: any[]; total: number }> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;

    const countResult = await this.dataSource.query(
      `SELECT COUNT(*) AS total FROM marketplace_listings WHERE tenant_id = $1 AND status = 'active'`,
      [tenantId],
    );
    const items = await this.dataSource.query(
      `SELECT id, title, description, listing_price, status, asset_id, created_at
       FROM marketplace_listings
       WHERE tenant_id = $1 AND status = 'active'
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset],
    );

    return { items, total: parseInt(countResult[0].total, 10) };
  }

  async findPublicListingById(tenantId: string, id: string): Promise<any | null> {
    const result = await this.dataSource.query(
      `SELECT id, title, description, listing_price, status, asset_id, created_at
       FROM marketplace_listings
       WHERE id = $1 AND tenant_id = $2 AND status = 'active'`,
      [id, tenantId],
    );
    return result[0] ?? null;
  }

  transaction<T>(work: (manager: EntityManager) => Promise<T>): Promise<T> {
    return this.dataSource.transaction(work);
  }
}
