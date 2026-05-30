import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerSearchDto,
  CustomerResponseDto,
} from './dto/customer.dto';
import { CustomersRepository } from './customers.repository';

@Injectable()
export class CustomersService {
  constructor(
    private readonly customersRepository: CustomersRepository,
  ) {}

  async create(
    tenantId: string,
    storeId: string,
    userId: string,
    dto: CreateCustomerDto,
  ): Promise<CustomerResponseDto> {
    const dupIdentity = await this.customersRepository.findByIdentityNumber(tenantId, dto.identityNumber);
    if (dupIdentity.length > 0) {
      throw new ConflictException('DUPLICATE_IDENTITY');
    }

    const dupPhone = await this.customersRepository.findByPhone(tenantId, dto.phone);
    if (dupPhone.length > 0) {
      throw new ConflictException('DUPLICATE_PHONE');
    }

    const row = await this.customersRepository.insert(tenantId, {
      fullName: dto.fullName,
      phone: dto.phone,
      identityNumber: dto.identityNumber,
      dateOfBirth: dto.dateOfBirth ?? null,
      permanentAddress: dto.permanentAddress ?? null,
      currentAddress: dto.currentAddress ?? null,
      occupation: dto.occupation ?? null,
      emergencyContactName: dto.emergencyContactName ?? null,
      emergencyContactPhone: dto.emergencyContactPhone ?? null,
      notes: dto.notes ?? null,
    });

    return this.mapToDto(row);
  }

  async search(
    tenantId: string,
    searchDto: CustomerSearchDto,
  ): Promise<{ data: CustomerResponseDto[]; total: number }> {
    const page = searchDto.page ?? 1;
    const limit = searchDto.limit ?? 20;
    const offset = (page - 1) * limit;
    const query = searchDto.query;

    const [rows, total] = await Promise.all([
      this.customersRepository.search(tenantId, query, limit, offset),
      this.customersRepository.count(tenantId, query),
    ]);

    return {
      data: rows.map((r: any) => ({
        ...this.mapToDto(r),
        activeContracts: parseInt(r.active_contracts ?? '0', 10),
      })),
      total,
    };
  }

  async findOne(tenantId: string, id: string): Promise<CustomerResponseDto> {
    const row = await this.customersRepository.findById(tenantId, id);
    if (!row) {
      throw new NotFoundException(`Customer ${id} not found`);
    }
    return this.mapToDto(row);
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

    await this.customersRepository.update(tenantId, id, fields, values);
    return this.findOne(tenantId, id);
  }

  async getContractHistory(tenantId: string, customerId: string): Promise<any[]> {
    await this.findOne(tenantId, customerId);
    return this.customersRepository.getContractHistory(tenantId, customerId);
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
