'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useTranslations } from 'next-intl';
import {
  Button,
  Input,
  Select,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Alert,
} from '@/components/ui';

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
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold text-neutral-900">{t('newTitle')}</h1>

      {error && <Alert variant="destructive">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic info */}
        <Card>
          <CardHeader>
            <CardTitle>{t('form.basicInfo') ?? 'Basic Information'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label={`${t('form.assetType')} *`}
                value={form.assetType}
                onChange={(e) => set('assetType', e.target.value)}
                required
                containerClassName="sm:col-span-2"
              >
                {TYPES.map((tp) => (
                  <option key={tp} value={tp}>{tp}</option>
                ))}
              </Select>
              <Input
                label={t('form.assetName')}
                value={form.assetName}
                onChange={(e) => set('assetName', e.target.value)}
              />
              <Input
                label={t('form.brand')}
                value={form.brand}
                onChange={(e) => set('brand', e.target.value)}
              />
              <Input
                label={t('form.model')}
                value={form.model}
                onChange={(e) => set('model', e.target.value)}
              />
              <Input
                label={t('form.color')}
                value={form.color}
                onChange={(e) => set('color', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Identifiers */}
        <Card>
          <CardHeader>
            <CardTitle>{t('form.identifiers') ?? 'Identifiers'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label={t('form.serialNumber')}
                value={form.serialNumber}
                onChange={(e) => set('serialNumber', e.target.value)}
              />
              <Input
                label={t('form.imei')}
                value={form.imei}
                onChange={(e) => set('imei', e.target.value)}
              />
              <Input
                label={t('form.licensePlate')}
                value={form.licensePlate}
                onChange={(e) => set('licensePlate', e.target.value)}
              />
              <Input
                label={t('form.chassisNumber')}
                value={form.chassisNumber}
                onChange={(e) => set('chassisNumber', e.target.value)}
              />
              <Input
                label={t('form.engineNumber')}
                value={form.engineNumber}
                onChange={(e) => set('engineNumber', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Valuation & Location */}
        <Card>
          <CardHeader>
            <CardTitle>{t('form.valuationLocation') ?? 'Valuation & Location'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label={t('form.valuationAmount')}
                type="number"
                value={form.valuationAmount}
                onChange={(e) => set('valuationAmount', e.target.value)}
              />
              <Input
                label={t('form.proposedLoanAmount')}
                type="number"
                value={form.proposedLoanAmount}
                onChange={(e) => set('proposedLoanAmount', e.target.value)}
              />
              <Input
                label={t('form.locationCode')}
                value={form.locationCode}
                onChange={(e) => set('locationCode', e.target.value)}
              />
              <Input
                label={t('form.locationNote')}
                value={form.locationNote}
                onChange={(e) => set('locationNote', e.target.value)}
              />
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-neutral-700">{t('form.conditionDescription')}</label>
                <textarea
                  value={form.conditionDescription}
                  onChange={(e) => set('conditionDescription', e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/25 focus:border-primary-500 transition-all duration-150"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" loading={loading}>
            {t('createButton')}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
