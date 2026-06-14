'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { cn } from '@/lib/cn';
import { Alert, Badge, Button, PageHeader, Spinner } from '@/components/ui';
import type { PlatformTenant, TenantUsage } from '@/types/platform';

const inputCls = cn(
  'w-full px-3 py-2 text-sm rounded-lg border border-neutral-700 bg-neutral-800 text-white',
  'placeholder:text-neutral-500 focus:outline-none focus:border-rose-500 transition-colors',
);

type StatusAction = 'active' | 'suspended' | 'trial' | 'expired';

const STATUS_ACTIONS: Array<{ label: string; value: StatusAction; variant: string }> = [
  { label: 'Activate', value: 'active', variant: 'success' },
  { label: 'Suspend', value: 'suspended', variant: 'destructive' },
  { label: 'Set Trial', value: 'trial', variant: 'warning' },
];

function statusVariant(
  status: string,
): 'success' | 'destructive' | 'warning' | 'default' {
  if (status === 'active') return 'success';
  if (status === 'suspended') return 'destructive';
  if (status === 'trial') return 'warning';
  return 'default';
}

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [tenant, setTenant] = useState<PlatformTenant | null>(null);
  const [usage, setUsage] = useState<TenantUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit form state
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [form, setForm] = useState({
    name: '',
    maxStores: 1,
    maxUsers: 5,
    trialEndDate: '',
  });

  // Status toggle state
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.get<PlatformTenant>(`/tenants/${id}`),
      api.get<TenantUsage>(`/tenants/${id}/usage`),
    ])
      .then(([t, u]) => {
        setTenant(t.data);
        setUsage(u.data);
        setForm({
          name: t.data.name,
          maxStores: t.data.maxStores,
          maxUsers: t.data.maxUsers,
          trialEndDate: t.data.trialEndDate
            ? new Date(t.data.trialEndDate).toISOString().split('T')[0]
            : '',
        });
      })
      .catch(() => setError('Failed to load tenant'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!tenant) return;
    setEditError('');
    setSaving(true);
    try {
      const updated = await api.patch<PlatformTenant>(`/tenants/${id}`, {
        name: form.name.trim(),
        maxStores: Number(form.maxStores),
        maxUsers: Number(form.maxUsers),
        ...(form.trialEndDate ? { trialEndDate: form.trialEndDate } : {}),
      });
      setTenant(updated.data);
      setEditing(false);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Save failed.';
      setEditError(Array.isArray(msg) ? msg.join('. ') : msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(newStatus: StatusAction) {
    if (!tenant) return;
    if (tenant.status === newStatus) return;
    setStatusError('');
    setStatusLoading(true);
    try {
      const updated = await api.patch<PlatformTenant>(`/tenants/${id}/status`, {
        status: newStatus,
      });
      setTenant(updated.data);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Status change failed.';
      setStatusError(Array.isArray(msg) ? msg.join('. ') : msg);
    } finally {
      setStatusLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">{error || 'Tenant not found.'}</Alert>
        <Button variant="ghost" onClick={() => router.push('/platform/tenants')}>
          ← Back to Tenants
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/platform/tenants"
          className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors mb-3 inline-block"
        >
          ← Back to Tenants
        </Link>
        <PageHeader
          title={tenant.name}
          subtitle={
            <span className="font-mono text-neutral-400">
              {tenant.code}
            </span>
          }
          actions={
            <Badge variant={statusVariant(tenant.status)}>{tenant.status}</Badge>
          }
        />
      </div>

      {/* Plan & Usage */}
      <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Plan &amp; Usage</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-neutral-500 mb-1">Plan</p>
            <Badge variant="outline" className="capitalize">
              {tenant.plan}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-neutral-500 mb-1">Trial Ends</p>
            <p className="text-sm text-neutral-200">
              {tenant.trialEndDate
                ? new Date(tenant.trialEndDate).toLocaleDateString('vi-VN')
                : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 mb-1">Stores</p>
            {usage ? (
              <div className="flex items-center gap-2">
                <p className="text-sm text-neutral-200">
                  <span className="text-white font-medium">{usage.stores.current}</span>
                  <span className="text-neutral-500"> / {usage.stores.max}</span>
                </p>
                <div className="flex-1 bg-neutral-800 rounded-full h-1.5 max-w-24">
                  <div
                    className={cn(
                      'h-1.5 rounded-full transition-all',
                      usage.stores.current / usage.stores.max > 0.8
                        ? 'bg-rose-500'
                        : 'bg-emerald-500',
                    )}
                    style={{
                      width: `${Math.min((usage.stores.current / usage.stores.max) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-neutral-500">—</p>
            )}
          </div>
          <div>
            <p className="text-xs text-neutral-500 mb-1">Users</p>
            {usage ? (
              <div className="flex items-center gap-2">
                <p className="text-sm text-neutral-200">
                  <span className="text-white font-medium">{usage.users.current}</span>
                  <span className="text-neutral-500"> / {usage.users.max}</span>
                </p>
                <div className="flex-1 bg-neutral-800 rounded-full h-1.5 max-w-24">
                  <div
                    className={cn(
                      'h-1.5 rounded-full transition-all',
                      usage.users.current / usage.users.max > 0.8
                        ? 'bg-rose-500'
                        : 'bg-emerald-500',
                    )}
                    style={{
                      width: `${Math.min((usage.users.current / usage.users.max) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-neutral-500">—</p>
            )}
          </div>
        </div>
      </div>

      {/* Status Management */}
      <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Status Management</h3>
        {statusError && (
          <Alert variant="destructive" className="mb-3">
            {statusError}
          </Alert>
        )}
        <div className="flex flex-wrap gap-2">
          {STATUS_ACTIONS.filter((a) => a.value !== tenant.status).map((action) => (
            <button
              key={action.value}
              onClick={() => handleStatusChange(action.value)}
              disabled={statusLoading}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors disabled:opacity-50',
                action.value === 'active' &&
                  'border-emerald-700 text-emerald-400 hover:bg-emerald-900/30',
                action.value === 'suspended' &&
                  'border-rose-700 text-rose-400 hover:bg-rose-900/30',
                action.value === 'trial' &&
                  'border-amber-700 text-amber-400 hover:bg-amber-900/30',
              )}
            >
              {statusLoading ? '…' : action.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-neutral-500 mt-3">
          Current status: <span className="text-neutral-300">{tenant.status}</span>
        </p>
      </div>

      {/* Edit */}
      <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Edit Details</h3>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-rose-400 hover:text-rose-300 transition-colors font-medium"
            >
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleSave} className="space-y-4">
            {editError && (
              <Alert variant="destructive">{editError}</Alert>
            )}

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">
                Tenant Name
              </label>
              <input
                className={inputCls}
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                disabled={saving}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  Max Stores
                </label>
                <input
                  type="number"
                  min={1}
                  max={999}
                  className={inputCls}
                  value={form.maxStores}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, maxStores: parseInt(e.target.value, 10) || 1 }))
                  }
                  disabled={saving}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  Max Users
                </label>
                <input
                  type="number"
                  min={1}
                  max={9999}
                  className={inputCls}
                  value={form.maxUsers}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, maxUsers: parseInt(e.target.value, 10) || 1 }))
                  }
                  disabled={saving}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">
                Trial End Date{' '}
                <span className="text-neutral-500 font-normal">(optional)</span>
              </label>
              <input
                type="date"
                className={inputCls}
                value={form.trialEndDate}
                onChange={(e) => setForm((p) => ({ ...p, trialEndDate: e.target.value }))}
                disabled={saving}
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={saving}
                onClick={() => {
                  setEditing(false);
                  setEditError('');
                  setForm({
                    name: tenant.name,
                    maxStores: tenant.maxStores,
                    maxUsers: tenant.maxUsers,
                    trialEndDate: tenant.trialEndDate
                      ? new Date(tenant.trialEndDate).toISOString().split('T')[0]
                      : '',
                  });
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt className="text-xs text-neutral-500">Name</dt>
              <dd className="text-neutral-200 mt-0.5">{tenant.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-500">Code</dt>
              <dd className="font-mono text-neutral-200 mt-0.5">{tenant.code}</dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-500">Max Stores</dt>
              <dd className="text-neutral-200 mt-0.5">{tenant.maxStores}</dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-500">Max Users</dt>
              <dd className="text-neutral-200 mt-0.5">{tenant.maxUsers}</dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-500">Created</dt>
              <dd className="text-neutral-200 mt-0.5">
                {new Date(tenant.createdAt).toLocaleDateString('vi-VN')}
              </dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  );
}
