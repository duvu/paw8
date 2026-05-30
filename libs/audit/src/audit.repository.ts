import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AuditLogParams } from './audit.service';
import { AuditLogResponseDto } from './dto/audit.dto';

@Injectable()
export class AuditRepository {
  private readonly logger = new Logger(AuditRepository.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async insert(params: AuditLogParams): Promise<void> {
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
  }

  async search(conditions: string[], params: any[], limit: number, offset: number): Promise<any[]> {
    const where = conditions.join(' AND ');
    return this.dataSource.query(
      `SELECT * FROM audit_logs WHERE ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    );
  }

  async count(conditions: string[], params: any[]): Promise<number> {
    const where = conditions.join(' AND ');
    const result = await this.dataSource.query(
      `SELECT COUNT(*) AS total FROM audit_logs WHERE ${where}`,
      params,
    );
    return parseInt(result[0]?.total ?? '0', 10);
  }

  mapToDto(row: any): AuditLogResponseDto {
    return {
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
    };
  }
}
