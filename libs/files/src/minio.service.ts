import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';

@Injectable()
export class MinioService {
  private client: Client;
  private bucket: string;

  constructor(private configService: ConfigService) {
    this.client = new Client({
      endPoint: configService.get<string>('MINIO_ENDPOINT', 'localhost'),
      port: parseInt(configService.get<string>('MINIO_PORT', '9000'), 10),
      useSSL: configService.get<string>('MINIO_USE_SSL') === 'true',
      accessKey: configService.get<string>('MINIO_ACCESS_KEY', 'minioadmin'),
      secretKey: configService.get<string>('MINIO_SECRET_KEY', 'minioadmin'),
    });
    this.bucket = configService.get<string>('MINIO_BUCKET', 'pawn-platform');
  }

  getBucket(): string {
    return this.bucket;
  }

  async getPresignedUploadUrl(objectKey: string, expiry: number): Promise<string> {
    return this.client.presignedPutObject(this.bucket, objectKey, expiry);
  }

  async getPresignedDownloadUrl(objectKey: string, expiry: number): Promise<string> {
    return this.client.presignedGetObject(this.bucket, objectKey, expiry);
  }

  async deleteObject(objectKey: string): Promise<void> {
    await this.client.removeObject(this.bucket, objectKey);
  }
}
