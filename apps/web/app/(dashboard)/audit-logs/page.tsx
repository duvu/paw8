'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useLocale, useTranslations } from 'next-intl';
import { Surface } from '@/components/page-states';
import {
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Spinner,
  EmptyState,
  Alert,
  PageHeader
} from '@/components/ui';

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

function actionBadgeVariant(action: string) {
  if (action.startsWith('LOGIN')) return 'info';
  if (action.startsWith('CREATE')) return 'success';
  if (action.startsWith('UPDATE')) return 'warning';
  if (action.startsWith('DELETE') || action.startsWith('VOID') || action.startsWith('CANCEL')) return 'destructive';
  return 'default';
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
      <PageHeader title={t('pageTitle')} subtitle={t('subtitle')} />

      {error && <Alert variant="destructive">{error}</Alert>}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-500">{t('total', { total })}</p>
          <Surface className="overflow-hidden">
            <TableContainer>
              <Table className="min-w-[760px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('tableHeaders.action')}</TableHead>
                    <TableHead>{t('tableHeaders.entity')}</TableHead>
                    <TableHead>{t('tableHeaders.entityId')}</TableHead>
                    <TableHead>{t('tableHeaders.user')}</TableHead>
                    <TableHead>{t('tableHeaders.ip')}</TableHead>
                    <TableHead>{t('tableHeaders.time')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>
                        <Badge variant={actionBadgeVariant(l.action) as 'default' | 'success' | 'warning' | 'destructive' | 'info' | 'outline'}>
                          {l.action}
                        </Badge>
                      </TableCell>
                      <TableCell>{l.entityType || '—'}</TableCell>
                      <TableCell className="font-mono text-xs">{l.entityId || '—'}</TableCell>
                      <TableCell className="font-mono text-xs">{l.userId || '—'}</TableCell>
                      <TableCell className="text-xs">{l.ipAddress || '—'}</TableCell>
                      <TableCell className="text-xs">
                        {new Intl.DateTimeFormat(locale, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        }).format(new Date(l.createdAt))}
                      </TableCell>
                    </TableRow>
                  ))}
                  {logs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <EmptyState
                          title={t('emptyTitle')}
                          description={t('emptyDescription')}
                          className="py-12"
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Surface>
          {logs.length > 0 && (
            <p className="text-xs text-slate-500">{t('subtitle')}</p>
          )}
        </>
      )}
    </div>
  );
}
