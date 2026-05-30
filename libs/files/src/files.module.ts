import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { MinioService } from './minio.service';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { FilesRepository } from './files.repository';

@Module({
  imports: [TypeOrmModule.forFeature([]), ConfigModule],
  providers: [MinioService, FilesService, FilesRepository],
  controllers: [FilesController],
  exports: [FilesService, FilesRepository, MinioService],
})
export class FilesModule {}
