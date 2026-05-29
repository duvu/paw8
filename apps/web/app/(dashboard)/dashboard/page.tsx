'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useLocale, useTranslations } from 'next-intl';
import { Alert, Card, CardContent, EmptyState, Skeleton, Spinner } from '@/components/ui';

interface DashboardData {
  activeContracts: number;
  totalOutstandingPrincipal: number;
  disbursedToday: number;
  disbursedThisMonth: number;
  collectedToday: number;
  collectedThisMonth: number;
  interestCollected: number;
  upcomingDueCount: number;
  overdueCount: number;
  assetsInCustody: number;
}

function parseDashboardData(value: unknown): DashboardData {
  if (!value || typeof value !== 'object') {
    throw new Error('invalid_dashboard_response');
  }

  const record = value as Record<string, unknown>;
  const numericKeys = [
    'activeContracts',
    'totalOutstandingPrincipal',
    'disbursedToday',
    'disbursedThisMonth',
    'collectedToday',
    'collectedThisMonth',
    'interestCollected',
    'upcomingDueCount',
    'overdueCount',
    'assetsInCustody',
  ] as const;

  for (const key of numericKeys) {
    if (typeof record[key] !== 'number') {
      throw new Error('invalid_dashboard_response');
    }
  }

  return record as unknown as DashboardData;
}

function fmt(locale: string, value: number): string {
  return new Intl.NumberFormat(locale).format(value);
}

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<DashboardData>('/reports/dashboard')
      .then((r) => setData(parseDashboardData(r.data)))
      .catch((err: unknown) => {
        const code = err instanceof Error ? err.message : 'load_error';
        setError(code === 'invalid_dashboard_response' ? t('invalidData') : t('loadingError'));
      })
      .finally(() => setLoading(false));
  }, [t]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-neutral-900">{t('title')}</h1>
          <p className="text-sm text-neutral-500">{t('subtitle')}</p>
        </div>
        <div className="flex items-center justify-center py-8">
          <Spinner size="lg" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-5 space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-7 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-neutral-900">{t('title')}</h1>
          <p className="text-sm text-neutral-500">{t('subtitle')}</p>
        </div>
        <Alert variant="destructive">{error}</Alert>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-neutral-900">{t('title')}</h1>
          <p className="text-sm text-neutral-500">{t('subtitle')}</p>
        </div>
        <EmptyState title={t('invalidData')} />
      </div>
    );
  }

  const metrics: { label: string; value: string | number }[] = [
    { label: t('totalActiveContracts'), value: fmt(locale, data.activeContracts) },
    { label: t('totalOutstanding'), value: fmt(locale, data.totalOutstandingPrincipal) },
    { label: t('collectedToday'), value: fmt(locale, data.collectedToday) },
    { label: t('interestCollected'), value: fmt(locale, data.interestCollected) },
    { label: t('disbursedToday'), value: fmt(locale, data.disbursedToday) },
    { label: t('disbursedThisMonth'), value: fmt(locale, data.disbursedThisMonth) },
    { label: t('collectedThisMonth'), value: fmt(locale, data.collectedThisMonth) },
    { label: t('upcomingDue'), value: data.upcomingDueCount },
    { label: t('overdueContracts'), value: data.overdueCount },
    { label: t('assetsHeld'), value: data.assetsInCustody },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-neutral-900">{t('title')}</h1>
        <p className="text-sm text-neutral-500">{t('subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="pt-5">
              <p className="text-xs text-neutral-500">{metric.label}</p>
              <p className="mt-1 text-2xl font-bold text-neutral-900">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
