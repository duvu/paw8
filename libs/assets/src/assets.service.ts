import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateAssetDto,
  UpdateAssetDto,
  AssetSearchDto,
  AssetResponseDto,
  AssetStatus,
} from './dto/asset.dto';
import { AssetsRepository } from './assets.repository';

@Injectable()
export class AssetsService {
  constructor(
    private readonly assetsRepository: AssetsRepository,
  ) {}

  async create(
    tenantId: string,
    storeId: string,
    userId: string,
    dto: CreateAssetDto,
  ): Promise<AssetResponseDto> {
    const asset = await this.assetsRepository.insert(tenantId, storeId, {
      assetType: dto.assetType,
      assetName: dto.assetName,
      brand: dto.brand ?? null,
      model: dto.model ?? null,
      color: dto.color ?? null,
      serialNumber: dto.serialNumber ?? null,
      imei: dto.imei ?? null,
      licensePlate: dto.licensePlate ?? null,
      chassisNumber: dto.chassisNumber ?? null,
      engineNumber: dto.engineNumber ?? null,
      conditionDescription: dto.conditionDescription ?? null,
      valuationAmount: dto.valuationAmount,
      proposedLoanAmount: dto.proposedLoanAmount,
    });

    await this.assetsRepository.insertInventory(tenantId, storeId, asset.id, dto.locationCode ?? null, dto.locationNote ?? null);

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

    const [rows, total] = await Promise.all([
      this.assetsRepository.search(tenantId, conditions, params, limit, offset),
      this.assetsRepository.count(conditions, params),
    ]);

    return {
      data: rows.map((r: any) => this.mapToDto(r)),
      total,
    };
  }

  async findOne(tenantId: string, id: string): Promise<AssetResponseDto> {
    const row = await this.assetsRepository.findById(tenantId, id);
    if (!row) {
      throw new NotFoundException(`Asset ${id} not found`);
    }
    return this.mapToDto(row);
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

    await this.assetsRepository.update(tenantId, id, fields, values);
    return this.findOne(tenantId, id);
  }

  async updateStatus(
    tenantId: string,
    id: string,
    status: AssetStatus,
  ): Promise<AssetResponseDto> {
    const result = await this.assetsRepository.updateStatus(tenantId, id, status);
    if (result.length === 0) {
      throw new NotFoundException(`Asset ${id} not found`);
    }
    return this.findOne(tenantId, id);
  }

  async getInventory(tenantId: string, storeId?: string): Promise<any[]> {
    return this.assetsRepository.getInventory(tenantId, storeId);
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
