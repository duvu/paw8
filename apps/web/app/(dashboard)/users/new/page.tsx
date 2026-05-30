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
  CardContent,
  Alert,
} from '@/components/ui';

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

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold text-neutral-900 mb-6">{t('newTitle')}</h1>
      {error && <Alert variant="destructive" className="mb-4">{error}</Alert>}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="pt-5 space-y-4">
            <Input
              label={t('form.email')}
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              required
            />
            <Input
              label={t('form.fullName')}
              type="text"
              value={form.fullName}
              onChange={(e) => set('fullName', e.target.value)}
              required
            />
            <Input
              label={t('form.phone')}
              type="text"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
            />
            <Input
              label={t('form.password')}
              type="password"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              required
            />
            <Select
              label={t('form.role')}
              value={form.role}
              onChange={(e) => set('role', e.target.value)}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {t(`roles.${r}` as 'roles.staff' | 'roles.store_manager' | 'roles.accountant' | 'roles.tenant_admin' | 'roles.tenant_owner')}
                </option>
              ))}
            </Select>
            <div className="flex gap-3 pt-1">
              <Button type="submit" loading={loading} disabled={loading}>
                {loading ? t('saving') : t('createButton')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
