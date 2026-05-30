// Audit log interfaces
export interface IAuditLog {
  id: string;
  tenantId?: string;
  storeId?: string;
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// Common pagination
export interface IPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface IPaginationQuery {
  page?: number;
  limit?: number;
}
