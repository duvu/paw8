// Tenant interfaces
export interface ITenant {
  id: string;
  name: string;
  code: string;
  status: string;
  plan: string;
  maxStores: number;
  maxUsers: number;
  trialEndDate?: string;
  createdAt: string;
}

export interface ICreateTenantPayload {
  name: string;
  code: string;
  plan?: string;
  maxStores?: number;
  maxUsers?: number;
  trialEndDate?: string;
}

export interface IUpdateTenantPayload {
  name?: string;
  plan?: string;
  maxStores?: number;
  maxUsers?: number;
  trialEndDate?: string;
}

export type TenantStatus = 'active' | 'suspended' | 'inactive';
