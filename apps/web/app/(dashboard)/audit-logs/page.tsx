'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useLocale, useTranslations } from 'next-intl';
import { PageIntro, StatePanel, Surface } from '@/components/page-states';

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  createdAt: string;
  ipAddress: string;
}

interface PagedResult {
  data: AuditLog[];
  total: number;
}

export default function AuditLogsPage() {
  const t = useTranslations('auditLogs');
  const locale = useLocale();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api
      .get<PagedResult>('/audit/logs', { params: { limit: 100 } })
      .then((r) => {
        setLogs(r.data.data ?? (r.data as unknown as AuditLog[]));
        setTotal(r.data.total ?? 0);
      })
      .catch(() => setError(t('loadError')))
      .finally(() => setLoading(false));
  }, [t]);

  return (
    <div className="space-y-6">
      <PageIntro title={t('pageTitle')} description={t('subtitle')} />

      {error ? <StatePanel title={t('pageTitle')} description={error} tone="error" /> : null}

      {loading ? (
        <StatePanel title={t('pageTitle')} description={t('subtitle')} />
      ) : (
        <>
          <p className="text-sm text-slate-500">{t('total', { total })}</p>
          <Surface className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/80">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">{t('tableHeaders.action')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">{t('tableHeaders.entity')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">{t('tableHeaders.entityId')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">{t('tableHeaders.user')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">{t('tableHeaders.ip')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">{t('tableHeaders.time')}</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                {logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-medium text-slate-900">{l.action}</td>
                    <td className="px-4 py-3 text-slate-700">{l.entityType || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{l.entityId || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{l.userId || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{l.ipAddress || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {new Intl.DateTimeFormat(locale, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }).format(new Date(l.createdAt))}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8">
                      <StatePanel
                        title={t('emptyTitle')}
                        description={t('emptyDescription')}
                        tone="warning"
                      />
                    </td>
                  </tr>
                )}
                </tbody>
              </table>
            </div>
          </Surface>
          {logs.length === 0 ? null : (
            <p className="text-xs text-slate-500">{t('subtitle')}</p>
          )}
        </>
      )}
    </div>
  );
}
