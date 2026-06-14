import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ContractStatus } from './dto/contract.dto';

@Injectable()
export class ContractsRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findStoreByIdAndTenant(
    storeId: string,
    tenantId: string,
    manager?: any,
  ): Promise<{ id: string; code: string } | null> {
    const ds = manager ?? this.dataSource;
    const [row] = await ds.query(
      `SELECT id, code FROM stores WHERE id = $1 AND tenant_id = $2`,
      [storeId, tenantId],
    );
    return row ?? null;
  }

  async findCustomerByIdAndTenant(customerId: string, tenantId: string, manager?: any): Promise<{ id: string } | null> {
    const ds = manager ?? this.dataSource;
    const [row] = await ds.query(
      `SELECT id FROM customers WHERE id = $1 AND tenant_id = $2`,
      [customerId, tenantId],
    );
    return row ?? null;
  }

  async findAssetsByIdsForStore(assetIds: string[], tenantId: string, storeId: string, manager?: any): Promise<any[]> {
    const ds = manager ?? this.dataSource;
    return ds.query(
      `SELECT id, status FROM assets WHERE id = ANY($1) AND tenant_id = $2 AND store_id = $3`,
      [assetIds, tenantId, storeId],
    );
  }

  async findAssetsInActiveContracts(assetIds: string[], tenantId: string, manager?: any): Promise<any[]> {
    const ds = manager ?? this.dataSource;
    return ds.query(
      `SELECT ca.asset_id
       FROM contract_assets ca
       JOIN pawn_contracts pc ON pc.id = ca.contract_id
       WHERE ca.asset_id = ANY($1)
         AND pc.tenant_id = $2
         AND pc.status NOT IN ('settled', 'cancelled', 'liquidated')`,
      [assetIds, tenantId],
    );
  }

  async insertContract(fields: {
    tenantId: string;
    storeId: string;
    customerId: string;
    contractCode: string;
    principalAmount: number;
    interestRate: number;
    interestType: string;
    startDate: Date | string;
    dueDate: Date | string;
    notes: string | null;
    createdBy: string;
    policyId?: string | null;
  }, manager?: any): Promise<any> {
    const ds = manager ?? this.dataSource;
    const [contract] = await ds.query(
      `INSERT INTO pawn_contracts (
        tenant_id, store_id, customer_id, contract_code,
        principal_amount, interest_rate, interest_type,
        start_date, due_date, status, notes, policy_id, created_by, created_at, updated_at, updated_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'active',$10,$11,$12,NOW(),NOW(),$12)
      RETURNING *`,
      [
        fields.tenantId,
        fields.storeId,
        fields.customerId,
        fields.contractCode,
        fields.principalAmount,
        fields.interestRate,
        fields.interestType,
        fields.startDate,
        fields.dueDate,
        fields.notes,
        fields.policyId ?? null,
        fields.createdBy,
      ],
    );
    return contract;
  }

  async insertContractAsset(tenantId: string, contractId: string, assetId: string, manager?: any): Promise<void> {
    const ds = manager ?? this.dataSource;
    await ds.query(
      `INSERT INTO contract_assets (tenant_id, contract_id, asset_id) VALUES ($1,$2,$3)`,
      [tenantId, contractId, assetId],
    );
  }

  async setAssetHolding(assetId: string, tenantId: string, manager?: any): Promise<void> {
    const ds = manager ?? this.dataSource;
    await ds.query(
      `UPDATE assets SET status = 'holding', updated_at = NOW() WHERE id = $1 AND tenant_id = $2`,
      [assetId, tenantId],
    );
  }

  async setAssetInventoryInStorage(assetId: string, tenantId: string, manager?: any): Promise<void> {
    const ds = manager ?? this.dataSource;
    await ds.query(
      `UPDATE asset_inventory SET received_at = NOW(), status = 'in_storage' WHERE asset_id = $1 AND tenant_id = $2`,
      [assetId, tenantId],
    );
  }

  async insertStatusHistory(tenantId: string, contractId: string, toStatus: string, userId: string, manager?: any): Promise<void> {
    const ds = manager ?? this.dataSource;
    await ds.query(
      `INSERT INTO contract_status_history (tenant_id, contract_id, to_status, changed_by, created_at)
       VALUES ($1,$2,$3,$4,NOW())`,
      [tenantId, contractId, toStatus, userId],
    );
  }

  async findAll(_tenantId: string, conditions: string[], params: any[], limit: number, offset: number): Promise<any[]> {
    const where = conditions.join(' AND ');
    return this.dataSource.query(
      `SELECT pc.*,
        c.full_name as customer_full_name, c.phone as customer_phone, c.identity_number as customer_identity_number
       FROM pawn_contracts pc
       LEFT JOIN customers c ON c.id = pc.customer_id
       WHERE ${where}
       ORDER BY pc.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    );
  }

  async countAll(_tenantId: string, conditions: string[], params: any[]): Promise<number> {
    const where = conditions.join(' AND ');
    const [row] = await this.dataSource.query(
      `SELECT COUNT(*) FROM pawn_contracts pc WHERE ${where}`,
      params,
    );
    return parseInt(row.count, 10);
  }

  async findById(tenantId: string, id: string, manager?: any): Promise<any | null> {
    const ds = manager ?? this.dataSource;
    const [contract] = await ds.query(
      `SELECT pc.*,
        c.full_name as customer_full_name, c.phone as customer_phone, c.identity_number as customer_identity_number
       FROM pawn_contracts pc
       LEFT JOIN customers c ON c.id = pc.customer_id
       WHERE pc.id = $1 AND pc.tenant_id = $2`,
      [id, tenantId],
    );
    return contract ?? null;
  }

  async findContractAssets(contractId: string, tenantId: string, manager?: any): Promise<any[]> {
    const ds = manager ?? this.dataSource;
    return ds.query(
      `SELECT a.id, a.asset_type, a.asset_name, a.brand, a.model, a.status
       FROM contract_assets ca
       JOIN assets a ON a.id = ca.asset_id
       WHERE ca.contract_id = $1 AND ca.tenant_id = $2`,
      [contractId, tenantId],
    );
  }

  async countTransactions(contractId: string, tenantId: string): Promise<number> {
    const [row] = await this.dataSource.query(
      `SELECT COUNT(*) FROM contract_transactions WHERE contract_id = $1 AND tenant_id = $2`,
      [contractId, tenantId],
    );
    return parseInt(row.count, 10);
  }

  async update(_tenantId: string, _id: string, updates: string[], params: any[]): Promise<void> {
    await this.dataSource.query(
      `UPDATE pawn_contracts SET ${updates.join(', ')} WHERE tenant_id = $1 AND id = $2`,
      params,
    );
  }

  async updateStatus(tenantId: string, id: string, status: ContractStatus): Promise<void> {
    await this.dataSource.query(
      `UPDATE pawn_contracts SET status = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3`,
      [status, id, tenantId],
    );
  }

  async findUpcomingDue(tenantId: string, days: number, storeIds?: string[]): Promise<any[]> {
    const params: any[] = [tenantId];
    let query = `SELECT pc.*, c.full_name as customer_full_name, c.phone as customer_phone
      FROM pawn_contracts pc
      LEFT JOIN customers c ON c.id = pc.customer_id
      WHERE pc.tenant_id = $1
        AND pc.due_date BETWEEN NOW() AND NOW() + interval '${days} days'
        AND pc.status IN ('active','near_due','extended')`;
    if (storeIds && storeIds.length > 0) {
      params.push(storeIds);
      query += ` AND pc.store_id = ANY($2)`;
    }
    query += ` ORDER BY pc.due_date ASC`;
    return this.dataSource.query(query, params);
  }

  async findOverdue(tenantId: string, storeIds?: string[]): Promise<any[]> {
    const params: any[] = [tenantId];
    let query = `SELECT pc.*, c.full_name as customer_full_name, c.phone as customer_phone,
        NOW()::date - pc.due_date::date AS days_overdue
      FROM pawn_contracts pc
      LEFT JOIN customers c ON c.id = pc.customer_id
      WHERE pc.tenant_id = $1
        AND pc.due_date < NOW()
        AND pc.status IN ('active','near_due','extended','overdue')`;
    if (storeIds && storeIds.length > 0) {
      params.push(storeIds);
      query += ` AND pc.store_id = ANY($2)`;
    }
    query += ` ORDER BY pc.due_date ASC`;
    return this.dataSource.query(query, params);
  }

  async findOverdueContracts(tenantId?: string): Promise<{ id: string; tenant_id: string; status: string }[]> {
    const params: any[] = [];
    let where = `pc.due_date < NOW()::date AND pc.status IN ('active','near_due','extended')`;
    if (tenantId) {
      params.push(tenantId);
      where += ` AND pc.tenant_id = $1`;
    }
    return this.dataSource.query(
      `SELECT pc.id, pc.tenant_id, pc.status FROM pawn_contracts pc WHERE ${where}`,
      params,
    );
  }

  async findNearDueContracts(days = 7, tenantId?: string): Promise<{ id: string; tenant_id: string; status: string }[]> {
    const params: any[] = [days];
    let where = `pc.due_date BETWEEN NOW()::date AND NOW()::date + ($1::int * interval '1 day')
      AND pc.status IN ('active','extended')`;
    if (tenantId) {
      params.push(tenantId);
      where += ` AND pc.tenant_id = $2`;
    }
    return this.dataSource.query(
      `SELECT pc.id, pc.tenant_id, pc.status FROM pawn_contracts pc WHERE ${where}`,
      params,
    );
  }

  async batchUpdateStatus(ids: string[], newStatus: ContractStatus, changedBy: string): Promise<void> {
    if (!ids.length) return;
    await this.dataSource.transaction(async (manager) => {
      await manager.query(
        `UPDATE pawn_contracts SET status = $1, updated_at = NOW() WHERE id = ANY($2)`,
        [newStatus, ids],
      );
      const values = ids
        .map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3}, NOW())`)
        .join(', ');
      const params: any[] = ids.flatMap((id) => [id, newStatus, changedBy]);
      await manager.query(
        `INSERT INTO contract_status_history (contract_id, to_status, changed_by, created_at) VALUES ${values}`,
        params,
      );
    });
  }

  async transaction<T>(work: (manager: any) => Promise<T>): Promise<T> {
    return this.dataSource.transaction(work);
  }

  async findLatestExtension(tenantId: string, contractId: string): Promise<any | null> {
    const [row] = await this.dataSource.query(
      `SELECT * FROM contract_extensions WHERE tenant_id = $1 AND contract_id = $2 ORDER BY created_at DESC LIMIT 1`,
      [tenantId, contractId],
    );
    return row ?? null;
  }
}
