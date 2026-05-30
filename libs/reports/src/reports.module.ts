import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { ReportsRepository } from './reports.repository';

@Module({
  imports: [TypeOrmModule.forFeature([])],
  providers: [ReportsService, ReportsRepository],
  controllers: [ReportsController],
  exports: [ReportsService, ReportsRepository],
})
export class ReportsModule {}
