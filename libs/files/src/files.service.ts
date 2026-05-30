import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MinioService } from './minio.service';
import {
  RequestUploadUrlDto,
  ConfirmUploadDto,
  FileResponseDto,
} from './dto/file.dto';
import { FilesRepository } from './files.repository';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    private readonly filesRepository: FilesRepository,
    private readonly minioService: MinioService,
    private readonly configService: ConfigService,
  ) {}

  async requestUploadUrl(
    tenantId: string,
    userId: string,
    dto: RequestUploadUrlDto,
  ): Promise<{ uploadUrl: string; objectKey: string; expiresIn: number }> {
    const belongs = await this.filesRepository.verifyEntityBelongsToTenant(tenantId, dto.entityType, dto.entityId);
    if (!belongs) {
      throw new NotFoundException(`Entity ${dto.entityType}/${dto.entityId} not found in this tenant`);
    }

    const sanitizedFilename = dto.originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const objectKey = `tenants/${tenantId}/${dto.entityType}s/${dto.entityId}/${Date.now()}-${sanitizedFilename}`;

    const expiry = parseInt(
      this.configService.get<string>('MINIO_PRESIGNED_UPLOAD_EXPIRY', '300'),
      10,
    );

    const uploadUrl = await this.minioService.getPresignedUploadUrl(objectKey, expiry);

    return { uploadUrl, objectKey, expiresIn: expiry };
  }

  async confirmUpload(
    tenantId: string,
    userId: string,
    dto: ConfirmUploadDto,
  ): Promise<FileResponseDto> {
    if (!dto.uploadToken.startsWith(`tenants/${tenantId}/`)) {
      throw new ForbiddenException('Invalid upload token for this tenant');
    }

    const parts = dto.uploadToken.split('/');
    if (parts.length < 5) {
      throw new BadRequestException('Invalid upload token format');
    }

    const entityTypePlural = parts[2];
    const entityId = parts[3];
    const entityType = entityTypePlural.replace(/s$/, '');
    const originalFilename = parts.slice(4).join('/').replace(/^\d+-/, '');

    const id = crypto.randomUUID();
    const now = new Date();

    await this.filesRepository.insert({
      id,
      tenantId,
      entityType,
      entityId,
      bucket: this.minioService.getBucket(),
      objectKey: dto.uploadToken,
      originalFilename,
      mimeType: 'application/octet-stream',
      fileSize: dto.fileSize ?? 0,
      uploadedBy: userId,
      createdAt: now,
    });

    return {
      id,
      tenantId,
      entityType,
      entityId,
      originalFilename,
      mimeType: 'application/octet-stream',
      fileSize: dto.fileSize ?? 0,
      uploadedBy: userId,
      createdAt: now,
    };
  }

  async getDownloadUrl(
    tenantId: string,
    userId: string,
    fileId: string,
  ): Promise<{ downloadUrl: string; expiresIn: number }> {
    const file = await this.filesRepository.findById(tenantId, fileId);
    if (!file) {
      throw new NotFoundException('File not found');
    }

    const expiry = parseInt(
      this.configService.get<string>('MINIO_PRESIGNED_DOWNLOAD_EXPIRY', '3600'),
      10,
    );

    const downloadUrl = await this.minioService.getPresignedDownloadUrl(file.object_key, expiry);

    return { downloadUrl, expiresIn: expiry };
  }

  async listByEntity(
    tenantId: string,
    entityType: string,
    entityId: string,
  ): Promise<FileResponseDto[]> {
    const rows = await this.filesRepository.findByEntity(tenantId, entityType, entityId);
    return rows.map((row) => this.filesRepository.mapRow(row));
  }

  async delete(tenantId: string, userId: string, fileId: string): Promise<void> {
    const file = await this.filesRepository.findById(tenantId, fileId);
    if (!file) {
      throw new NotFoundException('File not found');
    }

    try {
      await this.minioService.deleteObject(file.object_key);
    } catch (err) {
      this.logger.warn(`Failed to delete MinIO object ${file.object_key}: ${err.message}`);
    }

    await this.filesRepository.deleteById(fileId);
  }
}
