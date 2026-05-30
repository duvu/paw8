import { Injectable, Logger } from '@nestjs/common';
import { AuditQueryDto, AuditLogResponseDto } from './dto/audit.dto';
import { AuditRepository } from './audit.repository';

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

  constructor(private readonly auditRepository: AuditRepository) {}

  async log(params: AuditLogParams): Promise<void> {
    try {
      await this.auditRepository.insert(params);
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

    const page = dto.page ?? 1;
    const limit = dto.limit ?? 50;
    const offset = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      this.auditRepository.search(conditions, params, limit, offset),
      this.auditRepository.count(conditions, params),
    ]);

    return {
      data: rows.map((row: any) => this.auditRepository.mapToDto(row)),
      total,
      page,
      limit,
    };
  }
}
