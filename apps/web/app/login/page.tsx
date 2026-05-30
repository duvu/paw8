'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getDefaultRouteForRole } from '@/lib/role-access';
import { useAuth } from '@/contexts/auth';
import { useTranslations } from 'next-intl';
import { clearSessionNotice, getSessionNotice } from '@/lib/auth-storage';
import { Button, Input, Alert, Card, CardContent } from '@/components/ui';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const t = useTranslations('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const reason = getSessionNotice();
    if (reason === 'expired') {
      setNotice(t('sessionExpired'));
      clearSessionNotice();
    }
  }, [t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);
    try {
      const user = await login(email, password);
      router.push(getDefaultRouteForRole(user.role));
    } catch (err) {
      const code = err instanceof Error ? err.message : 'unexpected_auth_error';

      if (code === 'invalid_auth_response') {
        setError(t('invalidResponse'));
      } else if (code === 'access_forbidden') {
        setError(t('accessForbidden'));
      } else if (code === 'unexpected_auth_error') {
        setError(t('unexpectedError'));
      } else {
        setError(t('invalidCredentials'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-10 sm:px-10">
      <div className="w-full max-w-md mx-auto space-y-6">
        <div className="text-center space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-600">Paw8</p>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            {t('title')}
          </h1>
          <p className="text-sm text-neutral-500">{t('formHint')}</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            {notice && (
              <Alert variant="warning">{notice}</Alert>
            )}

            {error && (
              <Alert variant="destructive">{error}</Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                label={t('emailLabel')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder={t('emailPlaceholder')}
                className="h-10"
              />
              <Input
                type="password"
                label={t('passwordLabel')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder={t('passwordPlaceholder')}
                className="h-10"
              />
              <Button
                type="submit"
                size="lg"
                loading={loading}
                className="w-full"
              >
                {loading ? t('signingIn') : t('loginButton')}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-neutral-500">
          <Link
            href="/"
            className="text-primary-600 hover:underline underline-offset-4"
          >
            {t('backHome')}
          </Link>
        </p>
      </div>
    </div>
  );
}
