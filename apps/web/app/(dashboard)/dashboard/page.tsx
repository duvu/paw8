'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useLocale, useTranslations } from 'next-intl';
import { MetricTile, PageIntro, StatePanel } from '@/components/page-states';

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
      <StatePanel title={t('title')} description={t('subtitle')} />
    );
  }

  if (error) {
    return <StatePanel title={t('title')} description={error} tone="error" />;
  }

  if (!data) return <StatePanel title={t('title')} description={t('invalidData')} tone="warning" />;

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow={t('eyebrow')}
        title={t('title')}
        description={t('subtitle')}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile label={t('totalActiveContracts')} value={fmt(locale, data.activeContracts)} />
        <MetricTile label={t('totalOutstanding')} value={fmt(locale, data.totalOutstandingPrincipal)} />
        <MetricTile label={t('collectedToday')} value={fmt(locale, data.collectedToday)} />
        <MetricTile label={t('interestCollected')} value={fmt(locale, data.interestCollected)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricTile label={t('disbursedToday')} value={fmt(locale, data.disbursedToday)} />
        <MetricTile label={t('disbursedThisMonth')} value={fmt(locale, data.disbursedThisMonth)} />
        <MetricTile label={t('collectedThisMonth')} value={fmt(locale, data.collectedThisMonth)} />
        <MetricTile label={t('upcomingDue')} value={data.upcomingDueCount} />
        <MetricTile label={t('overdueContracts')} value={data.overdueCount} />
        <MetricTile label={t('assetsHeld')} value={data.assetsInCustody} />
      </div>
    </div>
  );
}
