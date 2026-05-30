import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetsService } from './assets.service';
import { AssetsController } from './assets.controller';
import { AssetsRepository } from './assets.repository';

@Module({
  imports: [TypeOrmModule.forFeature([])],
  providers: [AssetsService, AssetsRepository],
  controllers: [AssetsController],
  exports: [AssetsService, AssetsRepository],
})
export class AssetsModule {}
