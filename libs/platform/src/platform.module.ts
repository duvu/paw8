import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';
import { PlatformRepository } from './platform.repository';
import { TrialExpiryService } from './trial-expiry.service';
import { AuditModule } from '../../audit/src/audit.module';
import { TenantsModule } from '../../tenants/src/tenants.module';

@Module({
  imports: [TypeOrmModule.forFeature([]), AuditModule, TenantsModule],
  controllers: [PlatformController],
  providers: [PlatformService, PlatformRepository, TrialExpiryService],
})
export class PlatformModule {}
