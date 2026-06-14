// Platform admin API response types

export interface TenantStats {
  tenants: {
    total: number;
    active: number;
    suspended: number;
    trial: number;
  };
  stores: {
    total: number;
  };
  contracts: {
    active: number;
    totalPrincipal: number;
  };
  expiringSoon: {
    count: number;
    tenants: Array<{
      id: string;
      name: string;
      trialEndDate: string | null;
    }>;
  };
}

export interface PlatformActivity {
  id: string;
  tenantId: string | null;
  storeId: string | null;
  userId: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface PlatformTenant {
  id: string;
  name: string;
  code: string;
  status: 'active' | 'suspended' | 'trial' | 'expired';
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  maxStores: number;
  maxUsers: number;
  trialEndDate: string | null;
  createdAt: string;
}

export interface TenantUsage {
  stores: { current: number; max: number };
  users: { current: number; max: number };
}

export interface CreateTenantDto {
  name: string;
  code: string;
  plan: PlatformTenant['plan'];
  maxStores: number;
  maxUsers: number;
  trialEndDate?: string;
}

export interface OnboardTenantDto extends CreateTenantDto {
  ownerEmail: string;
  ownerFullName: string;
  ownerPassword: string;
  ownerPhone?: string;
}
