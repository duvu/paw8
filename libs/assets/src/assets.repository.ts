import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AssetsRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async insert(tenantId: string, storeId: string, data: {
    assetType: string;
    assetName: string;
    brand?: string | null;
    model?: string | null;
    color?: string | null;
    serialNumber?: string | null;
    imei?: string | null;
    licensePlate?: string | null;
    chassisNumber?: string | null;
    engineNumber?: string | null;
    conditionDescription?: string | null;
    valuationAmount: number;
    proposedLoanAmount: number;
  }): Promise<any> {
    const result = await this.dataSource.query(
      `INSERT INTO assets (
        tenant_id, store_id, asset_type, asset_name, brand, model, color,
        serial_number, imei, license_plate, chassis_number, engine_number,
        condition_description, valuation_amount, proposed_loan_amount, status, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'holding',NOW(),NOW())
      RETURNING id, tenant_id, store_id, asset_type, asset_name, status, valuation_amount, proposed_loan_amount, created_at`,
      [
        tenantId, storeId,
        data.assetType, data.assetName,
        data.brand ?? null, data.model ?? null, data.color ?? null,
        data.serialNumber ?? null, data.imei ?? null, data.licensePlate ?? null,
        data.chassisNumber ?? null, data.engineNumber ?? null,
        data.conditionDescription ?? null,
        data.valuationAmount, data.proposedLoanAmount,
      ],
    );
    return result[0];
  }

  async insertInventory(tenantId: string, storeId: string, assetId: string, locationCode?: string | null, locationNote?: string | null): Promise<void> {
    await this.dataSource.query(
      `INSERT INTO asset_inventory (tenant_id, store_id, asset_id, location_code, location_note, received_at, status)
       VALUES ($1, $2, $3, $4, $5, NOW(), 'in_storage')`,
      [tenantId, storeId, assetId, locationCode ?? null, locationNote ?? null],
    );
  }

  async search(tenantId: string, conditions: string[], params: any[], limit: number, offset: number): Promise<any[]> {
    const whereClause = conditions.join(' AND ');
    return this.dataSource.query(
      `SELECT a.id, a.tenant_id, a.store_id, a.asset_type, a.asset_name, a.status,
              a.valuation_amount, a.proposed_loan_amount, a.created_at,
              ca.contract_id
       FROM assets a
       LEFT JOIN contract_assets ca ON ca.asset_id = a.id
       WHERE ${whereClause}
       ORDER BY a.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    );
  }

  async count(conditions: string[], params: any[]): Promise<number> {
    const whereClause = conditions.join(' AND ');
    const result = await this.dataSource.query(
      `SELECT COUNT(*) AS total FROM assets a WHERE ${whereClause}`,
      params,
    );
    return parseInt(result[0].total, 10);
  }

  async findById(tenantId: string, id: string): Promise<any | null> {
    const result = await this.dataSource.query(
      `SELECT a.id, a.tenant_id, a.store_id, a.asset_type, a.asset_name, a.status,
              a.valuation_amount, a.proposed_loan_amount, a.created_at,
              ca.contract_id,
              ai.location_code, ai.location_note, ai.received_at, ai.returned_at
       FROM assets a
       LEFT JOIN contract_assets ca ON ca.asset_id = a.id
       LEFT JOIN asset_inventory ai ON ai.asset_id = a.id AND ai.tenant_id = a.tenant_id
       WHERE a.id = $1 AND a.tenant_id = $2`,
      [id, tenantId],
    );
    return result[0] ?? null;
  }

  async update(tenantId: string, id: string, fields: string[], values: any[]): Promise<void> {
    await this.dataSource.query(
      `UPDATE assets SET ${fields.join(', ')} WHERE id = $${values.length - 1} AND tenant_id = $${values.length}`,
      values,
    );
  }

  async updateStatus(tenantId: string, id: string, status: string): Promise<any[]> {
    return this.dataSource.query(
      `UPDATE assets SET status = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3 RETURNING id`,
      [status, id, tenantId],
    );
  }

  async getInventory(tenantId: string, storeId?: string): Promise<any[]> {
    const conditions = [`ai.tenant_id = $1`, `a.status = 'holding'`, `ai.returned_at IS NULL`];
    const params: any[] = [tenantId];
    if (storeId) {
      conditions.push(`ai.store_id = $2`);
      params.push(storeId);
    }
    return this.dataSource.query(
      `SELECT ai.id, ai.asset_id, ai.store_id, ai.location_code, ai.location_note,
              ai.received_at, ai.status AS inventory_status,
              a.asset_name, a.asset_type, a.serial_number, a.imei, a.license_plate, a.status AS asset_status
       FROM asset_inventory ai
       JOIN assets a ON a.id = ai.asset_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY ai.received_at DESC`,
      params,
    );
  }
}
