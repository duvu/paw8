import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AuditQueryDto, AuditLogResponseDto } from './dto/audit.dto';

export interface AuditLogParams {
  tenantId?: string;
  storeId?: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async log(params: AuditLogParams): Promise<void> {
    try {
      const id = crypto.randomUUID();
      await this.dataSource.query(
        `INSERT INTO audit_logs
          (id, tenant_id, store_id, user_id, action, entity_type, entity_id,
           old_value, new_value, ip_address, user_agent, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
        [
          id,
          params.tenantId ?? null,
          params.storeId ?? null,
          params.userId ?? null,
          params.action,
          params.entityType,
          params.entityId ?? null,
          params.oldValue ? JSON.stringify(params.oldValue) : null,
          params.newValue ? JSON.stringify(params.newValue) : null,
          params.ipAddress ?? null,
          params.userAgent ?? null,
        ],
      );
    } catch (err) {
      // Never throw from audit log — log to stderr only
      this.logger.error(`Failed to write audit log: ${err?.message}`, err?.stack);
    }
  }

  async query(
    tenantId: string,
    dto: AuditQueryDto,
  ): Promise<{ data: AuditLogResponseDto[]; total: number; page: number; limit: number }> {
    const params: any[] = [tenantId];
    const conditions: string[] = ['tenant_id = $1'];

    if (dto.storeId) {
      params.push(dto.storeId);
      conditions.push(`store_id = $${params.length}`);
    }
    if (dto.userId) {
      params.push(dto.userId);
      conditions.push(`user_id = $${params.length}`);
    }
    if (dto.action) {
      params.push(dto.action);
      conditions.push(`action = $${params.length}`);
    }
    if (dto.entityType) {
      params.push(dto.entityType);
      conditions.push(`entity_type = $${params.length}`);
    }
    if (dto.entityId) {
      params.push(dto.entityId);
      conditions.push(`entity_id = $${params.length}`);
    }
    if (dto.dateFrom) {
      params.push(dto.dateFrom);
      conditions.push(`created_at >= $${params.length}`);
    }
    if (dto.dateTo) {
      params.push(dto.dateTo);
      conditions.push(`created_at <= $${params.length}`);
    }

    const where = conditions.join(' AND ');
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 50;
    const offset = (page - 1) * limit;

    params.push(limit, offset);
    const limitIdx = params.length - 1;
    const offsetIdx = params.length;

    const [rows, countRows] = await Promise.all([
      this.dataSource.query(
        `SELECT * FROM audit_logs WHERE ${where}
         ORDER BY created_at DESC
         LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
        params,
      ),
      this.dataSource.query(
        `SELECT COUNT(*) AS total FROM audit_logs WHERE ${where}`,
        params.slice(0, params.length - 2),
      ),
    ]);

    const data: AuditLogResponseDto[] = (rows || []).map((row: any) => ({
      id: row.id,
      tenantId: row.tenant_id,
      storeId: row.store_id,
      userId: row.user_id,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      oldValue: row.old_value ? JSON.parse(row.old_value) : null,
      newValue: row.new_value ? JSON.parse(row.new_value) : null,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      createdAt: row.created_at,
    }));

    return {
      data,
      total: parseInt(countRows[0]?.total ?? '0', 10),
      page,
      limit,
    };
  }
}
