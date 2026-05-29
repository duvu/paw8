import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  CreateContractDto,
  UpdateContractDto,
  ContractSearchDto,
  ContractResponseDto,
  ContractStatus,
  InterestType,
} from './dto/contract.dto';

@Injectable()
export class ContractsService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async generateContractCode(tenantId: string, storeId: string): Promise<string> {
    return this.dataSource.transaction(async (manager) => {
      const lockKey = `${tenantId}:${storeId}:contractseq`;
      await manager.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [lockKey]);

      const now = new Date();
      const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

      const stores = await manager.query(
        `SELECT code FROM stores WHERE id = $1 AND tenant_id = $2`,
        [storeId, tenantId],
      );
      if (!stores.length) throw new NotFoundException('Store not found');
      const storeCode = stores[0].code;

      const seqResult = await manager.query(
        `INSERT INTO contract_sequences (tenant_id, store_id, year_month, last_seq)
         VALUES ($1, $2, $3, 1)
         ON CONFLICT (tenant_id, store_id, year_month)
         DO UPDATE SET last_seq = contract_sequences.last_seq + 1
         RETURNING last_seq`,
        [tenantId, storeId, yearMonth],
      );

      const seq = seqResult[0].last_seq;
      return `${storeCode}-${yearMonth}-${String(seq).padStart(5, '0')}`;
    });
  }

  async create(
    tenantId: string,
    userId: string,
    dto: CreateContractDto,
  ): Promise<ContractResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      // Validate store belongs to tenant
      const stores = await manager.query(
        `SELECT id, code FROM stores WHERE id = $1 AND tenant_id = $2`,
        [dto.storeId, tenantId],
      );
      if (!stores.length) throw new BadRequestException('Store not found or does not belong to tenant');

      // Validate customer belongs to tenant
      const customers = await manager.query(
        `SELECT id FROM customers WHERE id = $1 AND tenant_id = $2`,
        [dto.customerId, tenantId],
      );
      if (!customers.length) throw new BadRequestException('Customer not found or does not belong to tenant');

      // Validate assets
      if (dto.assetIds.length > 0) {
        const assets = await manager.query(
          `SELECT id, status FROM assets WHERE id = ANY($1) AND tenant_id = $2 AND store_id = $3`,
          [dto.assetIds, tenantId, dto.storeId],
        );
        if (assets.length !== dto.assetIds.length) {
          throw new BadRequestException('Some assets not found or do not belong to tenant/store');
        }
        const pawned = assets.filter((a: any) => a.status === 'pawned');
        if (pawned.length > 0) {
          throw new BadRequestException('Some assets are already pawned');
        }
      }

      // Generate contract code using advisory lock
      const lockKey = `${tenantId}:${dto.storeId}:contractseq`;
      await manager.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [lockKey]);

      const now = new Date();
      const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
      const storeCode = stores[0].code;

      const seqResult = await manager.query(
        `INSERT INTO contract_sequences (tenant_id, store_id, year_month, last_seq)
         VALUES ($1, $2, $3, 1)
         ON CONFLICT (tenant_id, store_id, year_month)
         DO UPDATE SET last_seq = contract_sequences.last_seq + 1
         RETURNING last_seq`,
        [tenantId, dto.storeId, yearMonth],
      );
      const seq = seqResult[0].last_seq;
      const contractCode = `${storeCode}-${yearMonth}-${String(seq).padStart(5, '0')}`;

      // Create contract
      const contractResult = await manager.query(
        `INSERT INTO pawn_contracts (
          tenant_id, store_id, customer_id, contract_code,
          principal_amount, interest_rate, interest_type,
          start_date, due_date, status, notes, created_by, created_at, updated_at, updated_by
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'active',$10,$11,NOW(),NOW(),$11)
        RETURNING *`,
        [
          tenantId,
          dto.storeId,
          dto.customerId,
          contractCode,
          dto.principalAmount,
          dto.interestRate,
          dto.interestType,
          dto.startDate,
          dto.dueDate,
          dto.notes ?? null,
          userId,
        ],
      );
      const contract = contractResult[0];

      // Insert contract_assets
      if (dto.assetIds.length > 0) {
        for (const assetId of dto.assetIds) {
          await manager.query(
            `INSERT INTO contract_assets (tenant_id, contract_id, asset_id) VALUES ($1,$2,$3)`,
            [tenantId, contract.id, assetId],
          );
          await manager.query(
            `UPDATE assets SET status = 'pawned', updated_at = NOW() WHERE id = $1 AND tenant_id = $2`,
            [assetId, tenantId],
          );
          await manager.query(
            `UPDATE asset_inventory SET received_at = NOW(), status = 'in_store' WHERE asset_id = $1 AND tenant_id = $2`,
            [assetId, tenantId],
          );
        }
      }

      // Insert status history
      await manager.query(
        `INSERT INTO contract_status_history (tenant_id, contract_id, status, changed_by, changed_at)
         VALUES ($1,$2,'active',$3,NOW())`,
        [tenantId, contract.id, userId],
      );

      return this.findOne(tenantId, contract.id);
    });
  }

  async findAll(tenantId: string, searchDto: ContractSearchDto): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    const page = searchDto.page ?? 1;
    const limit = searchDto.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions: string[] = ['pc.tenant_id = $1'];
    const params: any[] = [tenantId];
    let idx = 2;

    if (searchDto.contractCode) {
      conditions.push(`pc.contract_code ILIKE $${idx++}`);
      params.push(`%${searchDto.contractCode}%`);
    }
    if (searchDto.customerId) {
      conditions.push(`pc.customer_id = $${idx++}`);
      params.push(searchDto.customerId);
    }
    if (searchDto.storeId) {
      conditions.push(`pc.store_id = $${idx++}`);
      params.push(searchDto.storeId);
    }
    if (searchDto.status) {
      conditions.push(`pc.status = $${idx++}`);
      params.push(searchDto.status);
    }
    if (searchDto.dueDateFrom) {
      conditions.push(`pc.due_date >= $${idx++}`);
      params.push(searchDto.dueDateFrom);
    }
    if (searchDto.dueDateTo) {
      conditions.push(`pc.due_date <= $${idx++}`);
      params.push(searchDto.dueDateTo);
    }

    const where = conditions.join(' AND ');

    const countResult = await this.dataSource.query(
      `SELECT COUNT(*) FROM pawn_contracts pc WHERE ${where}`,
      params,
    );
    const total = parseInt(countResult[0].count, 10);

    const data = await this.dataSource.query(
      `SELECT pc.*,
        c.full_name as customer_full_name, c.phone as customer_phone, c.identity_number as customer_identity_number
       FROM pawn_contracts pc
       LEFT JOIN customers c ON c.id = pc.customer_id
       WHERE ${where}
       ORDER BY pc.created_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, limit, offset],
    );

    return { data, total, page, limit };
  }

  async findOne(tenantId: string, id: string): Promise<ContractResponseDto> {
    const contracts = await this.dataSource.query(
      `SELECT pc.*,
        c.full_name as customer_full_name, c.phone as customer_phone, c.identity_number as customer_identity_number
       FROM pawn_contracts pc
       LEFT JOIN customers c ON c.id = pc.customer_id
       WHERE pc.id = $1 AND pc.tenant_id = $2`,
      [id, tenantId],
    );
    if (!contracts.length) throw new NotFoundException('Contract not found');
    const contract = contracts[0];

    const assets = await this.dataSource.query(
      `SELECT a.id, a.asset_type, a.asset_name, a.brand, a.model, a.status
       FROM contract_assets ca
       JOIN assets a ON a.id = ca.asset_id
       WHERE ca.contract_id = $1 AND ca.tenant_id = $2`,
      [id, tenantId],
    );

    return {
      ...contract,
      assets: assets.map((a: any) => ({
        id: a.id,
        assetType: a.asset_type,
        assetName: a.asset_name,
        brand: a.brand,
        model: a.model,
        status: a.status,
      })),
      customer: {
        id: contract.customer_id,
        fullName: contract.customer_full_name,
        phone: contract.customer_phone,
        identityNumber: contract.customer_identity_number,
      },
    } as any;
  }

  async update(tenantId: string, id: string, dto: UpdateContractDto): Promise<ContractResponseDto> {
    const contracts = await this.dataSource.query(
      `SELECT id FROM pawn_contracts WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId],
    );
    if (!contracts.length) throw new NotFoundException('Contract not found');

    if (dto.dueDate !== undefined) {
      // Check no transactions exist
      const txCount = await this.dataSource.query(
        `SELECT COUNT(*) FROM contract_transactions WHERE contract_id = $1 AND tenant_id = $2`,
        [id, tenantId],
      );
      if (parseInt(txCount[0].count, 10) > 0) {
        throw new BadRequestException('Cannot update due date after transactions have been recorded');
      }
    }

    const updates: string[] = ['updated_at = NOW()'];
    const params: any[] = [tenantId, id];
    let idx = 3;

    if (dto.notes !== undefined) {
      updates.push(`notes = $${idx++}`);
      params.push(dto.notes);
    }
    if (dto.dueDate !== undefined) {
      updates.push(`due_date = $${idx++}`);
      params.push(dto.dueDate);
    }

    await this.dataSource.query(
      `UPDATE pawn_contracts SET ${updates.join(', ')} WHERE tenant_id = $1 AND id = $2`,
      params,
    );

    return this.findOne(tenantId, id);
  }

  async updateStatus(tenantId: string, id: string, status: ContractStatus, userId: string): Promise<ContractResponseDto> {
    const contracts = await this.dataSource.query(
      `SELECT id FROM pawn_contracts WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId],
    );
    if (!contracts.length) throw new NotFoundException('Contract not found');

    await this.dataSource.query(
      `UPDATE pawn_contracts SET status = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3`,
      [status, id, tenantId],
    );

    await this.dataSource.query(
      `INSERT INTO contract_status_history (tenant_id, contract_id, status, changed_by, changed_at)
       VALUES ($1,$2,$3,$4,NOW())`,
      [tenantId, id, status, userId],
    );

    return this.findOne(tenantId, id);
  }

  async getUpcomingDue(tenantId: string, storeIds?: string[], days: number = 7): Promise<any[]> {
    let query = `SELECT pc.*, c.full_name as customer_full_name, c.phone as customer_phone
      FROM pawn_contracts pc
      LEFT JOIN customers c ON c.id = pc.customer_id
      WHERE pc.tenant_id = $1
        AND pc.due_date BETWEEN NOW() AND NOW() + interval '${days} days'
        AND pc.status IN ('active','near_due','extended')`;
    const params: any[] = [tenantId];

    if (storeIds && storeIds.length > 0) {
      query += ` AND pc.store_id = ANY($2)`;
      params.push(storeIds);
    }

    query += ` ORDER BY pc.due_date ASC`;
    return this.dataSource.query(query, params);
  }

  async getOverdue(tenantId: string, storeIds?: string[]): Promise<any[]> {
    let query = `SELECT pc.*, c.full_name as customer_full_name, c.phone as customer_phone,
        NOW()::date - pc.due_date::date AS days_overdue
      FROM pawn_contracts pc
      LEFT JOIN customers c ON c.id = pc.customer_id
      WHERE pc.tenant_id = $1
        AND pc.due_date < NOW()
        AND pc.status IN ('active','near_due','extended','overdue')`;
    const params: any[] = [tenantId];

    if (storeIds && storeIds.length > 0) {
      query += ` AND pc.store_id = ANY($2)`;
      params.push(storeIds);
    }

    query += ` ORDER BY pc.due_date ASC`;
    return this.dataSource.query(query, params);
  }

  calculateInterest(
    principalAmount: number,
    interestRate: number,
    interestType: InterestType,
    startDate: Date,
    toDate: Date,
  ): number {
    const msPerDay = 1000 * 60 * 60 * 24;
    const days = Math.max(0, Math.ceil((new Date(toDate).getTime() - new Date(startDate).getTime()) / msPerDay));

    switch (interestType) {
      case InterestType.DAILY:
        return principalAmount * (interestRate / 100) * days;
      case InterestType.MONTHLY: {
        const months = Math.ceil(days / 30);
        return principalAmount * (interestRate / 100) * months;
      }
      case InterestType.TERM:
        return principalAmount * (interestRate / 100);
      default:
        return 0;
    }
  }
}
