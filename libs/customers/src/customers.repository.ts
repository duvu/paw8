import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class CustomersRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findByIdentityNumber(tenantId: string, identityNumber: string): Promise<any[]> {
    return this.dataSource.query(
      `SELECT id FROM customers WHERE tenant_id = $1 AND identity_number = $2`,
      [tenantId, identityNumber],
    );
  }

  async findByPhone(tenantId: string, phone: string): Promise<any[]> {
    return this.dataSource.query(
      `SELECT id FROM customers WHERE tenant_id = $1 AND phone = $2`,
      [tenantId, phone],
    );
  }

  async insert(tenantId: string, data: {
    fullName: string;
    phone: string;
    identityNumber: string;
    dateOfBirth?: string | null;
    permanentAddress?: string | null;
    currentAddress?: string | null;
    occupation?: string | null;
    emergencyContactName?: string | null;
    emergencyContactPhone?: string | null;
    notes?: string | null;
  }): Promise<any> {
    const result = await this.dataSource.query(
      `INSERT INTO customers (
        tenant_id, full_name, phone, identity_number, date_of_birth,
        permanent_address, current_address, occupation,
        emergency_contact_name, emergency_contact_phone, notes, status, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'active',NOW(),NOW())
      RETURNING id, tenant_id, full_name, phone, identity_number, status, created_at`,
      [
        tenantId,
        data.fullName,
        data.phone,
        data.identityNumber,
        data.dateOfBirth ?? null,
        data.permanentAddress ?? null,
        data.currentAddress ?? null,
        data.occupation ?? null,
        data.emergencyContactName ?? null,
        data.emergencyContactPhone ?? null,
        data.notes ?? null,
      ],
    );
    return result[0];
  }

  async search(tenantId: string, query: string | undefined, limit: number, offset: number): Promise<any[]> {
    const whereClause = query
      ? `AND (c.full_name ILIKE $2 OR c.phone ILIKE $2 OR c.identity_number ILIKE $2)`
      : '';
    const params: any[] = query
      ? [tenantId, `%${query}%`, limit, offset]
      : [tenantId, limit, offset];
    const limitIdx = query ? 3 : 2;
    const offsetIdx = query ? 4 : 3;

    return this.dataSource.query(
      `SELECT c.id, c.tenant_id, c.full_name, c.phone, c.identity_number, c.status, c.created_at,
              COUNT(pc.id) FILTER (WHERE pc.status NOT IN ('settled','cancelled','liquidated')) AS active_contracts
       FROM customers c
       LEFT JOIN pawn_contracts pc ON pc.customer_id = c.id AND pc.tenant_id = c.tenant_id
       WHERE c.tenant_id = $1 ${whereClause}
       GROUP BY c.id
       ORDER BY c.created_at DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      params,
    );
  }

  async count(tenantId: string, query: string | undefined): Promise<number> {
    const whereClause = query
      ? `AND (c.full_name ILIKE $2 OR c.phone ILIKE $2 OR c.identity_number ILIKE $2)`
      : '';
    const params: any[] = query ? [tenantId, `%${query}%`] : [tenantId];

    const result = await this.dataSource.query(
      `SELECT COUNT(*) AS total FROM customers c WHERE c.tenant_id = $1 ${whereClause}`,
      params,
    );
    return parseInt(result[0].total, 10);
  }

  async findById(tenantId: string, id: string): Promise<any | null> {
    const result = await this.dataSource.query(
      `SELECT id, tenant_id, full_name, phone, identity_number, status, created_at
       FROM customers
       WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId],
    );
    return result[0] ?? null;
  }

  async update(tenantId: string, id: string, fields: string[], values: any[]): Promise<void> {
    await this.dataSource.query(
      `UPDATE customers SET ${fields.join(', ')} WHERE id = $${values.length - 1} AND tenant_id = $${values.length}`,
      values,
    );
  }

  async getContractHistory(tenantId: string, customerId: string): Promise<any[]> {
    return this.dataSource.query(
      `SELECT id, contract_code, status, principal_amount, start_date, due_date, created_at
       FROM pawn_contracts
       WHERE customer_id = $1 AND tenant_id = $2
       ORDER BY created_at DESC`,
      [customerId, tenantId],
    );
  }
}
