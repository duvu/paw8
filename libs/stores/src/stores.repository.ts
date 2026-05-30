import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { StoreStatus, StoreResponseDto } from './dto/store.dto';

@Injectable()
export class StoresRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async insert(tenantId: string, data: {
    name: string;
    code: string;
    address?: string | null;
    phone?: string | null;
    managerUserId?: string | null;
  }): Promise<StoreResponseDto> {
    const rows = await this.dataSource.query<StoreResponseDto[]>(
      `INSERT INTO stores (tenant_id, name, code, address, phone, manager_user_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, tenant_id AS "tenantId", name, code, address, phone,
                 manager_user_id AS "managerUserId", status, created_at AS "createdAt"`,
      [tenantId, data.name, data.code, data.address ?? null, data.phone ?? null, data.managerUserId ?? null, StoreStatus.ACTIVE],
    );
    return rows[0];
  }

  async findAll(tenantId: string, limit: number, offset: number): Promise<StoreResponseDto[]> {
    return this.dataSource.query<StoreResponseDto[]>(
      `SELECT id, tenant_id AS "tenantId", name, code, address, phone,
              manager_user_id AS "managerUserId", status, created_at AS "createdAt"
       FROM stores
       WHERE tenant_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset],
    );
  }

  async count(tenantId: string): Promise<number> {
    const rows = await this.dataSource.query<[{ count: string }]>(
      `SELECT COUNT(*) FROM stores WHERE tenant_id = $1`,
      [tenantId],
    );
    return parseInt(rows[0].count, 10);
  }

  async findById(tenantId: string, id: string): Promise<StoreResponseDto | null> {
    const rows = await this.dataSource.query<StoreResponseDto[]>(
      `SELECT id, tenant_id AS "tenantId", name, code, address, phone,
              manager_user_id AS "managerUserId", status, created_at AS "createdAt"
       FROM stores
       WHERE tenant_id = $1 AND id = $2`,
      [tenantId, id],
    );
    return rows[0] ?? null;
  }

  async update(tenantId: string, id: string, fields: string[], values: unknown[]): Promise<StoreResponseDto> {
    const t = values.length - 1;
    const i = values.length;
    const rows = await this.dataSource.query<StoreResponseDto[]>(
      `UPDATE stores SET ${fields.join(', ')}
       WHERE tenant_id = $${t} AND id = $${i}
       RETURNING id, tenant_id AS "tenantId", name, code, address, phone,
                 manager_user_id AS "managerUserId", status, created_at AS "createdAt"`,
      values,
    );
    return rows[0];
  }

  async setStatus(tenantId: string, id: string, status: StoreStatus): Promise<StoreResponseDto> {
    const rows = await this.dataSource.query<StoreResponseDto[]>(
      `UPDATE stores SET status = $1 WHERE tenant_id = $2 AND id = $3
       RETURNING id, tenant_id AS "tenantId", name, code, address, phone,
                 manager_user_id AS "managerUserId", status, created_at AS "createdAt"`,
      [status, tenantId, id],
    );
    return rows[0];
  }

  async setManager(tenantId: string, id: string, userId: string): Promise<StoreResponseDto> {
    const rows = await this.dataSource.query<StoreResponseDto[]>(
      `UPDATE stores SET manager_user_id = $1 WHERE tenant_id = $2 AND id = $3
       RETURNING id, tenant_id AS "tenantId", name, code, address, phone,
                 manager_user_id AS "managerUserId", status, created_at AS "createdAt"`,
      [userId, tenantId, id],
    );
    return rows[0];
  }
}
