'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import {
  Alert,
  Badge,
  EmptyState,
  PageHeader,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import type { PlatformActivity } from '@/types/platform';

const ACTION_LABELS: Record<string, string> = {
  login: 'Login',
  login_failed: 'Login Failed',
  create_tenant: 'Create Tenant',
  update_tenant: 'Update Tenant',
  set_tenant_status: 'Status Change',
  trial_expired: 'Trial Expired',
  onboard_tenant: 'Tenant Onboarded',
  set_tenant_owner: 'Owner Set',
};

function actionVariant(
  action: string,
): 'success' | 'destructive' | 'warning' | 'default' | 'info' {
  if (action === 'login') return 'success';
  if (action === 'login_failed' || action === 'trial_expired') return 'destructive';
  if (action === 'set_tenant_status') return 'warning';
  if (action === 'onboard_tenant' || action === 'create_tenant') return 'info';
  return 'default';
}

export default function PlatformActivityPage() {
  const [activities, setActivities] = useState<PlatformActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<PlatformActivity[]>('/platform/activity')
      .then((r) => setActivities(r.data))
      .catch(() => setError('Failed to load activity log'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Platform Activity"
        subtitle="Recent platform-level events across all tenants"
      />

      {error && <Alert variant="destructive">{error}</Alert>}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 shadow-sm overflow-hidden">
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Entity ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="text-sm text-neutral-400 whitespace-nowrap">
                      {new Date(a.createdAt).toLocaleString('vi-VN')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={actionVariant(a.action)}>
                        {ACTION_LABELS[a.action] ?? a.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-neutral-300">
                      {a.entityType ?? '—'}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-neutral-500">
                      {a.entityId ? a.entityId.slice(0, 8) + '…' : '—'}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-neutral-400">
                      {a.userId ? a.userId.slice(0, 8) + '…' : 'system'}
                    </TableCell>
                    <TableCell className="text-sm text-neutral-500">
                      {a.ipAddress ?? '—'}
                    </TableCell>
                  </TableRow>
                ))}
                {activities.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <EmptyState title="No activity yet" className="py-12" />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      )}
    </div>
  );
}
