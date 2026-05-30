'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useTranslations } from 'next-intl';
import {
  Button,
  Input,
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  SkeletonRow,
  EmptyState,
  Alert,
  PageHeader
} from '@/components/ui';
import { cn } from '@/lib/cn';

interface Customer {
  id: string;
  fullName: string;
  phone: string;
  identityNumber: string;
  status: string;
}

interface PagedResult {
  data: Customer[];
  total: number;
}

const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const UsersIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export default function CustomersPage() {
  const t = useTranslations('customers');
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get('query') ?? searchParams.get('q') ?? '';
  const [query, setQuery] = useState(q);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api
      .get<PagedResult>('/customers', { params: { query: q || undefined, limit: 50 } })
      .then((r) => {
        setCustomers(r.data.data ?? (r.data as unknown as Customer[]));
        setTotal(r.data.total ?? 0);
      })
      .catch(() => setError(t('loadError')))
      .finally(() => setLoading(false));
  }, [q, t]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/customers?query=${encodeURIComponent(query)}`);
  };

  return (
    <div className="space-y-4">
      <PageHeader title={t('pageTitle')} actions={<Link href="/customers/new"><Button size="sm">{t('addButton')}</Button></Link>} />

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          leftIcon={<SearchIcon />}
          containerClassName="flex-1"
        />
        <Button type="submit" variant="secondary">
          {t('searchButton')}
        </Button>
      </form>

      {/* Error */}
      {error && <Alert variant="destructive">{error}</Alert>}

      {/* Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        {!loading && (
          <div className="px-4 py-2.5 border-b border-neutral-100">
            <p className="text-xs text-neutral-500">{t('total', { total })}</p>
          </div>
        )}
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('tableHeaders.name')}</TableHead>
                <TableHead>{t('tableHeaders.phone')}</TableHead>
                <TableHead>{t('tableHeaders.identity')}</TableHead>
                <TableHead>{t('tableHeaders.status')}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState icon={<UsersIcon />} title={t('noData')} />
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium text-neutral-900">{c.fullName}</TableCell>
                    <TableCell>{c.phone}</TableCell>
                    <TableCell className="font-mono text-xs">{c.identityNumber}</TableCell>
                    <TableCell>
                      <Badge variant={c.status === 'active' ? 'success' : 'default'}>
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/customers/${c.id}`}
                        className="text-primary-600 hover:underline text-xs font-medium"
                      >
                        {t('viewButton')}
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    </div>
  );
}
