'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { cn } from '@/lib/cn';
import { Alert, Button, PageHeader } from '@/components/ui';
import type { CreateTenantDto, PlatformTenant } from '@/types/platform';

const inputCls = cn(
  'w-full px-3 py-2 text-sm rounded-lg border border-neutral-700 bg-neutral-800 text-white',
  'placeholder:text-neutral-500 focus:outline-none focus:border-rose-500 transition-colors',
);

const PLAN_OPTIONS: Array<{ value: PlatformTenant['plan']; label: string }> = [
  { value: 'trial', label: 'Trial' },
  { value: 'basic', label: 'Basic' },
  { value: 'pro', label: 'Pro' },
  { value: 'enterprise', label: 'Enterprise' },
];

export default function NewTenantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<CreateTenantDto>({
    name: '',
    code: '',
    plan: 'trial',
    maxStores: 1,
    maxUsers: 5,
    trialEndDate: '',
  });

  function set<K extends keyof CreateTenantDto>(key: K, value: CreateTenantDto[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) return setError('Tenant name is required.');
    if (!form.code.trim()) return setError('Tenant code is required.');

    setLoading(true);
    try {
      const payload: CreateTenantDto = {
        name: form.name.trim(),
        code: form.code.trim().toLowerCase(),
        plan: form.plan,
        maxStores: Number(form.maxStores),
        maxUsers: Number(form.maxUsers),
        ...(form.trialEndDate ? { trialEndDate: form.trialEndDate } : {}),
      };
      await api.post('/tenants', payload);
      router.push('/platform/tenants');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to create tenant.';
      setError(Array.isArray(msg) ? msg.join('. ') : msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg">
      <PageHeader
        title="New Tenant"
        subtitle="Create a tenant without an owner. Use Onboard Wizard to also create the owner account."
      />

      <Link
        href="/platform/tenants"
        className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors mb-6 inline-block"
      >
        ← Back to Tenants
      </Link>

      {error && (
        <Alert variant="destructive" className="mb-4">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">Basic Information</h3>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">
              Tenant Name <span className="text-rose-400">*</span>
            </label>
            <input
              className={inputCls}
              placeholder="e.g. Cầm Đồ Minh Tâm"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">
              Tenant Code <span className="text-rose-400">*</span>
            </label>
            <input
              className={inputCls}
              placeholder="e.g. minhtam (lowercase, no spaces)"
              value={form.code}
              onChange={(e) => set('code', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
              disabled={loading}
            />
            <p className="text-xs text-neutral-500 mt-1">
              Used in contract codes and object storage paths.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Plan</label>
            <select
              className={inputCls}
              value={form.plan}
              onChange={(e) => set('plan', e.target.value as PlatformTenant['plan'])}
              disabled={loading}
            >
              {PLAN_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">Plan Limits</h3>

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
                onChange={(e) => set('maxStores', parseInt(e.target.value, 10) || 1)}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Max Users</label>
              <input
                type="number"
                min={1}
                max={9999}
                className={inputCls}
                value={form.maxUsers}
                onChange={(e) => set('maxUsers', parseInt(e.target.value, 10) || 1)}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">
              Trial End Date{' '}
              <span className="text-neutral-500 font-normal">(optional — leave blank if not trial)</span>
            </label>
            <input
              type="date"
              className={inputCls}
              value={form.trialEndDate ?? ''}
              onChange={(e) => set('trialEndDate', e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating…' : 'Create Tenant'}
          </Button>
          <Link href="/platform/tenants">
            <Button type="button" variant="ghost" disabled={loading}>
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
