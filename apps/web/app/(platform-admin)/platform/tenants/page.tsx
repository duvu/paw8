'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { cn } from '@/lib/cn';
import {
  Alert,
  Badge,
  Button,
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
import type { PlatformTenant } from '@/types/platform';

interface PagedResult {
  data: PlatformTenant[];
  total: number;
}

function statusVariant(status: string): 'success' | 'destructive' | 'warning' | 'default' {
  if (status === 'active') return 'success';
  if (status === 'locked') return 'destructive';
  if (status === 'trial') return 'warning';
  return 'default';
}

const PLAN_LABELS: Record<string, string> = {
  trial: 'Trial',
  basic: 'Basic',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

export default function PlatformTenantsPage() {
  const [allTenants, setAllTenants] = useState<PlatformTenant[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    api
      .get<PagedResult>('/tenants', {
        params: {
          limit: 500,
          ...(statusFilter ? { status: statusFilter } : {}),
        },
      })
      .then((r) => {
        const rows = r.data.data ?? (r.data as unknown as PlatformTenant[]);
        setAllTenants(rows);
        setTotal(r.data.total ?? rows.length);
      })
      .catch(() => setError('Failed to load tenants'))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const tenants = search
    ? allTenants.filter(
        (t) =>
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          t.code.toLowerCase().includes(search.toLowerCase()),
      )
    : allTenants;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Tenants"
        subtitle={`${total} total`}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/platform/tenants/new">
              <Button size="sm" variant="outline">New Tenant</Button>
            </Link>
            <Link href="/platform/tenants/onboard">
              <Button size="sm">Onboard Wizard</Button>
            </Link>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input
          type="search"
          placeholder="Search by name or code…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={cn(
            'px-3 py-1.5 text-sm rounded-lg border border-neutral-700 bg-neutral-900 text-white',
            'placeholder:text-neutral-500 focus:outline-none focus:border-rose-500',
            'w-64',
          )}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={cn(
            'px-3 py-1.5 text-sm rounded-lg border border-neutral-700 bg-neutral-900 text-white',
            'focus:outline-none focus:border-rose-500',
          )}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="locked">Locked</option>
          <option value="expired">Expired</option>
        </select>
      </div>

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
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Max Stores</TableHead>
                  <TableHead>Max Users</TableHead>
                  <TableHead>Trial Ends</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium text-white">{t.name}</TableCell>
                    <TableCell className="font-mono text-xs text-neutral-400">{t.code}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{PLAN_LABELS[t.plan] ?? t.plan}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(t.status)}>{t.status}</Badge>
                    </TableCell>
                    <TableCell className="text-neutral-400">{t.maxStores}</TableCell>
                    <TableCell className="text-neutral-400">{t.maxUsers}</TableCell>
                    <TableCell className="text-neutral-400 text-sm">
                      {t.trialEndDate
                        ? new Date(t.trialEndDate).toLocaleDateString('vi-VN')
                        : '—'}
                    </TableCell>
                    <TableCell className="text-neutral-400 text-sm">
                      {new Date(t.createdAt).toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/platform/tenants/${t.id}`}
                        className="text-xs text-rose-400 hover:text-rose-300 transition-colors font-medium"
                      >
                        View →
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
                {tenants.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <EmptyState title="No tenants found" className="py-12" />
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
