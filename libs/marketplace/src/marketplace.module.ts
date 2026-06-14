import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketplaceService } from './marketplace.service';
import { MarketplaceRepository } from './marketplace.repository';
import { MarketplaceController } from './marketplace.controller';
import { MarketplacePublicController } from './marketplace-public.controller';
import { TransactionsModule } from '../../transactions/src/transactions.module';
import { AssetsModule } from '../../assets/src/assets.module';
import { FilesModule } from '../../files/src/files.module';
import { AuditModule } from '../../audit/src/audit.module';
import { TenantsModule } from '../../tenants/src/tenants.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([]),
    TransactionsModule,
    AssetsModule,
    FilesModule,
    AuditModule,
    TenantsModule,
  ],
  providers: [MarketplaceService, MarketplaceRepository],
  controllers: [MarketplaceController, MarketplacePublicController],
  exports: [MarketplaceService, MarketplaceRepository],
})
export class MarketplaceModule {}
