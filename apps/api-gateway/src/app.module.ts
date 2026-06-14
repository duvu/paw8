import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { I18nModule, AcceptLanguageResolver } from 'nestjs-i18n';
import { join } from 'path';
import { AuthModule } from '../../../libs/auth/src/auth.module';
import { TenantsModule } from '../../../libs/tenants/src/tenants.module';
import { StoresModule } from '../../../libs/stores/src/stores.module';
import { UsersModule } from '../../../libs/users/src/users.module';
import { CustomersModule } from '../../../libs/customers/src/customers.module';
import { AssetsModule } from '../../../libs/assets/src/assets.module';
import { ContractsModule } from '../../../libs/contracts/src/contracts.module';
import { TransactionsModule } from '../../../libs/transactions/src/transactions.module';
import { FilesModule } from '../../../libs/files/src/files.module';
import { ReportsModule } from '../../../libs/reports/src/reports.module';
import { AuditModule } from '../../../libs/audit/src/audit.module';
import { PdfModule } from '../../../libs/pdf/src/pdf.module';
import { PlatformModule } from '../../../libs/platform/src/platform.module';
import { MarketplaceModule } from '../../../libs/marketplace/src/marketplace.module';
import {
  JwtAuthGuard,
  TenantGuard,
  RolesGuard,
  StoreScopeGuard,
  AuditInterceptor,
  HealthController,
} from '../../../libs/common/src';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(__dirname, '../../../../.env'),
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => [
        {
          // Global default: 60 requests per 60 seconds
          ttl: parseInt(config.get<string>('THROTTLER_TTL_MS', '60000'), 10),
          limit: parseInt(config.get<string>('THROTTLER_LIMIT', '60'), 10),
        },
      ],
      inject: [ConfigService],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        entities: [join(__dirname, '**/*.entity{.ts,.js}')],
        migrations: [join(__dirname, 'database/migrations/*{.ts,.js}')],
        migrationsTableName: 'typeorm_migrations',
        synchronize: false,
        logging: config.get<string>('APP_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'vi',
      loaderOptions: {
        path: join(__dirname, '../i18n/'),
        watch: true,
      },
      resolvers: [AcceptLanguageResolver],
    }),
    AuthModule,
    TenantsModule,
    StoresModule,
    UsersModule,
    CustomersModule,
    AssetsModule,
    ContractsModule,
    TransactionsModule,
    FilesModule,
    ReportsModule,
    AuditModule,
    PdfModule,
    PlatformModule,
    MarketplaceModule,
  ],
  controllers: [HealthController],
  providers: [
    // ThrottlerGuard must be first — rejects before auth/tenant checks
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: TenantGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: StoreScopeGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
