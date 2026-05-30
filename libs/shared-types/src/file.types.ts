// File interfaces
export interface IFile {
  id: string;
  tenantId: string;
  storeId?: string;
  entityType: string;
  entityId: string;
  bucket: string;
  objectKey: string;
  originalFilename: string;
  mimeType?: string;
  fileSize?: number;
  uploadedBy: string;
  createdAt: string;
}

export interface IPresignedUploadResponse {
  uploadUrl: string;
  objectKey: string;
  fileId: string;
}

export interface IPresignedDownloadResponse {
  downloadUrl: string;
  expiresIn: number;
}

export type FileEntityType = 'customer' | 'asset' | 'contract' | 'receipt';
