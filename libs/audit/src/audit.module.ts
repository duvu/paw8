import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { AuditRepository } from './audit.repository';

@Module({
  imports: [TypeOrmModule.forFeature([])],
  providers: [AuditService, AuditRepository],
  controllers: [AuditController],
  exports: [AuditService, AuditRepository],
})
export class AuditModule {}
