export type AppRole =
  | 'platform_admin'
  | 'tenant_owner'
  | 'tenant_admin'
  | 'store_manager'
  | 'staff'
  | 'accountant'
  | string;

export const adminRoles = ['platform_admin', 'tenant_owner', 'tenant_admin'] as const;
export const reportingRoles = ['platform_admin', 'tenant_owner', 'tenant_admin', 'store_manager', 'accountant'] as const;
export const dashboardRoles = ['platform_admin', 'tenant_owner', 'tenant_admin', 'store_manager'] as const;
export const auditRoles = ['tenant_owner', 'tenant_admin', 'store_manager', 'accountant'] as const;
export const marketplaceRoles = ['tenant_owner', 'tenant_admin', 'store_manager', 'staff'] as const;

export function canAccessRole(role: string | undefined, allowedRoles?: readonly string[]): boolean {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  if (!role) return false;
  return allowedRoles.includes(role);
}

export function getDefaultRouteForRole(role: string | undefined): string {
  if (role === 'platform_admin') return '/platform/dashboard';
  if (role === 'accountant') return '/reports?tab=collections';
  if (role === 'staff') return '/customers';
  return '/dashboard';
}
