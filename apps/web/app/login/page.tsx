'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getDefaultRouteForRole } from '@/lib/role-access';
import { useAuth } from '@/contexts/auth';
import { useTranslations } from 'next-intl';
import { clearSessionNotice, getSessionNotice } from '@/lib/auth-storage';

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
    <div className="min-h-screen px-6 py-10 sm:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <section className="space-y-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 shadow-sm hover:text-slate-950"
          >
            {t('backHome')}
          </Link>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-indigo-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {t('secureNotice')}
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                {t('welcomeBack')}
              </h1>
              <p className="max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                {t('subtitle')}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-[0_24px_70px_-46px_rgba(15,23,42,0.45)]">
              <h2 className="text-base font-semibold text-slate-950">{t('helperTitle')}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{t('helperDescription')}</p>
            </div>
            <div className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-[0_24px_70px_-46px_rgba(15,23,42,0.45)]">
              <h2 className="text-base font-semibold text-slate-950">{t('supportTitle')}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{t('supportDescription')}</p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/85 bg-white/92 p-8 shadow-[0_40px_120px_-64px_rgba(15,23,42,0.55)] sm:p-10">
          <div className="space-y-6">
            <div className="space-y-2 text-center sm:text-left">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-indigo-600">Paw8</p>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{t('title')}</h2>
              <p className="text-sm leading-6 text-slate-500">{t('formHint')}</p>
            </div>

            {notice ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {notice}
              </div>
            ) : null}

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">{t('emailLabel')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder={t('emailPlaceholder')}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">{t('passwordLabel')}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder={t('passwordPlaceholder')}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? t('signingIn') : t('loginButton')}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
