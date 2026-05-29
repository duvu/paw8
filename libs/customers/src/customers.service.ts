import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerSearchDto,
  CustomerResponseDto,
} from './dto/customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async create(
    tenantId: string,
    storeId: string,
    userId: string,
    dto: CreateCustomerDto,
  ): Promise<CustomerResponseDto> {
    const dupIdentity = await this.dataSource.query(
      `SELECT id FROM customers WHERE tenant_id = $1 AND identity_number = $2`,
      [tenantId, dto.identityNumber],
    );
    if (dupIdentity.length > 0) {
      throw new ConflictException('DUPLICATE_IDENTITY');
    }

    const dupPhone = await this.dataSource.query(
      `SELECT id FROM customers WHERE tenant_id = $1 AND phone = $2`,
      [tenantId, dto.phone],
    );
    if (dupPhone.length > 0) {
      throw new ConflictException('DUPLICATE_PHONE');
    }

    const result = await this.dataSource.query(
      `INSERT INTO customers (
        tenant_id, full_name, phone, identity_number, date_of_birth,
        permanent_address, current_address, occupation,
        emergency_contact_name, emergency_contact_phone, notes, status, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'active',NOW(),NOW())
      RETURNING id, tenant_id, full_name, phone, identity_number, status, created_at`,
      [
        tenantId,
        dto.fullName,
        dto.phone,
        dto.identityNumber,
        dto.dateOfBirth ?? null,
        dto.permanentAddress ?? null,
        dto.currentAddress ?? null,
        dto.occupation ?? null,
        dto.emergencyContactName ?? null,
        dto.emergencyContactPhone ?? null,
        dto.notes ?? null,
      ],
    );

    return this.mapToDto(result[0]);
  }

  async search(
    tenantId: string,
    searchDto: CustomerSearchDto,
  ): Promise<{ data: CustomerResponseDto[]; total: number }> {
    const page = searchDto.page ?? 1;
    const limit = searchDto.limit ?? 20;
    const offset = (page - 1) * limit;
    const query = searchDto.query;

    const whereClause = query
      ? `AND (c.full_name ILIKE $2 OR c.phone ILIKE $2 OR c.identity_number ILIKE $2)`
      : '';
    const params: any[] = query
      ? [tenantId, `%${query}%`, limit, offset]
      : [tenantId, limit, offset];

    const limitIdx = query ? 3 : 2;
    const offsetIdx = query ? 4 : 3;

    const countParams: any[] = query ? [tenantId, `%${query}%`] : [tenantId];

    const [rows, countResult] = await Promise.all([
      this.dataSource.query(
        `SELECT c.id, c.tenant_id, c.full_name, c.phone, c.identity_number, c.status, c.created_at,
                COUNT(pc.id) FILTER (WHERE pc.status NOT IN ('settled','cancelled','liquidated')) AS active_contracts
         FROM customers c
         LEFT JOIN pawn_contracts pc ON pc.customer_id = c.id AND pc.tenant_id = c.tenant_id
         WHERE c.tenant_id = $1 ${whereClause}
         GROUP BY c.id
         ORDER BY c.created_at DESC
         LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
        params,
      ),
      this.dataSource.query(
        `SELECT COUNT(*) AS total FROM customers c WHERE c.tenant_id = $1 ${whereClause}`,
        countParams,
      ),
    ]);

    return {
      data: rows.map((r: any) => ({
        ...this.mapToDto(r),
        activeContracts: parseInt(r.active_contracts ?? '0', 10),
      })),
      total: parseInt(countResult[0].total, 10),
    };
  }

  async findOne(tenantId: string, id: string): Promise<CustomerResponseDto> {
    const result = await this.dataSource.query(
      `SELECT id, tenant_id, full_name, phone, identity_number, status, created_at
       FROM customers
       WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId],
    );

    if (result.length === 0) {
      throw new NotFoundException(`Customer ${id} not found`);
    }

    return this.mapToDto(result[0]);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateCustomerDto,
  ): Promise<CustomerResponseDto> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const fieldMap: Record<string, string> = {
      fullName: 'full_name',
      phone: 'phone',
      identityNumber: 'identity_number',
      dateOfBirth: 'date_of_birth',
      permanentAddress: 'permanent_address',
      currentAddress: 'current_address',
      occupation: 'occupation',
      emergencyContactName: 'emergency_contact_name',
      emergencyContactPhone: 'emergency_contact_phone',
      notes: 'notes',
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
      `UPDATE customers SET ${fields.join(', ')} WHERE id = $${idx++} AND tenant_id = $${idx++}`,
      values,
    );

    return this.findOne(tenantId, id);
  }

  async getContractHistory(tenantId: string, customerId: string): Promise<any[]> {
    await this.findOne(tenantId, customerId);

    return this.dataSource.query(
      `SELECT id, contract_code, status, principal_amount, start_date, due_date, created_at
       FROM pawn_contracts
       WHERE customer_id = $1 AND tenant_id = $2
       ORDER BY created_at DESC`,
      [customerId, tenantId],
    );
  }

  private mapToDto(row: any): CustomerResponseDto {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      fullName: row.full_name,
      phone: row.phone,
      identityNumber: row.identity_number,
      status: row.status,
      createdAt: row.created_at,
    };
  }
}
