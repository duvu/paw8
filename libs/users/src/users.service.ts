import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  CreateUserDto,
  UpdateUserDto,
  AssignStoreDto,
  UserResponseDto,
  UserStatus,
} from './dto/user.dto';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
  ) {}

  async create(tenantId: string, dto: CreateUserDto): Promise<UserResponseDto> {
    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.usersRepository.insert(tenantId, {
      email: dto.email,
      fullName: dto.fullName,
      phone: dto.phone ?? null,
      passwordHash,
    });

    const existingRole = await this.usersRepository.findRoleByName(tenantId, dto.role);
    const roleId = existingRole
      ? existingRole.id
      : (await this.usersRepository.insertRole(tenantId, dto.role)).id;

    await this.usersRepository.insertUserRole(tenantId, user.id, roleId);

    return this.mapToDto(user, dto.role, []);
  }

  async findAll(
    tenantId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: UserResponseDto[]; total: number }> {
    const offset = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      this.usersRepository.findAll(tenantId, limit, offset),
      this.usersRepository.countByTenant(tenantId),
    ]);

    return {
      data: rows.map((r: any) => this.mapToDto(r, r.role, r.allowed_store_ids ?? [])),
      total,
    };
  }

  async findOne(tenantId: string, id: string): Promise<UserResponseDto> {
    const row = await this.usersRepository.findById(tenantId, id);
    if (!row) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return this.mapToDto(row, row.role, row.allowed_store_ids ?? []);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (dto.fullName !== undefined) {
      fields.push(`full_name = $${idx++}`);
      values.push(dto.fullName);
    }
    if (dto.phone !== undefined) {
      fields.push(`phone = $${idx++}`);
      values.push(dto.phone);
    }
    if (dto.status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(dto.status);
    }

    if (fields.length === 0) {
      return this.findOne(tenantId, id);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id, tenantId);

    await this.usersRepository.update(tenantId, id, fields, values);
    return this.findOne(tenantId, id);
  }

  async setStatus(
    tenantId: string,
    id: string,
    status: UserStatus,
  ): Promise<UserResponseDto> {
    const result = await this.usersRepository.setStatus(tenantId, id, status);
    if (result.length === 0) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return this.findOne(tenantId, id);
  }

  async assignStores(
    tenantId: string,
    id: string,
    dto: AssignStoreDto,
  ): Promise<void> {
    const user = await this.usersRepository.findByIdBasic(tenantId, id);
    if (user.length === 0) {
      throw new NotFoundException(`User ${id} not found`);
    }

    await this.usersRepository.deleteStoreAssignments(tenantId, id);

    if (dto.storeIds.length > 0) {
      await this.usersRepository.insertStoreAssignments(tenantId, id, dto.storeIds);
    }
  }

  private mapToDto(row: any, role: string, allowedStoreIds: string[]): UserResponseDto {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      email: row.email,
      fullName: row.full_name,
      phone: row.phone,
      status: row.status,
      role,
      allowedStoreIds,
      createdAt: row.created_at,
    };
  }
}
