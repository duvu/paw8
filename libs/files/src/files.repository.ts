import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { FileResponseDto } from './dto/file.dto';

@Injectable()
export class FilesRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async insert(data: {
    id: string;
    tenantId: string;
    entityType: string;
    entityId: string;
    bucket: string;
    objectKey: string;
    originalFilename: string;
    mimeType: string;
    fileSize: number;
    uploadedBy: string;
    createdAt: Date;
  }): Promise<void> {
    await this.dataSource.query(
      `INSERT INTO files
        (id, tenant_id, entity_type, entity_id, bucket, object_key, original_filename, mime_type, file_size, uploaded_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [data.id, data.tenantId, data.entityType, data.entityId, data.bucket, data.objectKey, data.originalFilename, data.mimeType, data.fileSize, data.uploadedBy, data.createdAt],
    );
  }

  async findById(tenantId: string, id: string): Promise<any | null> {
    const rows = await this.dataSource.query(
      `SELECT * FROM files WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId],
    );
    return rows[0] ?? null;
  }

  async findByEntity(tenantId: string, entityType: string, entityId: string): Promise<any[]> {
    return this.dataSource.query(
      `SELECT * FROM files
       WHERE tenant_id = $1 AND entity_type = $2 AND entity_id = $3
       ORDER BY created_at DESC`,
      [tenantId, entityType, entityId],
    );
  }

  async deleteById(id: string): Promise<void> {
    await this.dataSource.query(`DELETE FROM files WHERE id = $1`, [id]);
  }

  async verifyEntityBelongsToTenant(tenantId: string, table: string, entityId: string): Promise<boolean> {
    const rows = await this.dataSource.query(
      `SELECT id FROM ${table} WHERE id = $1 AND tenant_id = $2`,
      [entityId, tenantId],
    );
    return rows.length > 0;
  }

  mapRow(row: any): FileResponseDto {
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
