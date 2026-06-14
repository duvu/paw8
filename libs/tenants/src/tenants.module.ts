import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { TenantsRepository } from './tenants.repository';
import { UsersRepository } from '../../users/src/users.repository';

@Module({
  imports: [TypeOrmModule.forFeature([])],
  controllers: [TenantsController],
  providers: [TenantsService, TenantsRepository, UsersRepository],
  exports: [TenantsService, TenantsRepository],
})
export class TenantsModule {}
