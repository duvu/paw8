import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';

@Injectable()
export class TransactionsRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findContractInStore(tenantId: string, storeId: string, contractId: string, manager: EntityManager): Promise<any | null> {
    const rows = await manager.query(
      `SELECT * FROM pawn_contracts WHERE id = $1 AND tenant_id = $2 AND store_id = $3`,
      [contractId, tenantId, storeId],
    );
    return rows[0] ?? null;
  }

  async insertTransaction(tenantId: string, storeId: string, data: {
    contractId: string;
    transactionType: string;
    amount: number;
    paymentMethod: string;
    transactionDate: string;
    note?: string | null;
    referenceTransactionId?: string | null;
    createdBy: string;
  }, manager: EntityManager): Promise<any> {
    const result = await manager.query(
      `INSERT INTO contract_transactions (
        tenant_id, store_id, contract_id, transaction_type, amount,
        payment_method, transaction_date, note, void_of_id, created_by, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())
      RETURNING *`,
      [
        tenantId, storeId, data.contractId, data.transactionType, data.amount,
        data.paymentMethod, data.transactionDate, data.note ?? null,
        data.referenceTransactionId ?? null, data.createdBy,
      ],
    );
    return result[0];
  }

  async updateContractStatus(tenantId: string, contractId: string, status: string, updatedBy: string, manager: EntityManager): Promise<void> {
    await manager.query(
      `UPDATE pawn_contracts SET status = $1, updated_at = NOW(), updated_by = $2 WHERE id = $3 AND tenant_id = $4`,
      [status, updatedBy, contractId, tenantId],
    );
  }

  async updateAssetStatus(tenantId: string, contractId: string, status: string, manager: EntityManager): Promise<void> {
    await manager.query(
      `UPDATE assets SET status = $1, updated_at = NOW()
       WHERE id IN (SELECT asset_id FROM contract_assets WHERE contract_id = $2)
       AND tenant_id = $3`,
      [status, contractId, tenantId],
    );
  }

  async insertStatusHistory(tenantId: string, contractId: string, toStatus: string, changedBy: string, manager: EntityManager): Promise<void> {
    await manager.query(
      `INSERT INTO contract_status_history (tenant_id, contract_id, to_status, changed_by, created_at)
       VALUES ($1,$2,$3,$4,NOW())`,
      [tenantId, contractId, toStatus, changedBy],
    );
  }

  async insertExtension(tenantId: string, data: {
    contractId: string;
    oldDueDate: string;
    newDueDate: string;
    interestPaid: number;
    feeAmount: number;
    createdBy: string;
  }, manager: EntityManager): Promise<void> {
    await manager.query(
      `INSERT INTO contract_extensions (
        tenant_id, contract_id, old_due_date, new_due_date,
        interest_paid_amount, fee_amount, created_by, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
      [tenantId, data.contractId, data.oldDueDate, data.newDueDate, data.interestPaid, data.feeAmount, data.createdBy],
    );
  }

  async updateContractDueDate(tenantId: string, contractId: string, newDueDate: string, updatedBy: string, manager: EntityManager): Promise<void> {
    await manager.query(
      `UPDATE pawn_contracts SET due_date = $1, status = 'extended', updated_at = NOW(), updated_by = $2
       WHERE id = $3 AND tenant_id = $4`,
      [newDueDate, updatedBy, contractId, tenantId],
    );
  }

  async findTransactionById(tenantId: string, id: string): Promise<any | null> {
    const rows = await this.dataSource.query(
      `SELECT * FROM contract_transactions WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId],
    );
    return rows[0] ?? null;
  }

  async insertVoidTransaction(tenantId: string, original: any, reason: string, createdBy: string): Promise<any> {
    const result = await this.dataSource.query(
      `INSERT INTO contract_transactions (
        tenant_id, store_id, contract_id, transaction_type, amount,
        payment_method, transaction_date, note, void_of_id, created_by, created_at
      ) VALUES ($1,$2,$3,'void',$4,$5,NOW(),$6,$7,$8,NOW())
      RETURNING *`,
      [tenantId, original.store_id, original.contract_id, -original.amount, original.payment_method, reason, original.id, createdBy],
    );
    return result[0];
  }

  async getByContract(tenantId: string, contractId: string): Promise<any[]> {
    return this.dataSource.query(
      `SELECT * FROM contract_transactions
       WHERE contract_id = $1 AND tenant_id = $2
       ORDER BY transaction_date DESC, created_at DESC`,
      [contractId, tenantId],
    );
  }

  async updateAssetInventory(tenantId: string, contractId: string, manager: EntityManager): Promise<void> {
    await manager.query(
      `UPDATE asset_inventory SET returned_at = NOW(), status = 'returned'
       WHERE asset_id IN (SELECT asset_id FROM contract_assets WHERE contract_id = $1 AND tenant_id = $2)
         AND tenant_id = $2`,
      [contractId, tenantId],
    );
  }

  async findContractByTenant(tenantId: string, contractId: string): Promise<any | null> {
    const rows = await this.dataSource.query(
      `SELECT * FROM pawn_contracts WHERE id = $1 AND tenant_id = $2`,
      [contractId, tenantId],
    );
    return rows[0] ?? null;
  }

  async sumPaidTransactions(tenantId: string, contractId: string): Promise<number> {
    const result = await this.dataSource.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_paid
       FROM contract_transactions
       WHERE contract_id = $1 AND tenant_id = $2
         AND transaction_type IN ('interest_collection','fee_collection')`,
      [contractId, tenantId],
    );
    return parseFloat(result[0].total_paid);
  }

  transaction<T>(fn: (manager: EntityManager) => Promise<T>): Promise<T> {
    return this.dataSource.transaction(fn);
  }
}
