'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useTranslations } from 'next-intl';

interface CreateAssetDto {
  assetType: string;
  assetName: string;
  brand: string;
  model: string;
  color: string;
  serialNumber: string;
  imei: string;
  licensePlate: string;
  chassisNumber: string;
  engineNumber: string;
  conditionDescription: string;
  valuationAmount: string;
  proposedLoanAmount: string;
  locationCode: string;
  locationNote: string;
}

const initial: CreateAssetDto = {
  assetType: 'other',
  assetName: '',
  brand: '',
  model: '',
  color: '',
  serialNumber: '',
  imei: '',
  licensePlate: '',
  chassisNumber: '',
  engineNumber: '',
  conditionDescription: '',
  valuationAmount: '',
  proposedLoanAmount: '',
  locationCode: '',
  locationNote: '',
};

const TYPES = ['motorbike', 'car', 'phone', 'laptop', 'watch', 'jewelry', 'electronics', 'other'];

function Field({ label, name, value, onChange, type = 'text' }: {
  label: string; name: keyof CreateAssetDto; value: string;
  onChange: (n: keyof CreateAssetDto, v: string) => void; type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

export default function NewAssetPage() {
  const t = useTranslations('assets');
  const router = useRouter();
  const [form, setForm] = useState<CreateAssetDto>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (n: keyof CreateAssetDto, v: string) => setForm((f) => ({ ...f, [n]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/assets', {
        ...form,
        valuationAmount: Number(form.valuationAmount),
        proposedLoanAmount: Number(form.proposedLoanAmount),
      });
      router.push('/assets');
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.assetType')} <span className="text-red-500">*</span></label>
          <select
            value={form.assetType}
            onChange={(e) => set('assetType', e.target.value)}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none"
          >
            {TYPES.map((tp) => <option key={tp} value={tp}>{tp}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('form.assetName')} name="assetName" value={form.assetName} onChange={set} />
          <Field label={t('form.brand')} name="brand" value={form.brand} onChange={set} />
          <Field label={t('form.model')} name="model" value={form.model} onChange={set} />
          <Field label={t('form.color')} name="color" value={form.color} onChange={set} />
          <Field label={t('form.serialNumber')} name="serialNumber" value={form.serialNumber} onChange={set} />
          <Field label={t('form.imei')} name="imei" value={form.imei} onChange={set} />
          <Field label={t('form.licensePlate')} name="licensePlate" value={form.licensePlate} onChange={set} />
          <Field label={t('form.chassisNumber')} name="chassisNumber" value={form.chassisNumber} onChange={set} />
          <Field label={t('form.engineNumber')} name="engineNumber" value={form.engineNumber} onChange={set} />
          <Field label={t('form.valuationAmount')} name="valuationAmount" value={form.valuationAmount} onChange={set} type="number" />
          <Field label={t('form.proposedLoanAmount')} name="proposedLoanAmount" value={form.proposedLoanAmount} onChange={set} type="number" />
          <Field label={t('form.locationCode')} name="locationCode" value={form.locationCode} onChange={set} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.conditionDescription')}</label>
          <textarea
            value={form.conditionDescription}
            onChange={(e) => set('conditionDescription', e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none"
          />
        </div>
        <Field label={t('form.locationNote')} name="locationNote" value={form.locationNote} onChange={set} />
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
