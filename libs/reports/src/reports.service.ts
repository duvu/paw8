import { Injectable } from '@nestjs/common';
import { ReportsRepository } from './reports.repository';
import { DashboardQueryDto, ReportQueryDto } from './dto/report.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly reportsRepository: ReportsRepository) {}

  async getDashboard(
    tenantId: string,
    allowedStoreIds: string[],
    query: DashboardQueryDto,
  ) {
    const storeParams: any[] = [];
    const storeCondition = this.reportsRepository.buildStoreCondition(
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
    ] = await this.reportsRepository.getDashboardStats(
      baseParams,
      storeClause,
      startOfDay,
      startOfMonth,
      today,
      sevenDaysLater,
      idx,
    );

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
    this.reportsRepository.applyStoreFilter(conditions, params, query.storeId, allowedStoreIds);
    if (query.status) { params.push(query.status); conditions.push(`pc.status = $${params.length}`); }
    if (query.staffId) { params.push(query.staffId); conditions.push(`pc.created_by = $${params.length}`); }
    if (query.dateFrom) { params.push(query.dateFrom); conditions.push(`pc.start_date >= $${params.length}`); }
    if (query.dateTo) { params.push(query.dateTo); conditions.push(`pc.start_date <= $${params.length}`); }

    const where = conditions.join(' AND ');
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const [data, count] = await this.reportsRepository.findContractReport(where, params, limit, offset);
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
    this.reportsRepository.applyStoreFilter(conditions, params, query.storeId, allowedStoreIds);
    if (query.dateFrom) { params.push(query.dateFrom); conditions.push(`ct.transaction_date >= $${params.length}`); }
    if (query.dateTo) { params.push(query.dateTo); conditions.push(`ct.transaction_date <= $${params.length}`); }
    if (query.staffId) { params.push(query.staffId); conditions.push(`ct.created_by = $${params.length}`); }

    const where = conditions.join(' AND ');
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const [data, count] = await this.reportsRepository.findCollectionReport(where, params, limit, offset);
    return { data, total: parseInt(count[0]?.total ?? '0', 10), page, limit };
  }

  async getOutstandingReport(
    tenantId: string,
    allowedStoreIds: string[],
    query: ReportQueryDto,
  ) {
    const params: any[] = [tenantId];
    const conditions: string[] = ["pc.tenant_id = $1", "pc.status = 'active'"];
    this.reportsRepository.applyStoreFilter(conditions, params, query.storeId, allowedStoreIds);

    const where = conditions.join(' AND ');
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const [data, count] = await this.reportsRepository.findOutstandingReport(where, params, limit, offset);
    return { data, total: parseInt(count[0]?.total ?? '0', 10), page, limit };
  }

  async getOverdueReport(
    tenantId: string,
    allowedStoreIds: string[],
    query: ReportQueryDto,
  ) {
    const params: any[] = [tenantId];
    const conditions: string[] = ["pc.tenant_id = $1", "pc.status = 'overdue'"];
    this.reportsRepository.applyStoreFilter(conditions, params, query.storeId, allowedStoreIds);

    const where = conditions.join(' AND ');
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const [data, count] = await this.reportsRepository.findOverdueReport(where, params, limit, offset);
    return { data, total: parseInt(count[0]?.total ?? '0', 10), page, limit };
  }

  async getStoreReport(tenantId: string, query: ReportQueryDto) {
    const params: any[] = [tenantId];
    const conditions: string[] = ['pc.tenant_id = $1'];
    if (query.dateFrom) { params.push(query.dateFrom); conditions.push(`pc.start_date >= $${params.length}`); }
    if (query.dateTo) { params.push(query.dateTo); conditions.push(`pc.start_date <= $${params.length}`); }

    const where = conditions.join(' AND ');
    const data = await this.reportsRepository.findStoreReport(tenantId, where, params);
    return { data };
  }

  async getStaffReport(
    tenantId: string,
    allowedStoreIds: string[],
    query: ReportQueryDto,
  ) {
    const params: any[] = [tenantId];
    const conditions: string[] = ['pc.tenant_id = $1'];
    this.reportsRepository.applyStoreFilter(conditions, params, query.storeId, allowedStoreIds);
    if (query.dateFrom) { params.push(query.dateFrom); conditions.push(`pc.start_date >= $${params.length}`); }
    if (query.dateTo) { params.push(query.dateTo); conditions.push(`pc.start_date <= $${params.length}`); }

    const where = conditions.join(' AND ');
    const data = await this.reportsRepository.findStaffReport(tenantId, where, params);
    return { data };
  }

  async getAssetInventoryReport(
    tenantId: string,
    allowedStoreIds: string[],
    query: ReportQueryDto,
  ) {
    const params: any[] = [tenantId];
    const conditions: string[] = ["a.tenant_id = $1", "a.status = 'holding'"];
    this.reportsRepository.applyStoreFilter(conditions, params, query.storeId, allowedStoreIds);
    if (query.assetType) { params.push(query.assetType); conditions.push(`a.asset_type = $${params.length}`); }

    const where = conditions.join(' AND ');
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const [data, count] = await this.reportsRepository.findAssetInventoryReport(where, params, limit, offset);
    return { data, total: parseInt(count[0]?.total ?? '0', 10), page, limit };
  }
}
