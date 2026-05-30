import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateTenantDto,
  UpdateTenantDto,
  TenantStatus,
  TenantResponseDto,
} from './dto/tenant.dto';
import { TenantsRepository } from './tenants.repository';

@Injectable()
export class TenantsService {
  constructor(
    private readonly tenantsRepository: TenantsRepository,
  ) {}

  async create(dto: CreateTenantDto): Promise<TenantResponseDto> {
    return this.tenantsRepository.insert({
      name: dto.name,
      code: dto.code.toUpperCase(),
      plan: dto.plan ?? 'free',
      maxStores: dto.maxStores ?? 1,
      maxUsers: dto.maxUsers ?? 5,
      trialEndDate: dto.trialEndDate ?? null,
    });
  }

  async findAll(
    page = 1,
    limit = 20,
  ): Promise<{ data: TenantResponseDto[]; total: number; page: number; limit: number }> {
    const offset = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.tenantsRepository.findAll(limit, offset),
      this.tenantsRepository.count(),
    ]);
    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<TenantResponseDto> {
    const row = await this.tenantsRepository.findById(id);
    if (!row) {
      throw new NotFoundException(`Tenant ${id} not found`);
    }
    return row;
  }

  async findByCode(code: string): Promise<TenantResponseDto | null> {
    return this.tenantsRepository.findByCode(code.toUpperCase());
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

    // repo expects values = [...fieldValues, id]
    values.push(id);
    return this.tenantsRepository.update(id, fields, values);
  }

  async setStatus(id: string, status: TenantStatus): Promise<TenantResponseDto> {
    await this.findOne(id);
    return this.tenantsRepository.setStatus(id, status);
  }
}
