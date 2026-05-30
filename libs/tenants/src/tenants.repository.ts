import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TenantStatus, TenantResponseDto } from './dto/tenant.dto';

const SELECT_COLS = `id, name, code, status, plan,
  max_stores AS "maxStores", max_users AS "maxUsers",
  trial_end_date AS "trialEndDate", created_at AS "createdAt"`;

@Injectable()
export class TenantsRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async insert(data: {
    name: string;
    code: string;
    plan: string;
    maxStores: number;
    maxUsers: number;
    trialEndDate?: string | null;
  }): Promise<TenantResponseDto> {
    const rows = await this.dataSource.query<TenantResponseDto[]>(
      `INSERT INTO tenants (name, code, status, plan, max_stores, max_users, trial_end_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING ${SELECT_COLS}`,
      [data.name, data.code, TenantStatus.ACTIVE, data.plan, data.maxStores, data.maxUsers, data.trialEndDate ?? null],
    );
    return rows[0];
  }

  async findAll(limit: number, offset: number): Promise<TenantResponseDto[]> {
    return this.dataSource.query<TenantResponseDto[]>(
      `SELECT ${SELECT_COLS} FROM tenants ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
  }

  async count(): Promise<number> {
    const rows = await this.dataSource.query<[{ count: string }]>(`SELECT COUNT(*) FROM tenants`);
    return parseInt(rows[0].count, 10);
  }

  async findById(id: string): Promise<TenantResponseDto | null> {
    const rows = await this.dataSource.query<TenantResponseDto[]>(
      `SELECT ${SELECT_COLS} FROM tenants WHERE id = $1`,
      [id],
    );
    return rows[0] ?? null;
  }

  async findByCode(code: string): Promise<TenantResponseDto | null> {
    const rows = await this.dataSource.query<TenantResponseDto[]>(
      `SELECT ${SELECT_COLS} FROM tenants WHERE code = $1`,
      [code.toUpperCase()],
    );
    return rows[0] ?? null;
  }

  async update(id: string, fields: string[], values: unknown[]): Promise<TenantResponseDto> {
    const rows = await this.dataSource.query<TenantResponseDto[]>(
      `UPDATE tenants SET ${fields.join(', ')} WHERE id = $${values.length}
       RETURNING ${SELECT_COLS}`,
      values,
    );
    return rows[0];
  }

  async setStatus(id: string, status: TenantStatus): Promise<TenantResponseDto> {
    const rows = await this.dataSource.query<TenantResponseDto[]>(
      `UPDATE tenants SET status = $1 WHERE id = $2 RETURNING ${SELECT_COLS}`,
      [status, id],
    );
    return rows[0];
  }
}
