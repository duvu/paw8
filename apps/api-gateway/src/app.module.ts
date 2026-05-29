import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(__dirname, '../../../../.env'),
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
  ],
})
export class AppModule {}
