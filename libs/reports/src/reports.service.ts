import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DashboardQueryDto, ReportQueryDto } from './dto/report.dto';

@Injectable()
export class ReportsService {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async getDashboard(
    tenantId: string,
    allowedStoreIds: string[],
    query: DashboardQueryDto,
  ) {
    const storeFilter = this.buildStoreFilter(query.storeId, allowedStoreIds);
    const storeParams: any[] = [];
    const storeCondition = this.buildStoreCondition(
      query.storeId,
      allowedStoreIds,
      storeParams,
    );

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const baseParams: any[] = [tenantId];
    let idx = 2;

    let storeClause = '';
    if (storeCondition) {
      storeClause = ` AND ${storeCondition}`;
      storeParams.forEach((p) => baseParams.push(p));
      idx += storeParams.length;
    }

    const [
      activeContracts,
      outstandingPrincipal,
      disbursedToday,
      disbursedMonth,
      collectedToday,
      collectedMonth,
      interestCollected,
      upcoming,
      overdue,
      assetsInCustody,
    ] = await Promise.all([
      this.dataSource.query(
        `SELECT COUNT(*) AS cnt FROM pawn_contracts
         WHERE tenant_id = $1 AND status = 'active'${storeClause}`,
        baseParams.slice(),
      ),
      this.dataSource.query(
        `SELECT COALESCE(SUM(principal_amount), 0) AS total FROM pawn_contracts
         WHERE tenant_id = $1 AND status = 'active'${storeClause}`,
        baseParams.slice(),
      ),
      this.dataSource.query(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM contract_transactions
         WHERE tenant_id = $1 AND transaction_type = 'disbursement'
           AND transaction_date >= $${idx}${storeClause}`,
        [...baseParams.slice(), startOfDay],
      ),
      this.dataSource.query(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM contract_transactions
         WHERE tenant_id = $1 AND transaction_type = 'disbursement'
           AND transaction_date >= $${idx}${storeClause}`,
        [...baseParams.slice(), startOfMonth],
      ),
      this.dataSource.query(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM contract_transactions
         WHERE tenant_id = $1 AND transaction_type IN ('interest_collection','fee_collection','settlement')
           AND transaction_date >= $${idx}${storeClause}`,
        [...baseParams.slice(), startOfDay],
      ),
      this.dataSource.query(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM contract_transactions
         WHERE tenant_id = $1 AND transaction_type IN ('interest_collection','fee_collection','settlement')
           AND transaction_date >= $${idx}${storeClause}`,
        [...baseParams.slice(), startOfMonth],
      ),
      this.dataSource.query(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM contract_transactions
         WHERE tenant_id = $1 AND transaction_type = 'interest_collection'${storeClause}`,
        baseParams.slice(),
      ),
      this.dataSource.query(
        `SELECT COUNT(*) AS cnt FROM pawn_contracts
         WHERE tenant_id = $1 AND status = 'active' AND due_date BETWEEN $${idx} AND $${idx + 1}${storeClause}`,
        [...baseParams.slice(), today, sevenDaysLater],
      ),
      this.dataSource.query(
        `SELECT COUNT(*) AS cnt FROM pawn_contracts
         WHERE tenant_id = $1 AND status IN ('overdue')${storeClause}`,
        baseParams.slice(),
      ),
      this.dataSource.query(
        `SELECT COUNT(*) AS cnt FROM assets
         WHERE tenant_id = $1 AND status = 'pawned'${storeClause}`,
        baseParams.slice(),
      ),
    ]);

    return {
      activeContracts: parseInt(activeContracts[0]?.cnt ?? '0', 10),
      totalOutstandingPrincipal: parseFloat(outstandingPrincipal[0]?.total ?? '0'),
      disbursedToday: parseFloat(disbursedToday[0]?.total ?? '0'),
      disbursedThisMonth: parseFloat(disbursedMonth[0]?.total ?? '0'),
      collectedToday: parseFloat(collectedToday[0]?.total ?? '0'),
      collectedThisMonth: parseFloat(collectedMonth[0]?.total ?? '0'),
      interestCollected: parseFloat(interestCollected[0]?.total ?? '0'),
      upcomingDueCount: parseInt(upcoming[0]?.cnt ?? '0', 10),
      overdueCount: parseInt(overdue[0]?.cnt ?? '0', 10),
      assetsInCustody: parseInt(assetsInCustody[0]?.cnt ?? '0', 10),
    };
  }

  async getContractReport(
    tenantId: string,
    allowedStoreIds: string[],
    query: ReportQueryDto,
  ) {
    const params: any[] = [tenantId];
    const conditions: string[] = ['pc.tenant_id = $1'];
    this.applyStoreFilter(conditions, params, query.storeId, allowedStoreIds);
    if (query.status) {
      params.push(query.status);
      conditions.push(`pc.status = $${params.length}`);
    }
    if (query.staffId) {
      params.push(query.staffId);
      conditions.push(`pc.created_by = $${params.length}`);
    }
    if (query.dateFrom) {
      params.push(query.dateFrom);
      conditions.push(`pc.start_date >= $${params.length}`);
    }
    if (query.dateTo) {
      params.push(query.dateTo);
      conditions.push(`pc.start_date <= $${params.length}`);
    }

    const where = conditions.join(' AND ');
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    params.push(limit, offset);
    const limitIdx = params.length - 1;
    const offsetIdx = params.length;

    const [data, count] = await Promise.all([
      this.dataSource.query(
        `SELECT pc.*, c.full_name AS customer_name, s.name AS store_name
         FROM pawn_contracts pc
         LEFT JOIN customers c ON c.id = pc.customer_id
         LEFT JOIN stores s ON s.id = pc.store_id
         WHERE ${where}
         ORDER BY pc.created_at DESC
         LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
        params,
      ),
      this.dataSource.query(
        `SELECT COUNT(*) AS total FROM pawn_contracts pc WHERE ${where}`,
        params.slice(0, params.length - 2),
      ),
    ]);

    return { data, total: parseInt(count[0]?.total ?? '0', 10), page, limit };
  }

  async getCollectionReport(
    tenantId: string,
    allowedStoreIds: string[],
    query: ReportQueryDto,
  ) {
    const params: any[] = [tenantId];
    const conditions: string[] = [
      "ct.tenant_id = $1",
      "ct.transaction_type IN ('interest_collection','fee_collection','settlement')",
    ];
    this.applyStoreFilter(conditions, params, query.storeId, allowedStoreIds);
    if (query.dateFrom) {
      params.push(query.dateFrom);
      conditions.push(`ct.transaction_date >= $${params.length}`);
    }
    if (query.dateTo) {
      params.push(query.dateTo);
      conditions.push(`ct.transaction_date <= $${params.length}`);
    }
    if (query.staffId) {
      params.push(query.staffId);
      conditions.push(`ct.created_by = $${params.length}`);
    }

    const where = conditions.join(' AND ');
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;
    params.push(limit, offset);
    const limitIdx = params.length - 1;
    const offsetIdx = params.length;

    const [data, count] = await Promise.all([
      this.dataSource.query(
        `SELECT ct.* FROM contract_transactions ct WHERE ${where}
         ORDER BY ct.transaction_date DESC
         LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
        params,
      ),
      this.dataSource.query(
        `SELECT COUNT(*) AS total FROM contract_transactions ct WHERE ${where}`,
        params.slice(0, params.length - 2),
      ),
    ]);

    return { data, total: parseInt(count[0]?.total ?? '0', 10), page, limit };
  }

  async getOutstandingReport(
    tenantId: string,
    allowedStoreIds: string[],
    query: ReportQueryDto,
  ) {
    const params: any[] = [tenantId];
    const conditions: string[] = ["pc.tenant_id = $1", "pc.status = 'active'"];
    this.applyStoreFilter(conditions, params, query.storeId, allowedStoreIds);

    const where = conditions.join(' AND ');
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;
    params.push(limit, offset);
    const limitIdx = params.length - 1;
    const offsetIdx = params.length;

    const [data, count] = await Promise.all([
      this.dataSource.query(
        `SELECT pc.*, c.full_name AS customer_name,
                EXTRACT(DAY FROM NOW() - pc.start_date) AS days_elapsed
         FROM pawn_contracts pc
         LEFT JOIN customers c ON c.id = pc.customer_id
         WHERE ${where}
         ORDER BY pc.due_date ASC
         LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
        params,
      ),
      this.dataSource.query(
        `SELECT COUNT(*) AS total FROM pawn_contracts pc WHERE ${where}`,
        params.slice(0, params.length - 2),
      ),
    ]);

    return { data, total: parseInt(count[0]?.total ?? '0', 10), page, limit };
  }

  async getOverdueReport(
    tenantId: string,
    allowedStoreIds: string[],
    query: ReportQueryDto,
  ) {
    const params: any[] = [tenantId];
    const conditions: string[] = ["pc.tenant_id = $1", "pc.status = 'overdue'"];
    this.applyStoreFilter(conditions, params, query.storeId, allowedStoreIds);

    const where = conditions.join(' AND ');
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;
    params.push(limit, offset);
    const limitIdx = params.length - 1;
    const offsetIdx = params.length;

    const [data, count] = await Promise.all([
      this.dataSource.query(
        `SELECT pc.*, c.full_name AS customer_name,
                EXTRACT(DAY FROM NOW() - pc.due_date) AS days_overdue
         FROM pawn_contracts pc
         LEFT JOIN customers c ON c.id = pc.customer_id
         WHERE ${where}
         ORDER BY pc.due_date ASC
         LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
        params,
      ),
      this.dataSource.query(
        `SELECT COUNT(*) AS total FROM pawn_contracts pc WHERE ${where}`,
        params.slice(0, params.length - 2),
      ),
    ]);

    return { data, total: parseInt(count[0]?.total ?? '0', 10), page, limit };
  }

  async getStoreReport(tenantId: string, query: ReportQueryDto) {
    const params: any[] = [tenantId];
    const conditions: string[] = ['pc.tenant_id = $1'];
    if (query.dateFrom) {
      params.push(query.dateFrom);
      conditions.push(`pc.start_date >= $${params.length}`);
    }
    if (query.dateTo) {
      params.push(query.dateTo);
      conditions.push(`pc.start_date <= $${params.length}`);
    }

    const where = conditions.join(' AND ');

    const data = await this.dataSource.query(
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

    return { data };
  }

  async getStaffReport(
    tenantId: string,
    allowedStoreIds: string[],
    query: ReportQueryDto,
  ) {
    const params: any[] = [tenantId];
    const conditions: string[] = ['pc.tenant_id = $1'];
    this.applyStoreFilter(conditions, params, query.storeId, allowedStoreIds);
    if (query.dateFrom) {
      params.push(query.dateFrom);
      conditions.push(`pc.start_date >= $${params.length}`);
    }
    if (query.dateTo) {
      params.push(query.dateTo);
      conditions.push(`pc.start_date <= $${params.length}`);
    }

    const where = conditions.join(' AND ');

    const data = await this.dataSource.query(
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

    return { data };
  }

  async getAssetInventoryReport(
    tenantId: string,
    allowedStoreIds: string[],
    query: ReportQueryDto,
  ) {
    const params: any[] = [tenantId];
    const conditions: string[] = ["a.tenant_id = $1", "a.status = 'pawned'"];
    this.applyStoreFilter(conditions, params, query.storeId, allowedStoreIds);
    if (query.assetType) {
      params.push(query.assetType);
      conditions.push(`a.asset_type = $${params.length}`);
    }

    const where = conditions.join(' AND ');
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;
    params.push(limit, offset);
    const limitIdx = params.length - 1;
    const offsetIdx = params.length;

    const [data, count] = await Promise.all([
      this.dataSource.query(
        `SELECT a.*, s.name AS store_name
         FROM assets a
         LEFT JOIN stores s ON s.id = a.store_id
         WHERE ${where}
         ORDER BY a.created_at DESC
         LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
        params,
      ),
      this.dataSource.query(
        `SELECT COUNT(*) AS total FROM assets a WHERE ${where}`,
        params.slice(0, params.length - 2),
      ),
    ]);

    return { data, total: parseInt(count[0]?.total ?? '0', 10), page, limit };
  }

  private applyStoreFilter(
    conditions: string[],
    params: any[],
    storeId: string | undefined,
    allowedStoreIds: string[],
  ): void {
    if (storeId) {
      params.push(storeId);
      conditions.push(`(pc.store_id = $${params.length} OR a.store_id = $${params.length} OR s.id = $${params.length} OR ct.store_id = $${params.length})`);
    } else if (allowedStoreIds && allowedStoreIds.length > 0) {
      params.push(allowedStoreIds);
      conditions.push(`(pc.store_id = ANY($${params.length}) OR a.store_id = ANY($${params.length}) OR ct.store_id = ANY($${params.length}))`);
    }
  }

  private buildStoreCondition(
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

  private buildStoreFilter(
    storeId: string | undefined,
    allowedStoreIds: string[],
  ): string {
    return storeId ? `store_id = '${storeId}'` : '';
  }
}
