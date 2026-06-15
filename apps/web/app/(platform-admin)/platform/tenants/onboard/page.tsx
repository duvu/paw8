'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { cn } from '@/lib/cn';
import { Alert, Button } from '@/components/ui';
import type { OnboardTenantDto, PlatformTenant } from '@/types/platform';

const STEPS = ['Tenant Info', 'Plan & Limits', 'Owner Account'] as const;

const PLAN_OPTIONS: PlatformTenant['plan'][] = ['trial', 'basic', 'pro', 'enterprise'];

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
              i < current
                ? 'bg-rose-600 text-white'
                : i === current
                  ? 'bg-rose-600/20 text-rose-400 ring-2 ring-rose-600'
                  : 'bg-neutral-800 text-neutral-500',
            )}
          >
            {i < current ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              i + 1
            )}
          </div>
          <span
            className={cn(
              'text-sm font-medium hidden sm:block',
              i === current ? 'text-white' : 'text-neutral-500',
            )}
          >
            {STEPS[i]}
          </span>
          {i < total - 1 && <div className="w-8 h-px bg-neutral-700" />}
        </div>
      ))}
    </div>
  );
}

function Field({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-neutral-300">
        {label}
        {required && <span className="text-rose-400 ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}

const inputCls = cn(
  'w-full px-3 py-2 text-sm rounded-lg border border-neutral-700 bg-neutral-800 text-white',
  'placeholder:text-neutral-500 focus:outline-none focus:border-rose-500 transition-colors',
);

export default function OnboardTenantPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<OnboardTenantDto>({
    name: '',
    code: '',
    plan: 'trial',
    maxStores: 3,
    maxUsers: 10,
    trialEndDate: '',
    ownerEmail: '',
    ownerFullName: '',
    ownerPassword: '',
    ownerPhone: '',
  });

  function set<K extends keyof OnboardTenantDto>(k: K, v: OnboardTenantDto[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function canNext(): boolean {
    if (step === 0) return !!(form.name.trim() && form.code.trim());
    if (step === 1) return form.maxStores > 0 && form.maxUsers > 0;
    if (step === 2) return !!(form.ownerEmail && form.ownerFullName && form.ownerPassword.length >= 8);
    return false;
  }

  async function submit() {
    setError('');
    setSubmitting(true);
    try {
      const payload: OnboardTenantDto = {
        ...form,
        trialEndDate: form.trialEndDate || undefined,
        ownerPhone: form.ownerPhone || undefined,
      };
      await api.post('/tenants/onboard', payload);
      router.push('/platform/tenants');
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Onboarding failed')
          : 'Onboarding failed';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Onboard New Tenant</h1>
        <p className="text-sm text-neutral-400 mt-1">Create a tenant + owner in one step</p>
      </div>

      <StepIndicator current={step} total={STEPS.length} />

      {error && <Alert variant="destructive">{error}</Alert>}

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-5">
        {/* Step 0: Tenant Info */}
        {step === 0 && (
          <>
            <h2 className="text-base font-semibold text-white">{STEPS[0]}</h2>
            <Field label="Tenant Name" required>
              <input
                className={inputCls}
                placeholder="e.g. Cầm đồ Minh Phát"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
              />
            </Field>
            <Field label="Tenant Code" required hint="Unique short code, lowercase alphanumeric + hyphens">
              <input
                className={inputCls}
                placeholder="e.g. minh-phat"
                value={form.code}
                onChange={(e) => set('code', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              />
            </Field>
          </>
        )}

        {/* Step 1: Plan & Limits */}
        {step === 1 && (
          <>
            <h2 className="text-base font-semibold text-white">{STEPS[1]}</h2>
            <Field label="Plan" required>
              <select
                className={inputCls}
                value={form.plan}
                onChange={(e) => set('plan', e.target.value as PlatformTenant['plan'])}
              >
                {PLAN_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Max Stores" required>
                <input
                  type="number"
                  min={1}
                  className={inputCls}
                  value={form.maxStores}
                  onChange={(e) => set('maxStores', Math.max(1, Number(e.target.value)))}
                />
              </Field>
              <Field label="Max Users" required>
                <input
                  type="number"
                  min={1}
                  className={inputCls}
                  value={form.maxUsers}
                  onChange={(e) => set('maxUsers', Math.max(1, Number(e.target.value)))}
                />
              </Field>
            </div>
            <Field label="Trial End Date" hint="Leave blank for no trial expiry">
              <input
                type="date"
                className={inputCls}
                value={form.trialEndDate ?? ''}
                onChange={(e) => set('trialEndDate', e.target.value)}
              />
            </Field>
          </>
        )}

        {/* Step 2: Owner Account */}
        {step === 2 && (
          <>
            <h2 className="text-base font-semibold text-white">{STEPS[2]}</h2>
            <Field label="Owner Email" required>
              <input
                type="email"
                className={inputCls}
                placeholder="owner@company.vn"
                value={form.ownerEmail}
                onChange={(e) => set('ownerEmail', e.target.value)}
              />
            </Field>
            <Field label="Full Name" required>
              <input
                className={inputCls}
                placeholder="Nguyễn Văn A"
                value={form.ownerFullName}
                onChange={(e) => set('ownerFullName', e.target.value)}
              />
            </Field>
            <Field label="Password" required hint="Minimum 8 characters">
              <input
                type="password"
                className={inputCls}
                placeholder="••••••••"
                value={form.ownerPassword}
                onChange={(e) => set('ownerPassword', e.target.value)}
              />
            </Field>
            <Field label="Phone (optional)">
              <input
                className={inputCls}
                placeholder="0901234567"
                value={form.ownerPhone ?? ''}
                onChange={(e) => set('ownerPhone', e.target.value)}
              />
            </Field>
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => (step === 0 ? router.push('/platform/tenants') : setStep((s) => s - 1))}
          disabled={submitting}
        >
          {step === 0 ? 'Cancel' : '← Back'}
        </Button>
        {step < 2 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext()}>
            Next →
          </Button>
        ) : (
          <Button onClick={() => void submit()} disabled={!canNext() || submitting}>
            {submitting ? 'Creating…' : 'Create Tenant & Owner'}
          </Button>
        )}
      </div>
    </div>
  );
}
