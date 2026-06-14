'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { cn } from '@/lib/cn';
import { Alert, Card, CardContent, Spinner, Badge } from '@/components/ui';
import type { TenantStats, PlatformActivity } from '@/types/platform';

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-xs text-neutral-400">{label}</p>
        <p className="mt-1 text-2xl font-bold text-white">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-neutral-500">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function statusVariant(status: string): 'success' | 'destructive' | 'warning' | 'default' {
  if (status === 'active') return 'success';
  if (status === 'suspended') return 'destructive';
  if (status === 'trial') return 'warning';
  return 'default';
}

function fmt(n: number) {
  return new Intl.NumberFormat('vi-VN').format(n);
}

export default function PlatformDashboardPage() {
  const [stats, setStats] = useState<TenantStats | null>(null);
  const [activity, setActivity] = useState<PlatformActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get<TenantStats>('/platform/stats'),
      api.get<PlatformActivity[]>('/platform/activity'),
    ])
      .then(([statsRes, actRes]) => {
        setStats(statsRes.data);
        setActivity(Array.isArray(actRes.data) ? actRes.data : []);
      })
      .catch(() => setError('Failed to load platform data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <Alert variant="destructive">{error}</Alert>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Platform Dashboard</h1>
          <p className="text-sm text-neutral-400 mt-1">System-wide overview</p>
        </div>
        <Link
          href="/platform/tenants/onboard"
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium',
            'bg-rose-600 text-white hover:bg-rose-700 transition-colors',
          )}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Onboard Tenant
        </Link>
      </div>

      {/* Stats grid */}
      {stats && (
        <>
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-3">Tenants</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard label="Total Tenants" value={fmt(stats.tenants.total)} />
              <StatCard label="Active" value={fmt(stats.tenants.active)} />
              <StatCard label="Trial" value={fmt(stats.tenants.trial)} />
              <StatCard label="Suspended" value={fmt(stats.tenants.suspended)} />
            </div>
          </section>

          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-3">Operations</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <StatCard label="Total Stores" value={fmt(stats.stores.total)} />
              <StatCard label="Active Contracts" value={fmt(stats.contracts.active)} />
              <StatCard
                label="Outstanding Principal"
                value={fmt(stats.contracts.totalPrincipal)}
                sub="VND"
              />
            </div>
          </section>

          {/* Expiring soon */}
          {stats.expiringSoon.count > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-3">
                ⚠ Trials Expiring Soon ({stats.expiringSoon.count})
              </h2>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl overflow-hidden">
                <ul className="divide-y divide-amber-500/10">
                  {stats.expiringSoon.tenants.map((t) => (
                    <li key={t.id} className="flex items-center justify-between px-4 py-3">
                      <Link
                        href={`/platform/tenants/${t.id}`}
                        className="text-sm font-medium text-white hover:text-rose-400 transition-colors"
                      >
                        {t.name}
                      </Link>
                      <span className="text-xs text-amber-400">
                        {t.trialEndDate ? new Date(t.trialEndDate).toLocaleDateString('vi-VN') : '—'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}
        </>
      )}

      {/* Recent Activity */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-3">Recent Activity</h2>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
          {activity.length === 0 ? (
            <p className="text-sm text-neutral-500 text-center py-8">No recent activity</p>
          ) : (
            <ul className="divide-y divide-neutral-800">
              {activity.map((item) => (
                <li key={item.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-300 font-medium">{item.action}</p>
                    {item.entityType && (
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {item.entityType}{item.entityId ? ` #${item.entityId}` : ''}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-neutral-600 shrink-0">
                    {new Date(item.createdAt).toLocaleString('vi-VN')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
