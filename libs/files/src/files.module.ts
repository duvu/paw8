import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { MinioService } from './minio.service';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';

@Module({
  imports: [TypeOrmModule.forFeature([]), ConfigModule],
  providers: [MinioService, FilesService],
  controllers: [FilesController],
  exports: [FilesService, MinioService],
})
export class FilesModule {}
