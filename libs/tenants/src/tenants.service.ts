import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  CreateTenantDto,
  UpdateTenantDto,
  TenantStatus,
  TenantResponseDto,
  OnboardTenantDto,
  SetTenantOwnerDto,
  TenantUsageDto,
} from './dto/tenant.dto';
import { TenantsRepository } from './tenants.repository';
import { UsersRepository } from '../../users/src/users.repository';

@Injectable()
export class TenantsService {
  constructor(
    private readonly tenantsRepository: TenantsRepository,
    private readonly usersRepository: UsersRepository,
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

  async onboard(dto: OnboardTenantDto): Promise<{ tenant: TenantResponseDto; ownerId: string }> {
    const queryRunner = this.tenantsRepository['dataSource'].createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const tenantRows = await queryRunner.query(
        `INSERT INTO tenants (name, code, status, plan, max_stores, max_users, trial_end_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, name, code, status, plan,
           max_stores AS "maxStores", max_users AS "maxUsers",
           trial_end_date AS "trialEndDate", created_at AS "createdAt"`,
        [
          dto.name,
          dto.code.toUpperCase(),
          dto.trialEndDate ? TenantStatus.TRIAL : TenantStatus.ACTIVE,
          dto.plan ?? 'free',
          dto.maxStores ?? 1,
          dto.maxUsers ?? 5,
          dto.trialEndDate ?? null,
        ],
      );
      const tenant: TenantResponseDto = tenantRows[0];

      const passwordHash = await bcrypt.hash(dto.ownerPassword, 12);
      const userRows = await queryRunner.query(
        `INSERT INTO users (tenant_id, email, full_name, phone, password_hash, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'active', NOW(), NOW())
         RETURNING id`,
        [tenant.id, dto.ownerEmail, dto.ownerFullName, dto.ownerPhone ?? null, passwordHash],
      );
      const ownerId: string = userRows[0].id;

      const roleRows = await queryRunner.query(
        `INSERT INTO roles (tenant_id, name) VALUES ($1, 'tenant_owner')
         ON CONFLICT (tenant_id, name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [tenant.id],
      );
      const roleId: string = roleRows[0].id;
      await queryRunner.query(
        `INSERT INTO user_roles (tenant_id, user_id, role_id) VALUES ($1, $2, $3)`,
        [tenant.id, ownerId, roleId],
      );

      await queryRunner.commitTransaction();
      return { tenant, ownerId };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async setOwner(tenantId: string, dto: SetTenantOwnerDto): Promise<{ ownerId: string }> {
    const tenant = await this.findOne(tenantId);
    if (!tenant) throw new NotFoundException(`Tenant ${tenantId} not found`);

    const alreadyHasOwner = await this.tenantsRepository.hasOwner(tenantId);
    if (alreadyHasOwner) {
      throw new ConflictException('Tenant already has an owner. Use user management to change ownership.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.usersRepository.insert(tenantId, {
      email: dto.email,
      fullName: dto.fullName,
      phone: dto.phone ?? null,
      passwordHash,
    });

    const existingRole = await this.usersRepository.findRoleByName(tenantId, 'tenant_owner');
    const roleId = existingRole
      ? existingRole.id
      : (await this.usersRepository.insertRole(tenantId, 'tenant_owner')).id;
    await this.usersRepository.insertUserRole(tenantId, user.id, roleId);

    return { ownerId: user.id };
  }

  async getUsage(tenantId: string): Promise<TenantUsageDto> {
    const tenant = await this.findOne(tenantId);

    const [currentStores, currentUsers] = await Promise.all([
      this.tenantsRepository.countStores(tenantId),
      this.tenantsRepository.countUsers(tenantId),
    ]);

    return {
      stores: { current: currentStores, max: tenant.maxStores },
      users: { current: currentUsers, max: tenant.maxUsers },
    };
  }

  async getByIdForPlanCheck(tenantId: string): Promise<TenantResponseDto | null> {
    return this.tenantsRepository.findById(tenantId);
  }
}
