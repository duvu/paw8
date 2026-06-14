import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { InterestPolicyResponseDto } from './dto/interest-policy.dto';
import { InterestType } from './dto/contract.dto';

function mapRow(row: Record<string, unknown>): InterestPolicyResponseDto {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    name: row.name as string,
    description: row.description as string | null,
    interestRate: parseFloat(row.interest_rate as string),
    interestType: row.interest_type as InterestType,
    gracePeriodDays: parseInt(row.grace_period_days as string, 10),
    lateFeeRate: parseFloat(row.late_fee_rate as string),
    storageFeeDailyVnd: parseFloat(row.storage_fee_daily as string),
    extensionFeeRate: parseFloat(row.extension_fee_rate as string),
    minLoanAmount: row.min_loan_amount != null ? parseFloat(row.min_loan_amount as string) : null,
    maxLoanAmount: row.max_loan_amount != null ? parseFloat(row.max_loan_amount as string) : null,
    minDurationDays: parseInt(row.min_duration_days as string, 10),
    maxDurationDays: parseInt(row.max_duration_days as string, 10),
    isDefault: row.is_default as boolean,
    status: row.status as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

@Injectable()
export class InterestPoliciesRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async insert(tenantId: string, data: {
    name: string;
    description?: string | null;
    interestRate: number;
    interestType: string;
    gracePeriodDays: number;
    lateFeeRate: number;
    storageFeeDailyVnd: number;
    extensionFeeRate: number;
    minLoanAmount?: number | null;
    maxLoanAmount?: number | null;
    minDurationDays: number;
    maxDurationDays: number;
    isDefault: boolean;
  }): Promise<InterestPolicyResponseDto> {
    const [row] = await this.dataSource.query(
      `INSERT INTO interest_policies (
        tenant_id, name, description, interest_rate, interest_type,
        grace_period_days, late_fee_rate, storage_fee_daily, extension_fee_rate,
        min_loan_amount, max_loan_amount, min_duration_days, max_duration_days,
        is_default, status, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'active',NOW(),NOW())
      RETURNING *`,
      [
        tenantId, data.name, data.description ?? null,
        data.interestRate, data.interestType,
        data.gracePeriodDays, data.lateFeeRate, data.storageFeeDailyVnd, data.extensionFeeRate,
        data.minLoanAmount ?? null, data.maxLoanAmount ?? null,
        data.minDurationDays, data.maxDurationDays,
        data.isDefault,
      ],
    );
    return mapRow(row);
  }

  async findAll(tenantId: string, limit: number, offset: number): Promise<InterestPolicyResponseDto[]> {
    const rows = await this.dataSource.query(
      `SELECT * FROM interest_policies WHERE tenant_id = $1 ORDER BY is_default DESC, name ASC LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset],
    );
    return rows.map(mapRow);
  }

  async count(tenantId: string): Promise<number> {
    const [{ count }] = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM interest_policies WHERE tenant_id = $1`,
      [tenantId],
    );
    return parseInt(count, 10);
  }

  async findById(tenantId: string, id: string): Promise<InterestPolicyResponseDto | null> {
    const rows = await this.dataSource.query(
      `SELECT * FROM interest_policies WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId],
    );
    return rows.length ? mapRow(rows[0]) : null;
  }

  async findDefaultByTenant(tenantId: string): Promise<InterestPolicyResponseDto | null> {
    const rows = await this.dataSource.query(
      `SELECT * FROM interest_policies WHERE tenant_id = $1 AND is_default = true AND status = 'active' LIMIT 1`,
      [tenantId],
    );
    return rows.length ? mapRow(rows[0]) : null;
  }

  async update(tenantId: string, id: string, fields: string[], values: unknown[]): Promise<InterestPolicyResponseDto> {
    const sets = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
    const t = values.length + 1;
    const i = values.length + 2;
    const [row] = await this.dataSource.query(
      `UPDATE interest_policies SET ${sets}, updated_at = NOW() WHERE tenant_id = $${t} AND id = $${i} RETURNING *`,
      [...values, tenantId, id],
    );
    return mapRow(row);
  }

  async setDefault(tenantId: string, id: string): Promise<InterestPolicyResponseDto> {
    await this.dataSource.query(
      `UPDATE interest_policies SET is_default = false, updated_at = NOW() WHERE tenant_id = $1`,
      [tenantId],
    );
    const [row] = await this.dataSource.query(
      `UPDATE interest_policies SET is_default = true, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`,
      [id, tenantId],
    );
    return mapRow(row);
  }
}
