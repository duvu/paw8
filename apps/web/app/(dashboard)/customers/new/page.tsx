'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useTranslations } from 'next-intl';
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Alert,
} from '@/components/ui';

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
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold text-neutral-900">{t('newTitle')}</h1>

      {error && <Alert variant="destructive">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{t('form.personalInfo') ?? 'Personal Information'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label={t('form.fullName')}
                value={form.fullName}
                onChange={(e) => set('fullName', e.target.value)}
                required
              />
              <Input
                label={t('form.phone')}
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                required
              />
              <Input
                label={t('form.identityNumber')}
                value={form.identityNumber}
                onChange={(e) => set('identityNumber', e.target.value)}
                required
              />
              <Input
                label={t('form.dateOfBirth')}
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => set('dateOfBirth', e.target.value)}
              />
              <Input
                label={t('form.occupation')}
                value={form.occupation}
                onChange={(e) => set('occupation', e.target.value)}
              />
              <Input
                label={t('form.emergencyContactName')}
                value={form.emergencyContactName}
                onChange={(e) => set('emergencyContactName', e.target.value)}
              />
              <Input
                label={t('form.emergencyContactPhone')}
                value={form.emergencyContactPhone}
                onChange={(e) => set('emergencyContactPhone', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('form.addressInfo') ?? 'Address'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              <Input
                label={t('form.permanentAddress')}
                value={form.permanentAddress}
                onChange={(e) => set('permanentAddress', e.target.value)}
              />
              <Input
                label={t('form.currentAddress')}
                value={form.currentAddress}
                onChange={(e) => set('currentAddress', e.target.value)}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-neutral-700">{t('form.notes')}</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
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
