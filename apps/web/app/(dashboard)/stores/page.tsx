'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useTranslations } from 'next-intl';
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

interface Store {
  id: string;
  name: string;
  address: string;
  phone: string;
  status: string;
  createdAt: string;
}

interface PagedResult {
  data: Store[];
  total: number;
}

export default function StoresPage() {
  const t = useTranslations('stores');
  const [stores, setStores] = useState<Store[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<PagedResult>('/stores', { params: { limit: 100 } })
      .then((r) => {
        setStores(r.data.data ?? (r.data as unknown as Store[]));
        setTotal(r.data.total ?? 0);
      })
      .catch(() => setError(t('loadError')))
      .finally(() => setLoading(false));
  }, [t]);

  return (
    <div className="space-y-4">
      <PageHeader title={t('pageTitle')} />

      {error && <Alert variant="destructive">{error}</Alert>}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          <p className="text-xs text-neutral-500">{t('total', { total })}</p>
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
            <TableContainer>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('tableHeaders.name')}</TableHead>
                    <TableHead>{t('tableHeaders.address')}</TableHead>
                    <TableHead>{t('tableHeaders.phone')}</TableHead>
                    <TableHead>{t('tableHeaders.status')}</TableHead>
                    <TableHead>{t('tableHeaders.created')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stores.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.address}</TableCell>
                      <TableCell>{s.phone}</TableCell>
                      <TableCell>
                        <Badge variant={s.status === 'active' ? 'success' : 'default'}>
                          {s.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{new Date(s.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                    </TableRow>
                  ))}
                  {stores.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <EmptyState title={t('noData')} className="py-12" />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        </>
      )}
    </div>
  );
}
