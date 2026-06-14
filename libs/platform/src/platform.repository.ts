import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class PlatformRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async getStats(): Promise<{
    tenants: { total: number; active: number; suspended: number; trial: number };
    stores: { total: number };
    contracts: { active: number; totalPrincipal: number };
    expiringSoon: { count: number; tenants: { id: string; name: string; trialEndDate: string }[] };
  }> {
    const [tenantStats, storeStats, contractStats, expiringSoon] = await Promise.all([
      this.dataSource.query<{ total: string; active: string; suspended: string; trial: string }[]>(
        `SELECT
           COUNT(*) AS total,
           COUNT(*) FILTER (WHERE status = 'active') AS active,
           COUNT(*) FILTER (WHERE status = 'suspended') AS suspended,
           COUNT(*) FILTER (WHERE status = 'trial') AS trial
         FROM tenants`,
      ),
      this.dataSource.query<{ total: string }[]>(
        `SELECT COUNT(*) AS total FROM stores WHERE status != 'inactive'`,
      ),
      this.dataSource.query<{ active: string; total_principal: string }[]>(
        `SELECT
           COUNT(*) FILTER (WHERE status = 'active') AS active,
           COALESCE(SUM(principal_amount) FILTER (WHERE status = 'active'), 0) AS total_principal
         FROM pawn_contracts`,
      ),
      this.dataSource.query<{ id: string; name: string; trial_end_date: string }[]>(
        `SELECT id, name, trial_end_date
         FROM tenants
         WHERE status = 'trial'
           AND trial_end_date IS NOT NULL
           AND trial_end_date <= NOW() + INTERVAL '7 days'
         ORDER BY trial_end_date ASC
         LIMIT 20`,
      ),
    ]);

    const t = tenantStats[0];
    const s = storeStats[0];
    const c = contractStats[0];

    return {
      tenants: {
        total: parseInt(t.total, 10),
        active: parseInt(t.active, 10),
        suspended: parseInt(t.suspended, 10),
        trial: parseInt(t.trial, 10),
      },
      stores: { total: parseInt(s.total, 10) },
      contracts: {
        active: parseInt(c.active, 10),
        totalPrincipal: parseFloat(c.total_principal),
      },
      expiringSoon: {
        count: expiringSoon.length,
        tenants: expiringSoon.map(r => ({
          id: r.id,
          name: r.name,
          trialEndDate: r.trial_end_date,
        })),
      },
    };
  }

  async getRecentActivity(limit = 10): Promise<{
    id: string;
    userId: string | null;
    action: string;
    entityType: string | null;
    entityId: string | null;
    createdAt: string;
  }[]> {
    const rows = await this.dataSource.query(
      `SELECT id, user_id AS "userId", action, entity_type AS "entityType",
              entity_id AS "entityId", created_at AS "createdAt"
       FROM audit_logs
       WHERE tenant_id IS NULL
          OR action IN ('LOGIN', 'LOGOUT', 'trial_expired', 'tenant_created', 'tenant_suspended')
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit],
    );
    return rows;
  }
}
