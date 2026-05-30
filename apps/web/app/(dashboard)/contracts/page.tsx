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

interface Contract {
  id: string;
  contractCode: string;
  customerName: string;
  status: string;
  principalAmount: number;
  interestRate: number;
  startDate: string;
  dueDate: string;
  storeName: string;
}

interface PagedResult {
  data: Contract[];
  total: number;
}

const contractStatusVariant = (status: string): 'success' | 'warning' | 'destructive' | 'info' | 'default' => {
  const map: Record<string, 'success' | 'warning' | 'destructive' | 'info' | 'default'> = {
    active: 'success',
    near_due: 'warning',
    overdue: 'destructive',
    settled: 'info',
    cancelled: 'default',
    draft: 'default',
    extended: 'info',
    liquidation_pending: 'warning',
    liquidated: 'default',
  };
  return map[status] ?? 'default';
};

const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const ContractIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    <rect x="9" y="3" width="6" height="4" rx="2" />
    <line x1="9" y1="12" x2="15" y2="12" />
    <line x1="9" y1="16" x2="13" y2="16" />
  </svg>
);

export default function ContractsPage() {
  const t = useTranslations('contracts');
  const router = useRouter();
  const sp = useSearchParams();
  const tab = sp.get('tab') ?? '';
  const [query, setQuery] = useState(sp.get('q') ?? '');
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const TABS = [
    { key: '', label: t('tabs.all') },
    { key: 'near_due', label: t('tabs.upcoming') },
    { key: 'overdue', label: t('tabs.overdue') },
  ];

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = { limit: '50' };
    if (sp.get('q')) params.q = sp.get('q')!;
    if (tab) params.status = tab;
    api
      .get<PagedResult>('/contracts', { params })
      .then((r) => {
        setContracts(r.data.data ?? (r.data as unknown as Contract[]));
        setTotal(r.data.total ?? 0);
      })
      .catch(() => setError(t('loadError')))
      .finally(() => setLoading(false));
  }, [sp, tab, t]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (query) p.set('q', query);
    if (tab) p.set('tab', tab);
    router.push(`/contracts?${p.toString()}`);
  };

  const setTab = (tabKey: string) => {
    const p = new URLSearchParams();
    if (tabKey) p.set('tab', tabKey);
    if (query) p.set('q', query);
    router.push(`/contracts?${p.toString()}`);
  };

  return (
    <div className="space-y-4">
      <PageHeader title={t('pageTitle')} actions={<Link href="/contracts/new"><Button size="sm">{t('addButton')}</Button></Link>} />

      {/* Status filter tabs — horizontally scrollable pill row */}
      <div className="overflow-x-auto">
        <div className="flex gap-1 pb-1 min-w-max">
          {TABS.map((tabItem) => (
            <button
              key={tabItem.key}
              onClick={() => setTab(tabItem.key)}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-150',
                tab === tabItem.key
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800',
              )}
            >
              {tabItem.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
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
                <TableHead>{t('tableHeaders.code')}</TableHead>
                <TableHead>{t('tableHeaders.customer')}</TableHead>
                <TableHead>{t('tableHeaders.status')}</TableHead>
                <TableHead>{t('tableHeaders.principal')}</TableHead>
                <TableHead>{t('tableHeaders.dueDate')}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
              ) : contracts.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState icon={<ContractIcon />} title={t('noData')} />
                  </td>
                </tr>
              ) : (
                contracts.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">{c.contractCode}</TableCell>
                    <TableCell className="font-medium text-neutral-900">{c.customerName}</TableCell>
                    <TableCell>
                      <Badge variant={contractStatusVariant(c.status)}>{c.status}</Badge>
                    </TableCell>
                    <TableCell>{new Intl.NumberFormat('vi-VN').format(c.principalAmount)}</TableCell>
                    <TableCell>{new Date(c.dueDate).toLocaleDateString('vi-VN')}</TableCell>
                    <TableCell>
                      <Link
                        href={`/contracts/${c.id}`}
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
