import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class ReportsRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  // ── Store filter helpers ────────────────────────────────────────────────────

  buildStoreCondition(
    storeId: string | undefined,
    allowedStoreIds: string[],
    outParams: any[],
  ): string {
    if (storeId) {
      outParams.push(storeId);
      return `store_id = $${outParams.length + 1}`; // +1 because tenantId is $1
    } else if (allowedStoreIds && allowedStoreIds.length > 0) {
      outParams.push(allowedStoreIds);
      return `store_id = ANY($${outParams.length + 1})`;
    }
    return '';
  }

  applyStoreFilter(
    conditions: string[],
    params: any[],
    storeId: string | undefined,
    allowedStoreIds: string[],
  ): void {
    if (storeId) {
      params.push(storeId);
      conditions.push(
        `(pc.store_id = $${params.length} OR a.store_id = $${params.length} OR s.id = $${params.length} OR ct.store_id = $${params.length})`,
      );
    } else if (allowedStoreIds && allowedStoreIds.length > 0) {
      params.push(allowedStoreIds);
      conditions.push(
        `(pc.store_id = ANY($${params.length}) OR a.store_id = ANY($${params.length}) OR ct.store_id = ANY($${params.length}))`,
      );
    }
  }

  // ── Dashboard ───────────────────────────────────────────────────────────────

  async getDashboardStats(
    baseParams: any[],
    storeClause: string,
    startOfDay: Date,
    startOfMonth: Date,
    today: Date,
    sevenDaysLater: Date,
    idx: number,
  ) {
    return Promise.all([
      this.dataSource.query(
        `SELECT COUNT(*) AS cnt FROM pawn_contracts WHERE tenant_id = $1 AND status = 'active'${storeClause}`,
        baseParams.slice(),
      ),
      this.dataSource.query(
        `SELECT COALESCE(SUM(principal_amount), 0) AS total FROM pawn_contracts WHERE tenant_id = $1 AND status = 'active'${storeClause}`,
        baseParams.slice(),
      ),
      this.dataSource.query(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM contract_transactions WHERE tenant_id = $1 AND transaction_type = 'disbursement' AND transaction_date >= $${idx}${storeClause}`,
        [...baseParams.slice(), startOfDay],
      ),
      this.dataSource.query(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM contract_transactions WHERE tenant_id = $1 AND transaction_type = 'disbursement' AND transaction_date >= $${idx}${storeClause}`,
        [...baseParams.slice(), startOfMonth],
      ),
      this.dataSource.query(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM contract_transactions WHERE tenant_id = $1 AND transaction_type IN ('interest_collection','fee_collection','settlement') AND transaction_date >= $${idx}${storeClause}`,
        [...baseParams.slice(), startOfDay],
      ),
      this.dataSource.query(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM contract_transactions WHERE tenant_id = $1 AND transaction_type IN ('interest_collection','fee_collection','settlement') AND transaction_date >= $${idx}${storeClause}`,
        [...baseParams.slice(), startOfMonth],
      ),
      this.dataSource.query(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM contract_transactions WHERE tenant_id = $1 AND transaction_type = 'interest_collection'${storeClause}`,
        baseParams.slice(),
      ),
      this.dataSource.query(
        `SELECT COUNT(*) AS cnt FROM pawn_contracts WHERE tenant_id = $1 AND status = 'active' AND due_date BETWEEN $${idx} AND $${idx + 1}${storeClause}`,
        [...baseParams.slice(), today, sevenDaysLater],
      ),
      this.dataSource.query(
        `SELECT COUNT(*) AS cnt FROM pawn_contracts WHERE tenant_id = $1 AND status IN ('overdue')${storeClause}`,
        baseParams.slice(),
      ),
      this.dataSource.query(
        `SELECT COUNT(*) AS cnt FROM assets WHERE tenant_id = $1 AND status = 'pawned'${storeClause}`,
        baseParams.slice(),
      ),
    ]);
  }

  // ── Contract report ─────────────────────────────────────────────────────────

  async findContractReport(where: string, params: any[], limit: number, offset: number) {
    return Promise.all([
      this.dataSource.query(
        `SELECT pc.*, c.full_name AS customer_name, s.name AS store_name
         FROM pawn_contracts pc
         LEFT JOIN customers c ON c.id = pc.customer_id
         LEFT JOIN stores s ON s.id = pc.store_id
         WHERE ${where}
         ORDER BY pc.created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset],
      ),
      this.dataSource.query(
        `SELECT COUNT(*) AS total FROM pawn_contracts pc WHERE ${where}`,
        params,
      ),
    ]);
  }

  // ── Collection report ───────────────────────────────────────────────────────

  async findCollectionReport(where: string, params: any[], limit: number, offset: number) {
    return Promise.all([
      this.dataSource.query(
        `SELECT ct.* FROM contract_transactions ct WHERE ${where}
         ORDER BY ct.transaction_date DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset],
      ),
      this.dataSource.query(
        `SELECT COUNT(*) AS total FROM contract_transactions ct WHERE ${where}`,
        params,
      ),
    ]);
  }

  // ── Outstanding report ──────────────────────────────────────────────────────

  async findOutstandingReport(where: string, params: any[], limit: number, offset: number) {
    return Promise.all([
      this.dataSource.query(
        `SELECT pc.*, c.full_name AS customer_name,
                EXTRACT(DAY FROM NOW() - pc.start_date) AS days_elapsed
         FROM pawn_contracts pc
         LEFT JOIN customers c ON c.id = pc.customer_id
         WHERE ${where}
         ORDER BY pc.due_date ASC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset],
      ),
      this.dataSource.query(
        `SELECT COUNT(*) AS total FROM pawn_contracts pc WHERE ${where}`,
        params,
      ),
    ]);
  }

  // ── Overdue report ──────────────────────────────────────────────────────────

  async findOverdueReport(where: string, params: any[], limit: number, offset: number) {
    return Promise.all([
      this.dataSource.query(
        `SELECT pc.*, c.full_name AS customer_name,
                EXTRACT(DAY FROM NOW() - pc.due_date) AS days_overdue
         FROM pawn_contracts pc
         LEFT JOIN customers c ON c.id = pc.customer_id
         WHERE ${where}
         ORDER BY pc.due_date ASC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset],
      ),
      this.dataSource.query(
        `SELECT COUNT(*) AS total FROM pawn_contracts pc WHERE ${where}`,
        params,
      ),
    ]);
  }

  // ── Store report ────────────────────────────────────────────────────────────

  async findStoreReport(tenantId: string, where: string, params: any[]) {
    return this.dataSource.query(
      `SELECT s.id AS store_id, s.name AS store_name,
              COUNT(pc.id) AS contract_count,
              COALESCE(SUM(pc.principal_amount), 0) AS total_principal,
              COALESCE(SUM(CASE WHEN pc.status = 'active' THEN pc.principal_amount ELSE 0 END), 0) AS active_principal
       FROM stores s
       LEFT JOIN pawn_contracts pc ON pc.store_id = s.id AND ${where}
       WHERE s.tenant_id = $1
       GROUP BY s.id, s.name
       ORDER BY s.name`,
      params,
    );
  }

  // ── Staff report ────────────────────────────────────────────────────────────

  async findStaffReport(tenantId: string, where: string, params: any[]) {
    return this.dataSource.query(
      `SELECT u.id AS user_id, u.full_name AS staff_name,
              COUNT(pc.id) AS contract_count,
              COALESCE(SUM(pc.principal_amount), 0) AS total_principal
       FROM users u
       LEFT JOIN pawn_contracts pc ON pc.created_by = u.id AND ${where}
       WHERE u.tenant_id = $1
       GROUP BY u.id, u.full_name
       ORDER BY u.full_name`,
      params,
    );
  }

  // ── Asset inventory report ──────────────────────────────────────────────────

  async findAssetInventoryReport(where: string, params: any[], limit: number, offset: number) {
    return Promise.all([
      this.dataSource.query(
        `SELECT a.*, s.name AS store_name
         FROM assets a
         LEFT JOIN stores s ON s.id = a.store_id
         WHERE ${where}
         ORDER BY a.created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset],
      ),
      this.dataSource.query(
        `SELECT COUNT(*) AS total FROM assets a WHERE ${where}`,
        params,
      ),
    ]);
  }
}
