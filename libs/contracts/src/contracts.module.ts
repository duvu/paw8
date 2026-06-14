import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractsService } from './contracts.service';
import { ContractsController } from './contracts.controller';
import { ContractsRepository } from './contracts.repository';
import { InterestPoliciesService } from './interest-policies.service';
import { InterestPoliciesController } from './interest-policies.controller';
import { InterestPoliciesRepository } from './interest-policies.repository';
import { ContractSchedulerService } from './contract-scheduler.service';

@Module({
  imports: [TypeOrmModule.forFeature([])],
  providers: [
    ContractsService,
    ContractsRepository,
    InterestPoliciesService,
    InterestPoliciesRepository,
    ContractSchedulerService,
  ],
  controllers: [ContractsController, InterestPoliciesController],
  exports: [ContractsService, ContractsRepository, InterestPoliciesService, InterestPoliciesRepository, ContractSchedulerService],
})
export class ContractsModule {}
