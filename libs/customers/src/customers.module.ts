import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { CustomersRepository } from './customers.repository';

@Module({
  imports: [TypeOrmModule.forFeature([])],
  providers: [CustomersService, CustomersRepository],
  controllers: [CustomersController],
  exports: [CustomersService, CustomersRepository],
})
export class CustomersModule {}
