'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useTranslations } from 'next-intl';

interface CreateUserDto {
  email: string;
  fullName: string;
  phone: string;
  password: string;
  role: string;
}

const ROLES = ['staff', 'store_manager', 'accountant', 'tenant_admin', 'tenant_owner'];

const initial: CreateUserDto = {
  email: '',
  fullName: '',
  phone: '',
  password: '',
  role: 'staff',
};

export default function NewUserPage() {
  const t = useTranslations('users');
  const router = useRouter();
  const [form, setForm] = useState<CreateUserDto>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof CreateUserDto, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/users', form);
      router.push('/users');
    } catch {
      setError(t('createError'));
    } finally {
      setLoading(false);
    }
  };

  const FIELD_LABELS: Record<string, string> = {
    email: t('form.email'),
    fullName: t('form.fullName'),
    phone: t('form.phone'),
  };

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold text-gray-800 mb-6">{t('newTitle')}</h1>
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="bg-white rounded border border-gray-200 p-6 space-y-4">
        {(['email', 'fullName', 'phone'] as (keyof CreateUserDto)[]).map((f) => (
          <div key={f}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {FIELD_LABELS[f]} {f === 'email' || f === 'fullName' ? <span className="text-red-500">*</span> : null}
            </label>
            <input
              type={f === 'email' ? 'email' : 'text'}
              value={form[f]}
              onChange={(e) => set(f, e.target.value)}
              required={f === 'email' || f === 'fullName'}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.password')} <span className="text-red-500">*</span></label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.role')}</label>
          <select
            value={form.role}
            onChange={(e) => set('role', e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {t(`roles.${r}` as 'roles.staff' | 'roles.store_manager' | 'roles.accountant' | 'roles.tenant_admin' | 'roles.tenant_owner')}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {loading ? t('saving') : t('createButton')}
          </button>
          <button type="button" onClick={() => router.back()} className="border border-gray-300 text-gray-700 px-6 py-2 rounded text-sm hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
