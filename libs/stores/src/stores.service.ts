import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  CreateStoreDto,
  UpdateStoreDto,
  StoreStatus,
  StoreResponseDto,
} from './dto/store.dto';

@Injectable()
export class StoresService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async create(tenantId: string, dto: CreateStoreDto): Promise<StoreResponseDto> {
    const rows = await this.dataSource.query<StoreResponseDto[]>(
      `INSERT INTO stores (tenant_id, name, code, address, phone, manager_user_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, tenant_id AS "tenantId", name, code, address, phone,
                 manager_user_id AS "managerUserId", status, created_at AS "createdAt"`,
      [
        tenantId,
        dto.name,
        dto.code,
        dto.address ?? null,
        dto.phone ?? null,
        dto.managerUserId ?? null,
        StoreStatus.ACTIVE,
      ],
    );
    return rows[0];
  }

  async findAll(
    tenantId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: StoreResponseDto[]; total: number; page: number; limit: number }> {
    const offset = (page - 1) * limit;
    const [rows, countRows] = await Promise.all([
      this.dataSource.query<StoreResponseDto[]>(
        `SELECT id, tenant_id AS "tenantId", name, code, address, phone,
                manager_user_id AS "managerUserId", status, created_at AS "createdAt"
         FROM stores
         WHERE tenant_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [tenantId, limit, offset],
      ),
      this.dataSource.query<[{ count: string }]>(
        `SELECT COUNT(*) FROM stores WHERE tenant_id = $1`,
        [tenantId],
      ),
    ]);
    return {
      data: rows,
      total: parseInt(countRows[0].count, 10),
      page,
      limit,
    };
  }

  async findOne(tenantId: string, id: string): Promise<StoreResponseDto> {
    const rows = await this.dataSource.query<StoreResponseDto[]>(
      `SELECT id, tenant_id AS "tenantId", name, code, address, phone,
              manager_user_id AS "managerUserId", status, created_at AS "createdAt"
       FROM stores
       WHERE tenant_id = $1 AND id = $2`,
      [tenantId, id],
    );
    if (!rows.length) {
      throw new NotFoundException(`Store ${id} not found`);
    }
    return rows[0];
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateStoreDto,
  ): Promise<StoreResponseDto> {
    await this.findOne(tenantId, id);
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (dto.name !== undefined) { fields.push(`name = $${idx++}`); values.push(dto.name); }
    if (dto.code !== undefined) { fields.push(`code = $${idx++}`); values.push(dto.code); }
    if (dto.address !== undefined) { fields.push(`address = $${idx++}`); values.push(dto.address); }
    if (dto.phone !== undefined) { fields.push(`phone = $${idx++}`); values.push(dto.phone); }
    if (dto.managerUserId !== undefined) { fields.push(`manager_user_id = $${idx++}`); values.push(dto.managerUserId); }
    if (dto.status !== undefined) { fields.push(`status = $${idx++}`); values.push(dto.status); }

    if (!fields.length) {
      return this.findOne(tenantId, id);
    }

    values.push(tenantId, id);
    const rows = await this.dataSource.query<StoreResponseDto[]>(
      `UPDATE stores SET ${fields.join(', ')}
       WHERE tenant_id = $${idx} AND id = $${idx + 1}
       RETURNING id, tenant_id AS "tenantId", name, code, address, phone,
                 manager_user_id AS "managerUserId", status, created_at AS "createdAt"`,
      values,
    );
    return rows[0];
  }

  async setStatus(
    tenantId: string,
    id: string,
    status: StoreStatus,
  ): Promise<StoreResponseDto> {
    await this.findOne(tenantId, id);
    const rows = await this.dataSource.query<StoreResponseDto[]>(
      `UPDATE stores SET status = $1
       WHERE tenant_id = $2 AND id = $3
       RETURNING id, tenant_id AS "tenantId", name, code, address, phone,
                 manager_user_id AS "managerUserId", status, created_at AS "createdAt"`,
      [status, tenantId, id],
    );
    return rows[0];
  }

  async assignManager(
    tenantId: string,
    id: string,
    userId: string,
  ): Promise<StoreResponseDto> {
    await this.findOne(tenantId, id);
    const rows = await this.dataSource.query<StoreResponseDto[]>(
      `UPDATE stores SET manager_user_id = $1
       WHERE tenant_id = $2 AND id = $3
       RETURNING id, tenant_id AS "tenantId", name, code, address, phone,
                 manager_user_id AS "managerUserId", status, created_at AS "createdAt"`,
      [userId, tenantId, id],
    );
    return rows[0];
  }
}
