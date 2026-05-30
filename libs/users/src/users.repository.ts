import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class UsersRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async insert(tenantId: string, data: {
    email: string;
    fullName: string;
    phone?: string | null;
    passwordHash: string;
  }): Promise<any> {
    const result = await this.dataSource.query(
      `INSERT INTO users (tenant_id, email, full_name, phone, password_hash, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'active', NOW(), NOW())
       RETURNING id, tenant_id, email, full_name, phone, status, created_at`,
      [tenantId, data.email, data.fullName, data.phone ?? null, data.passwordHash],
    );
    return result[0];
  }

  async findRoleByName(tenantId: string, name: string): Promise<{ id: string } | null> {
    const result = await this.dataSource.query(
      `SELECT id FROM roles WHERE tenant_id = $1 AND name = $2`,
      [tenantId, name],
    );
    return result[0] ?? null;
  }

  async insertRole(tenantId: string, name: string): Promise<{ id: string }> {
    const result = await this.dataSource.query(
      `INSERT INTO roles (tenant_id, name) VALUES ($1, $2) RETURNING id`,
      [tenantId, name],
    );
    return result[0];
  }

  async insertUserRole(tenantId: string, userId: string, roleId: string): Promise<void> {
    await this.dataSource.query(
      `INSERT INTO user_roles (tenant_id, user_id, role_id) VALUES ($1, $2, $3)`,
      [tenantId, userId, roleId],
    );
  }

  async findAll(tenantId: string, limit: number, offset: number): Promise<any[]> {
    return this.dataSource.query(
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
    );
  }

  async countByTenant(tenantId: string): Promise<number> {
    const result = await this.dataSource.query(
      `SELECT COUNT(*) AS total FROM users WHERE tenant_id = $1`,
      [tenantId],
    );
    return parseInt(result[0].total, 10);
  }

  async findById(tenantId: string, id: string): Promise<any | null> {
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
    return result[0] ?? null;
  }

  async update(tenantId: string, id: string, fields: string[], values: any[]): Promise<void> {
    await this.dataSource.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${values.length - 1} AND tenant_id = $${values.length}`,
      values,
    );
  }

  async setStatus(tenantId: string, id: string, status: string): Promise<any[]> {
    return this.dataSource.query(
      `UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3 RETURNING id`,
      [status, id, tenantId],
    );
  }

  async findByIdBasic(tenantId: string, id: string): Promise<any[]> {
    return this.dataSource.query(
      `SELECT id FROM users WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId],
    );
  }

  async deleteStoreAssignments(tenantId: string, userId: string): Promise<void> {
    await this.dataSource.query(
      `DELETE FROM user_store_assignments WHERE user_id = $1 AND tenant_id = $2`,
      [userId, tenantId],
    );
  }

  async insertStoreAssignments(tenantId: string, userId: string, storeIds: string[]): Promise<void> {
    const insertValues = storeIds.map((_, i) => `($1, $2, $${i + 3})`).join(', ');
    await this.dataSource.query(
      `INSERT INTO user_store_assignments (tenant_id, user_id, store_id) VALUES ${insertValues}`,
      [tenantId, userId, ...storeIds],
    );
  }
}
