'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useTranslations } from 'next-intl';
import {
  Button,
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

interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  status: string;
  role: string;
  createdAt: string;
}

interface PagedResult {
  data: User[];
  total: number;
}

function roleBadgeVariant(role: string) {
  if (role === 'platform_admin') return 'destructive';
  if (role === 'tenant_owner' || role === 'tenant_admin') return 'info';
  if (role === 'store_manager') return 'warning';
  return 'default';
}

export default function UsersPage() {
  const t = useTranslations('users');
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<PagedResult>('/users', { params: { limit: 100 } })
      .then((r) => {
        setUsers(r.data.data ?? (r.data as unknown as User[]));
        setTotal(r.data.total ?? 0);
      })
      .catch(() => setError(t('loadError')))
      .finally(() => setLoading(false));
  }, [t]);

  return (
    <div className="space-y-4">
      <PageHeader title={t('pageTitle')} actions={<Link href="/users/new"><Button size="sm">{t('addButton')}</Button></Link>} />

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
                    <TableHead>{t('tableHeaders.email')}</TableHead>
                    <TableHead>{t('tableHeaders.phone')}</TableHead>
                    <TableHead>{t('tableHeaders.role')}</TableHead>
                    <TableHead>{t('tableHeaders.status')}</TableHead>
                    <TableHead>{t('tableHeaders.created')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.fullName}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.phone}</TableCell>
                      <TableCell>
                        <Badge variant={roleBadgeVariant(u.role) as 'default' | 'success' | 'warning' | 'destructive' | 'info' | 'outline'}>
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.status === 'active' ? 'success' : 'default'}>
                          {u.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(u.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                    </TableRow>
                  ))}
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6}>
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
