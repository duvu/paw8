import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  CreateAssetDto,
  UpdateAssetDto,
  AssetSearchDto,
  AssetResponseDto,
  AssetStatus,
} from './dto/asset.dto';

@Injectable()
export class AssetsService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async create(
    tenantId: string,
    storeId: string,
    userId: string,
    dto: CreateAssetDto,
  ): Promise<AssetResponseDto> {
    const result = await this.dataSource.query(
      `INSERT INTO assets (
        tenant_id, store_id, asset_type, asset_name, brand, model, color,
        serial_number, imei, license_plate, chassis_number, engine_number,
        condition_description, valuation_amount, proposed_loan_amount, status, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'pawned',NOW(),NOW())
      RETURNING id, tenant_id, store_id, asset_type, asset_name, status, valuation_amount, proposed_loan_amount, created_at`,
      [
        tenantId,
        storeId,
        dto.assetType,
        dto.assetName,
        dto.brand ?? null,
        dto.model ?? null,
        dto.color ?? null,
        dto.serialNumber ?? null,
        dto.imei ?? null,
        dto.licensePlate ?? null,
        dto.chassisNumber ?? null,
        dto.engineNumber ?? null,
        dto.conditionDescription ?? null,
        dto.valuationAmount,
        dto.proposedLoanAmount,
      ],
    );

    const asset = result[0];

    await this.dataSource.query(
      `INSERT INTO asset_inventory (tenant_id, store_id, asset_id, location_code, location_note, received_at, status)
       VALUES ($1, $2, $3, $4, $5, NOW(), 'in_store')`,
      [tenantId, storeId, asset.id, dto.locationCode ?? null, dto.locationNote ?? null],
    );

    return this.mapToDto(asset);
  }

  async findAll(
    tenantId: string,
    searchDto: AssetSearchDto,
  ): Promise<{ data: AssetResponseDto[]; total: number }> {
    const page = searchDto.page ?? 1;
    const limit = searchDto.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions: string[] = ['a.tenant_id = $1'];
    const params: any[] = [tenantId];
    let idx = 2;

    if (searchDto.storeId) {
      conditions.push(`a.store_id = $${idx++}`);
      params.push(searchDto.storeId);
    }

    if (searchDto.status) {
      conditions.push(`a.status = $${idx++}`);
      params.push(searchDto.status);
    }

    if (searchDto.query) {
      conditions.push(
        `(a.serial_number ILIKE $${idx} OR a.imei ILIKE $${idx} OR a.license_plate ILIKE $${idx})`,
      );
      params.push(`%${searchDto.query}%`);
      idx++;
    }

    const whereClause = conditions.join(' AND ');
    const countParams = [...params];
    const dataParams = [...params, limit, offset];

    const [rows, countResult] = await Promise.all([
      this.dataSource.query(
        `SELECT a.id, a.tenant_id, a.store_id, a.asset_type, a.asset_name, a.status,
                a.valuation_amount, a.proposed_loan_amount, a.created_at,
                ca.contract_id
         FROM assets a
         LEFT JOIN contract_assets ca ON ca.asset_id = a.id
         WHERE ${whereClause}
         ORDER BY a.created_at DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        dataParams,
      ),
      this.dataSource.query(
        `SELECT COUNT(*) AS total FROM assets a WHERE ${whereClause}`,
        countParams,
      ),
    ]);

    return {
      data: rows.map((r: any) => this.mapToDto(r)),
      total: parseInt(countResult[0].total, 10),
    };
  }

  async findOne(tenantId: string, id: string): Promise<AssetResponseDto> {
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

    if (result.length === 0) {
      throw new NotFoundException(`Asset ${id} not found`);
    }

    return this.mapToDto(result[0]);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateAssetDto,
  ): Promise<AssetResponseDto> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const fieldMap: Record<string, string> = {
      assetType: 'asset_type',
      assetName: 'asset_name',
      brand: 'brand',
      model: 'model',
      color: 'color',
      serialNumber: 'serial_number',
      imei: 'imei',
      licensePlate: 'license_plate',
      chassisNumber: 'chassis_number',
      engineNumber: 'engine_number',
      conditionDescription: 'condition_description',
      valuationAmount: 'valuation_amount',
      proposedLoanAmount: 'proposed_loan_amount',
      status: 'status',
    };

    for (const [key, col] of Object.entries(fieldMap)) {
      const val = (dto as any)[key];
      if (val !== undefined) {
        fields.push(`${col} = $${idx++}`);
        values.push(val);
      }
    }

    if (fields.length === 0) {
      return this.findOne(tenantId, id);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id, tenantId);

    await this.dataSource.query(
      `UPDATE assets SET ${fields.join(', ')} WHERE id = $${idx++} AND tenant_id = $${idx++}`,
      values,
    );

    return this.findOne(tenantId, id);
  }

  async updateStatus(
    tenantId: string,
    id: string,
    status: AssetStatus,
  ): Promise<AssetResponseDto> {
    const result = await this.dataSource.query(
      `UPDATE assets SET status = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3 RETURNING id`,
      [status, id, tenantId],
    );

    if (result.length === 0) {
      throw new NotFoundException(`Asset ${id} not found`);
    }

    return this.findOne(tenantId, id);
  }

  async getInventory(tenantId: string, storeId?: string): Promise<any[]> {
    const conditions: string[] = [
      `ai.tenant_id = $1`,
      `a.status = 'pawned'`,
      `ai.returned_at IS NULL`,
    ];
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

  private mapToDto(row: any): AssetResponseDto {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      storeId: row.store_id,
      assetType: row.asset_type,
      assetName: row.asset_name,
      status: row.status,
      valuationAmount: parseFloat(row.valuation_amount),
      proposedLoanAmount: parseFloat(row.proposed_loan_amount),
      createdAt: row.created_at,
      contractId: row.contract_id ?? null,
    };
  }
}
