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

  async findExpiredTrials(nowMs: number): Promise<{ id: string }[]> {
    return this.dataSource.query<{ id: string }[]>(
      `SELECT id FROM tenants
       WHERE status = 'trial'
         AND trial_end_date IS NOT NULL
         AND (trial_end_date + COALESCE(grace_period_days, 3) * INTERVAL '1 day') < to_timestamp($1 / 1000.0)`,
      [nowMs],
    );
  }

  async countStores(tenantId: string): Promise<number> {
    const rows = await this.dataSource.query<[{ count: string }]>(
      `SELECT COUNT(*) FROM stores WHERE tenant_id = $1 AND status != 'locked'`,
      [tenantId],
    );
    return parseInt(rows[0].count, 10);
  }

  async countUsers(tenantId: string): Promise<number> {
    const rows = await this.dataSource.query<[{ count: string }]>(
      `SELECT COUNT(*) FROM users WHERE tenant_id = $1 AND status != 'locked'`,
      [tenantId],
    );
    return parseInt(rows[0].count, 10);
  }

  async hasOwner(tenantId: string): Promise<boolean> {
    const rows = await this.dataSource.query<[{ count: string }]>(
      `SELECT COUNT(*) FROM user_roles ur
       JOIN roles r ON r.id = ur.role_id
       WHERE ur.tenant_id = $1 AND r.name = 'tenant_owner'`,
      [tenantId],
    );
    return parseInt(rows[0].count, 10) > 0;
  }
}
