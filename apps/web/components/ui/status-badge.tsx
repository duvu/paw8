import * as React from 'react';
import { Badge } from './badge';
import type { BadgeVariant } from './badge';

type ContractStatus =
  | 'draft' | 'active' | 'near_due' | 'overdue' | 'extended'
  | 'settled' | 'cancelled' | 'liquidation_pending' | 'liquidated';

type AssetStatus =
  | 'holding' | 'pawned' | 'redeemed' | 'overdue' | 'pending_liquidation' | 'liquidated';

export interface StatusBadgeProps {
  status: ContractStatus | AssetStatus | string;
  domain?: 'contract' | 'asset';
}

const statusVariantMap: Record<string, BadgeVariant> = {
  active: 'success',
  redeemed: 'success',
  settled: 'success',
  holding: 'info',
  pawned: 'info',
  near_due: 'warning',
  extended: 'warning',
  overdue: 'destructive',
  liquidation_pending: 'destructive',
  pending_liquidation: 'destructive',
  draft: 'outline',
  cancelled: 'outline',
  liquidated: 'default',
};

function toLabel(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const variant = statusVariantMap[status] ?? 'default';
  return <Badge variant={variant}>{toLabel(status)}</Badge>;
}
