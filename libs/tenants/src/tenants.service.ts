import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  CreateTenantDto,
  UpdateTenantDto,
  TenantStatus,
  TenantResponseDto,
} from './dto/tenant.dto';

@Injectable()
export class TenantsService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateTenantDto): Promise<TenantResponseDto> {
    const code = dto.code.toUpperCase();
    const rows = await this.dataSource.query<TenantResponseDto[]>(
      `INSERT INTO tenants (name, code, status, plan, max_stores, max_users, trial_end_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, code, status, plan,
                 max_stores AS "maxStores", max_users AS "maxUsers",
                 trial_end_date AS "trialEndDate", created_at AS "createdAt"`,
      [
        dto.name,
        code,
        TenantStatus.ACTIVE,
        dto.plan ?? 'free',
        dto.maxStores ?? 1,
        dto.maxUsers ?? 5,
        dto.trialEndDate ?? null,
      ],
    );
    return rows[0];
  }

  async findAll(
    page = 1,
    limit = 20,
  ): Promise<{ data: TenantResponseDto[]; total: number; page: number; limit: number }> {
    const offset = (page - 1) * limit;
    const [rows, countRows] = await Promise.all([
      this.dataSource.query<TenantResponseDto[]>(
        `SELECT id, name, code, status, plan,
                max_stores AS "maxStores", max_users AS "maxUsers",
                trial_end_date AS "trialEndDate", created_at AS "createdAt"
         FROM tenants
         ORDER BY created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset],
      ),
      this.dataSource.query<[{ count: string }]>(
        `SELECT COUNT(*) FROM tenants`,
      ),
    ]);
    return {
      data: rows,
      total: parseInt(countRows[0].count, 10),
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<TenantResponseDto> {
    const rows = await this.dataSource.query<TenantResponseDto[]>(
      `SELECT id, name, code, status, plan,
              max_stores AS "maxStores", max_users AS "maxUsers",
              trial_end_date AS "trialEndDate", created_at AS "createdAt"
       FROM tenants
       WHERE id = $1`,
      [id],
    );
    if (!rows.length) {
      throw new NotFoundException(`Tenant ${id} not found`);
    }
    return rows[0];
  }

  async findByCode(code: string): Promise<TenantResponseDto | null> {
    const rows = await this.dataSource.query<TenantResponseDto[]>(
      `SELECT id, name, code, status, plan,
              max_stores AS "maxStores", max_users AS "maxUsers",
              trial_end_date AS "trialEndDate", created_at AS "createdAt"
       FROM tenants
       WHERE code = $1`,
      [code.toUpperCase()],
    );
    return rows[0] ?? null;
  }

  async update(id: string, dto: UpdateTenantDto): Promise<TenantResponseDto> {
    await this.findOne(id);
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (dto.name !== undefined) { fields.push(`name = $${idx++}`); values.push(dto.name); }
    if (dto.code !== undefined) { fields.push(`code = $${idx++}`); values.push(dto.code.toUpperCase()); }
    if (dto.plan !== undefined) { fields.push(`plan = $${idx++}`); values.push(dto.plan); }
    if (dto.maxStores !== undefined) { fields.push(`max_stores = $${idx++}`); values.push(dto.maxStores); }
    if (dto.maxUsers !== undefined) { fields.push(`max_users = $${idx++}`); values.push(dto.maxUsers); }
    if (dto.trialEndDate !== undefined) { fields.push(`trial_end_date = $${idx++}`); values.push(dto.trialEndDate); }
    if (dto.status !== undefined) { fields.push(`status = $${idx++}`); values.push(dto.status); }

    if (!fields.length) {
      return this.findOne(id);
    }

    values.push(id);
    const rows = await this.dataSource.query<TenantResponseDto[]>(
      `UPDATE tenants SET ${fields.join(', ')}
       WHERE id = $${idx}
       RETURNING id, name, code, status, plan,
                 max_stores AS "maxStores", max_users AS "maxUsers",
                 trial_end_date AS "trialEndDate", created_at AS "createdAt"`,
      values,
    );
    return rows[0];
  }

  async setStatus(id: string, status: TenantStatus): Promise<TenantResponseDto> {
    await this.findOne(id);
    const rows = await this.dataSource.query<TenantResponseDto[]>(
      `UPDATE tenants SET status = $1
       WHERE id = $2
       RETURNING id, name, code, status, plan,
                 max_stores AS "maxStores", max_users AS "maxUsers",
                 trial_end_date AS "trialEndDate", created_at AS "createdAt"`,
      [status, id],
    );
    return rows[0];
  }
}
