import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { MinioService } from './minio.service';
import {
  RequestUploadUrlDto,
  ConfirmUploadDto,
  FileResponseDto,
} from './dto/file.dto';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    @InjectDataSource() private dataSource: DataSource,
    private minioService: MinioService,
    private configService: ConfigService,
  ) {}

  async requestUploadUrl(
    tenantId: string,
    userId: string,
    dto: RequestUploadUrlDto,
  ): Promise<{ uploadUrl: string; objectKey: string; expiresIn: number }> {
    // Verify entity belongs to the tenant (basic check)
    await this.verifyEntityBelongsToTenant(tenantId, dto.entityType, dto.entityId);

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
    // Security: verify objectKey belongs to this tenant
    if (!dto.uploadToken.startsWith(`tenants/${tenantId}/`)) {
      throw new ForbiddenException('Invalid upload token for this tenant');
    }

    // Extract metadata from objectKey path: tenants/{tenantId}/{entityType}s/{entityId}/...
    const parts = dto.uploadToken.split('/');
    if (parts.length < 5) {
      throw new BadRequestException('Invalid upload token format');
    }

    const entityTypePlural = parts[2]; // e.g. 'customers', 'assets'
    const entityId = parts[3];
    const entityType = entityTypePlural.replace(/s$/, ''); // crude depluralize
    const originalFilename = parts.slice(4).join('/').replace(/^\d+-/, ''); // strip timestamp prefix

    const id = crypto.randomUUID();
    const now = new Date();

    await this.dataSource.query(
      `INSERT INTO files
        (id, tenant_id, entity_type, entity_id, bucket, object_key, original_filename, mime_type, file_size, uploaded_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        id,
        tenantId,
        entityType,
        entityId,
        this.minioService.getBucket(),
        dto.uploadToken,
        originalFilename,
        'application/octet-stream',
        dto.fileSize ?? 0,
        userId,
        now,
      ],
    );

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
    const rows = await this.dataSource.query(
      `SELECT * FROM files WHERE id = $1 AND tenant_id = $2`,
      [fileId, tenantId],
    );

    if (!rows || rows.length === 0) {
      throw new NotFoundException('File not found');
    }

    const file = rows[0];

    const expiry = parseInt(
      this.configService.get<string>('MINIO_PRESIGNED_DOWNLOAD_EXPIRY', '3600'),
      10,
    );

    const downloadUrl = await this.minioService.getPresignedDownloadUrl(
      file.object_key,
      expiry,
    );

    return { downloadUrl, expiresIn: expiry };
  }

  async listByEntity(
    tenantId: string,
    entityType: string,
    entityId: string,
  ): Promise<FileResponseDto[]> {
    const rows = await this.dataSource.query(
      `SELECT * FROM files
       WHERE tenant_id = $1 AND entity_type = $2 AND entity_id = $3
       ORDER BY created_at DESC`,
      [tenantId, entityType, entityId],
    );

    return (rows || []).map(this.mapRow);
  }

  async delete(tenantId: string, userId: string, fileId: string): Promise<void> {
    const rows = await this.dataSource.query(
      `SELECT * FROM files WHERE id = $1 AND tenant_id = $2`,
      [fileId, tenantId],
    );

    if (!rows || rows.length === 0) {
      throw new NotFoundException('File not found');
    }

    const file = rows[0];

    // Best-effort delete from MinIO
    try {
      await this.minioService.deleteObject(file.object_key);
    } catch (err) {
      this.logger.warn(`Failed to delete MinIO object ${file.object_key}: ${err.message}`);
    }

    await this.dataSource.query(`DELETE FROM files WHERE id = $1`, [fileId]);
  }

  private async verifyEntityBelongsToTenant(
    tenantId: string,
    entityType: string,
    entityId: string,
  ): Promise<void> {
    const tableMap: Record<string, string> = {
      customer: 'customers',
      asset: 'assets',
      contract: 'pawn_contracts',
      receipt: 'payment_receipts',
    };

    const table = tableMap[entityType];
    if (!table) {
      throw new BadRequestException(`Unknown entity type: ${entityType}`);
    }

    const rows = await this.dataSource.query(
      `SELECT id FROM ${table} WHERE id = $1 AND tenant_id = $2`,
      [entityId, tenantId],
    );

    if (!rows || rows.length === 0) {
      throw new NotFoundException(`Entity ${entityType}/${entityId} not found in this tenant`);
    }
  }

  private mapRow(row: any): FileResponseDto {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      originalFilename: row.original_filename,
      mimeType: row.mime_type,
      fileSize: row.file_size,
      uploadedBy: row.uploaded_by,
      createdAt: row.created_at,
    };
  }
}
