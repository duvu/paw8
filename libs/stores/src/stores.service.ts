import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateStoreDto,
  UpdateStoreDto,
  StoreStatus,
  StoreResponseDto,
} from './dto/store.dto';
import { StoresRepository } from './stores.repository';

@Injectable()
export class StoresService {
  constructor(
    private readonly storesRepository: StoresRepository,
  ) {}

  async create(tenantId: string, dto: CreateStoreDto): Promise<StoreResponseDto> {
    return this.storesRepository.insert(tenantId, {
      name: dto.name,
      code: dto.code,
      address: dto.address ?? null,
      phone: dto.phone ?? null,
      managerUserId: dto.managerUserId ?? null,
    });
  }

  async findAll(
    tenantId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: StoreResponseDto[]; total: number; page: number; limit: number }> {
    const offset = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.storesRepository.findAll(tenantId, limit, offset),
      this.storesRepository.count(tenantId),
    ]);
    return { data, total, page, limit };
  }

  async findOne(tenantId: string, id: string): Promise<StoreResponseDto> {
    const row = await this.storesRepository.findById(tenantId, id);
    if (!row) {
      throw new NotFoundException(`Store ${id} not found`);
    }
    return row;
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

    // repo expects values = [...fieldValues, tenantId, id]
    values.push(tenantId, id);
    return this.storesRepository.update(tenantId, id, fields, values);
  }

  async setStatus(
    tenantId: string,
    id: string,
    status: StoreStatus,
  ): Promise<StoreResponseDto> {
    await this.findOne(tenantId, id);
    return this.storesRepository.setStatus(tenantId, id, status);
  }

  async assignManager(
    tenantId: string,
    id: string,
    userId: string,
  ): Promise<StoreResponseDto> {
    await this.findOne(tenantId, id);
    return this.storesRepository.setManager(tenantId, id, userId);
  }
}
