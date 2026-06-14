import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { ContractsRepository } from './contracts.repository';
import { ContractStatus } from './dto/contract.dto';

@Injectable()
export class ContractSchedulerService {
  private readonly logger = new Logger(ContractSchedulerService.name);

  constructor(
    private readonly contractsRepository: ContractsRepository,
    private readonly configService: ConfigService,
  ) {}

  @Cron('0 1 * * *')
  async runDailyCheck(): Promise<void> {
    if (this.configService.get<string>('SCHEDULER_ENABLED') === 'false') return;
    await Promise.all([this.markOverdue(), this.markNearDue()]);
  }

  async markOverdue(): Promise<{ updated: number }> {
    const nearDueDays = parseInt(this.configService.get<string>('NEAR_DUE_DAYS', '7'), 10);
    const contracts = await this.contractsRepository.findOverdueContracts();
    const ids = contracts
      .filter((c) => !['overdue'].includes(c.status))
      .map((c) => c.id);
    if (ids.length > 0) {
      await this.contractsRepository.batchUpdateStatus(ids, ContractStatus.OVERDUE, 'system-scheduler');
      this.logger.log(`Marked ${ids.length} contracts as overdue`);
    }
    void nearDueDays;
    return { updated: ids.length };
  }

  async markNearDue(): Promise<{ updated: number }> {
    const nearDueDays = parseInt(this.configService.get<string>('NEAR_DUE_DAYS', '7'), 10);
    const contracts = await this.contractsRepository.findNearDueContracts(nearDueDays);
    const ids = contracts.map((c) => c.id);
    if (ids.length > 0) {
      await this.contractsRepository.batchUpdateStatus(ids, ContractStatus.NEAR_DUE, 'system-scheduler');
      this.logger.log(`Marked ${ids.length} contracts as near_due`);
    }
    return { updated: ids.length };
  }
}
