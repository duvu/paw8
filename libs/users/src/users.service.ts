import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import {
  CreateUserDto,
  UpdateUserDto,
  AssignStoreDto,
  UserResponseDto,
  UserStatus,
} from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async create(tenantId: string, dto: CreateUserDto): Promise<UserResponseDto> {
    const passwordHash = await bcrypt.hash(dto.password, 12);

    const result = await this.dataSource.query(
      `INSERT INTO users (tenant_id, email, full_name, phone, password_hash, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'active', NOW(), NOW())
       RETURNING id, tenant_id, email, full_name, phone, status, created_at`,
      [tenantId, dto.email, dto.fullName, dto.phone ?? null, passwordHash],
    );

    const user = result[0];

    // Get or create role
    const roleResult = await this.dataSource.query(
      `SELECT id FROM roles WHERE tenant_id = $1 AND name = $2`,
      [tenantId, dto.role],
    );

    let roleId: string;
    if (roleResult.length === 0) {
      const newRole = await this.dataSource.query(
        `INSERT INTO roles (tenant_id, name) VALUES ($1, $2) RETURNING id`,
        [tenantId, dto.role],
      );
      roleId = newRole[0].id;
    } else {
      roleId = roleResult[0].id;
    }

    await this.dataSource.query(
      `INSERT INTO user_roles (tenant_id, user_id, role_id) VALUES ($1, $2, $3)`,
      [tenantId, user.id, roleId],
    );

    return this.mapToDto(user, dto.role, []);
  }

  async findAll(
    tenantId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: UserResponseDto[]; total: number }> {
    const offset = (page - 1) * limit;

    const [rows, countResult] = await Promise.all([
      this.dataSource.query(
        `SELECT u.id, u.tenant_id, u.email, u.full_name, u.phone, u.status, u.created_at,
                r.name AS role,
                COALESCE(json_agg(usa.store_id) FILTER (WHERE usa.store_id IS NOT NULL), '[]') AS allowed_store_ids
         FROM users u
         LEFT JOIN user_roles ur ON ur.user_id = u.id AND ur.tenant_id = u.tenant_id
         LEFT JOIN roles r ON r.id = ur.role_id
         LEFT JOIN user_store_assignments usa ON usa.user_id = u.id AND usa.tenant_id = u.tenant_id
         WHERE u.tenant_id = $1
         GROUP BY u.id, r.name
         ORDER BY u.created_at DESC
         LIMIT $2 OFFSET $3`,
        [tenantId, limit, offset],
      ),
      this.dataSource.query(
        `SELECT COUNT(*) AS total FROM users WHERE tenant_id = $1`,
        [tenantId],
      ),
    ]);

    return {
      data: rows.map((r: any) =>
        this.mapToDto(r, r.role, r.allowed_store_ids ?? []),
      ),
      total: parseInt(countResult[0].total, 10),
    };
  }

  async findOne(tenantId: string, id: string): Promise<UserResponseDto> {
    const result = await this.dataSource.query(
      `SELECT u.id, u.tenant_id, u.email, u.full_name, u.phone, u.status, u.created_at,
              r.name AS role,
              COALESCE(json_agg(usa.store_id) FILTER (WHERE usa.store_id IS NOT NULL), '[]') AS allowed_store_ids
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id AND ur.tenant_id = u.tenant_id
       LEFT JOIN roles r ON r.id = ur.role_id
       LEFT JOIN user_store_assignments usa ON usa.user_id = u.id AND usa.tenant_id = u.tenant_id
       WHERE u.id = $1 AND u.tenant_id = $2
       GROUP BY u.id, r.name`,
      [id, tenantId],
    );

    if (result.length === 0) {
      throw new NotFoundException(`User ${id} not found`);
    }

    const row = result[0];
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

    await this.dataSource.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx++} AND tenant_id = $${idx++}`,
      values,
    );

    return this.findOne(tenantId, id);
  }

  async setStatus(
    tenantId: string,
    id: string,
    status: UserStatus,
  ): Promise<UserResponseDto> {
    const result = await this.dataSource.query(
      `UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3 RETURNING id`,
      [status, id, tenantId],
    );

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
    const user = await this.dataSource.query(
      `SELECT id FROM users WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId],
    );
    if (user.length === 0) {
      throw new NotFoundException(`User ${id} not found`);
    }

    await this.dataSource.query(
      `DELETE FROM user_store_assignments WHERE user_id = $1 AND tenant_id = $2`,
      [id, tenantId],
    );

    if (dto.storeIds.length > 0) {
      const insertValues = dto.storeIds
        .map((_, i) => `($1, $2, $${i + 3})`)
        .join(', ');
      await this.dataSource.query(
        `INSERT INTO user_store_assignments (tenant_id, user_id, store_id) VALUES ${insertValues}`,
        [tenantId, id, ...dto.storeIds],
      );
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
