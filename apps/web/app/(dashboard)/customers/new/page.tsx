'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useTranslations } from 'next-intl';

interface CreateCustomerDto {
  fullName: string;
  phone: string;
  identityNumber: string;
  dateOfBirth: string;
  permanentAddress: string;
  currentAddress: string;
  occupation: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  notes: string;
}

const initial: CreateCustomerDto = {
  fullName: '',
  phone: '',
  identityNumber: '',
  dateOfBirth: '',
  permanentAddress: '',
  currentAddress: '',
  occupation: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  notes: '',
};

function Field({
  label,
  name,
  value,
  onChange,
  type = 'text',
  required,
}: {
  label: string;
  name: keyof CreateCustomerDto;
  value: string;
  onChange: (n: keyof CreateCustomerDto, v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        required={required}
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

export default function NewCustomerPage() {
  const t = useTranslations('customers');
  const router = useRouter();
  const [form, setForm] = useState<CreateCustomerDto>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (n: keyof CreateCustomerDto, v: string) =>
    setForm((f) => ({ ...f, [n]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/customers', form);
      router.push('/customers');
    } catch {
      setError(t('createError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-gray-800 mb-6">{t('newTitle')}</h1>
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="bg-white rounded border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('form.fullName')} name="fullName" value={form.fullName} onChange={set} required />
          <Field label={t('form.phone')} name="phone" value={form.phone} onChange={set} required />
          <Field label={t('form.identityNumber')} name="identityNumber" value={form.identityNumber} onChange={set} required />
          <Field label={t('form.dateOfBirth')} name="dateOfBirth" value={form.dateOfBirth} onChange={set} type="date" />
          <Field label={t('form.occupation')} name="occupation" value={form.occupation} onChange={set} />
          <Field label={t('form.emergencyContactName')} name="emergencyContactName" value={form.emergencyContactName} onChange={set} />
          <Field label={t('form.emergencyContactPhone')} name="emergencyContactPhone" value={form.emergencyContactPhone} onChange={set} />
        </div>
        <Field label={t('form.permanentAddress')} name="permanentAddress" value={form.permanentAddress} onChange={set} />
        <Field label={t('form.currentAddress')} name="currentAddress" value={form.currentAddress} onChange={set} />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.notes')}</label>
          <textarea
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? t('saving') : t('createButton')}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="border border-gray-300 text-gray-700 px-6 py-2 rounded text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
