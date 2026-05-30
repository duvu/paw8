import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractsService } from './contracts.service';
import { ContractsController } from './contracts.controller';
import { ContractsRepository } from './contracts.repository';

@Module({
  imports: [TypeOrmModule.forFeature([])],
  providers: [ContractsService, ContractsRepository],
  controllers: [ContractsController],
  exports: [ContractsService, ContractsRepository],
})
export class ContractsModule {}
