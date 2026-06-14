import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TenantsRepository } from '../../tenants/src/tenants.repository';
import { TenantStatus } from '../../tenants/src/dto/tenant.dto';
import { AuditService } from '../../audit/src/audit.service';

/**
 * Runs daily at 02:00 UTC.
 * Suspends any tenant whose trial has expired (trial_end_date + grace_period_days < now).
 * Records audit log entry with user_id='system'.
 */
@Injectable()
export class TrialExpiryService {
  private readonly logger = new Logger(TrialExpiryService.name);

  constructor(
    private readonly tenantsRepository: TenantsRepository,
    private readonly auditService: AuditService,
  ) {}

  @Cron('0 2 * * *') // 02:00 UTC daily
  async handleTrialExpiry(): Promise<void> {
    this.logger.log('Running trial expiry check...');

    const expired = await this.tenantsRepository.findExpiredTrials(Date.now());

    if (expired.length === 0) {
      this.logger.log('No expired trials found.');
      return;
    }

    for (const { id } of expired) {
      try {
        await this.tenantsRepository.setStatus(id, TenantStatus.EXPIRED);

        await this.auditService.log({
          tenantId: id,
          userId: 'system',
          action: 'trial_expired',
          entityType: 'tenant',
          entityId: id,
          newValue: { status: TenantStatus.EXPIRED },
        });

        this.logger.log(`Expired tenant ${id} due to trial expiry.`);
      } catch (err: unknown) {
        const e = err as Error;
        this.logger.error(`Failed to expire tenant ${id}: ${e?.message}`, e?.stack);
      }
    }

    this.logger.log(`Trial expiry check complete. Expired ${expired.length} tenant(s).`);
  }
}
