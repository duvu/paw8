// User interfaces
export interface IUser {
  id: string;
  tenantId: string;
  email: string;
  phone?: string;
  fullName: string;
  status: string;
  role?: string;
  allowedStoreIds?: string[];
  createdAt: string;
}

export interface ICreateUserPayload {
  email: string;
  phone?: string;
  fullName: string;
  password: string;
  role?: string;
}

export interface IUpdateUserPayload {
  phone?: string;
  fullName?: string;
}

export interface IJwtPayload {
  sub: string;
  email: string;
  tenantId: string;
  role: string;
  allowedStoreIds: string[];
}

export type UserStatus = 'active' | 'inactive';
export type UserRole = 'platform_admin' | 'tenant_owner' | 'tenant_admin' | 'store_manager' | 'staff' | 'accountant';
