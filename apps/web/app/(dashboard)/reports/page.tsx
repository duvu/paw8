'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useLocale, useTranslations } from 'next-intl';
import { PageIntro, StatePanel, Surface } from '@/components/page-states';
import { canAccessRole } from '@/lib/role-access';
import { useAuth } from '@/contexts/auth';

function formatColumnLabel(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatValue(locale: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'number') return new Intl.NumberFormat(locale).format(value);
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return new Intl.DateTimeFormat(locale).format(new Date(value));
  }
  return String(value);
}

export default function ReportsPage() {
  const t = useTranslations('reports');
  const locale = useLocale();
  const { currentUser } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const tab = sp.get('tab') ?? 'contracts';
  const [data, setData] = useState<Record<string, unknown>[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateFrom, setDateFrom] = useState(sp.get('dateFrom') ?? sp.get('from') ?? '');
  const [dateTo, setDateTo] = useState(sp.get('dateTo') ?? sp.get('to') ?? '');

  const allTabs = [
    { key: 'contracts', label: t('tabs.contracts'), endpoint: '/reports/contracts', roles: ['platform_admin', 'tenant_owner', 'tenant_admin', 'store_manager'] },
    { key: 'collections', label: t('tabs.collections'), endpoint: '/reports/collections', roles: ['platform_admin', 'tenant_owner', 'tenant_admin', 'store_manager', 'accountant'] },
    { key: 'outstanding', label: t('tabs.outstanding'), endpoint: '/reports/outstanding', roles: ['platform_admin', 'tenant_owner', 'tenant_admin', 'store_manager', 'accountant'] },
    { key: 'overdue', label: t('tabs.overdue'), endpoint: '/reports/overdue', roles: ['platform_admin', 'tenant_owner', 'tenant_admin', 'store_manager'] },
    { key: 'stores', label: t('tabs.byStore'), endpoint: '/reports/stores', roles: ['platform_admin', 'tenant_owner', 'tenant_admin'] },
    { key: 'staff', label: t('tabs.byStaff'), endpoint: '/reports/staff', roles: ['platform_admin', 'tenant_owner', 'tenant_admin', 'store_manager'] },
    { key: 'inventory', label: t('tabs.inventory'), endpoint: '/reports/assets/inventory', roles: ['platform_admin', 'tenant_owner', 'tenant_admin', 'store_manager', 'accountant'] },
  ];

  const tabs = allTabs.filter((item) => canAccessRole(currentUser?.role, item.roles));
  const current = tabs.find((tabItem) => tabItem.key === tab) ?? tabs[0];

  useEffect(() => {
    if (!current || current.key === tab) return;

    const params = new URLSearchParams();
    params.set('tab', current.key);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    router.replace(`/reports?${params.toString()}`);
  }, [current, dateFrom, dateTo, router, tab]);

  useEffect(() => {
    if (!current) return;

    setLoading(true);
    setData(null);
    setError('');

    api
      .get(current.endpoint, {
        params: {
          dateFrom: sp.get('dateFrom') || sp.get('from') || undefined,
          dateTo: sp.get('dateTo') || sp.get('to') || undefined,
        },
      })
      .then((r) => {
        const d = r.data;
        setData(Array.isArray(d) ? d : d.data ?? [d]);
      })
      .catch(() => setError(t('loadError')))
      .finally(() => setLoading(false));
  }, [current, sp, t]);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const p = new URLSearchParams();
    p.set('tab', current?.key ?? 'contracts');
    if (dateFrom) p.set('dateFrom', dateFrom);
    if (dateTo) p.set('dateTo', dateTo);
    router.push(`/reports?${p.toString()}`);
  };

  const setTabNav = (tabKey: string) => {
    const p = new URLSearchParams();
    p.set('tab', tabKey);
    if (dateFrom) p.set('dateFrom', dateFrom);
    if (dateTo) p.set('dateTo', dateTo);
    router.push(`/reports?${p.toString()}`);
  };

  const columns = data && data.length > 0 ? Object.keys(data[0]) : [];

  if (!current) {
    return <StatePanel title={t('pageTitle')} description={t('loadError')} tone="warning" />;
  }

  return (
    <div className="space-y-6">
      <PageIntro title={t('pageTitle')} description={t('subtitle')} />

      <div className="flex flex-wrap gap-2">
        {tabs.map((tabItem) => (
          <button
            key={tabItem.key}
            onClick={() => setTabNav(tabItem.key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              current.key === tabItem.key
                ? 'bg-slate-950 text-white shadow-lg shadow-slate-950/10'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-950'
            }`}
          >
            {tabItem.label}
          </button>
        ))}
      </div>

      <Surface className="p-5 sm:p-6">
        <form onSubmit={handleFilter} className="flex flex-wrap gap-4 lg:items-end">
          <div className="min-w-[180px] flex-1">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {t('filterFrom')}
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900"
            />
          </div>
          <div className="min-w-[180px] flex-1">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {t('filterTo')}
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            {t('applyButton')}
          </button>
        </form>
      </Surface>

      {error ? <StatePanel title={t('pageTitle')} description={error} tone="error" /> : null}

      {loading ? (
        <StatePanel title={current.label} description={t('subtitle')} />
      ) : data && data.length > 0 ? (
        <Surface className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80">
                <tr>
                  {columns.map((column) => (
                    <th key={column} className="px-4 py-3 text-left font-semibold text-slate-600">
                      {formatColumnLabel(column)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((row, index) => (
                  <tr key={`${current.key}-${index}`} className="hover:bg-slate-50/70">
                    {columns.map((column) => (
                      <td key={column} className="px-4 py-3 text-slate-700">
                        {formatValue(locale, row[column])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Surface>
      ) : (
        <StatePanel title={t('emptyTitle')} description={t('emptyDescription')} tone="warning" />
      )}
    </div>
  );
}
