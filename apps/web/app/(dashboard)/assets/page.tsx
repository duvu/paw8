'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useTranslations } from 'next-intl';
import {
  Button,
  Input,
  Select,
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
} from '@/components/ui';
import { cn } from '@/lib/cn';

interface Asset {
  id: string;
  assetName: string;
  assetType: string;
  brand: string;
  serialNumber: string;
  imei: string;
  licensePlate: string;
  status: string;
  valuationAmount: number;
}

interface PagedResult {
  data: Asset[];
  total: number;
}

const STATUSES = ['', 'pawned', 'redeemed', 'overdue', 'pending_liquidation', 'liquidated'];
const TYPES = ['', 'motorbike', 'car', 'phone', 'laptop', 'watch', 'jewelry', 'electronics', 'other'];

const assetStatusVariant = (status: string): 'success' | 'warning' | 'destructive' | 'info' | 'default' => {
  const map: Record<string, 'success' | 'warning' | 'destructive' | 'info' | 'default'> = {
    pawned: 'info',
    redeemed: 'success',
    overdue: 'destructive',
    pending_liquidation: 'warning',
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

const BoxIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

export default function AssetsPage() {
  const t = useTranslations('assets');
  const router = useRouter();
  const sp = useSearchParams();
  const [query, setQuery] = useState(sp.get('q') ?? '');
  const [status, setStatus] = useState(sp.get('status') ?? '');
  const [type, setType] = useState(sp.get('type') ?? '');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api
      .get<PagedResult>('/assets', {
        params: {
          q: sp.get('q') || undefined,
          status: sp.get('status') || undefined,
          assetType: sp.get('type') || undefined,
          limit: 50,
        },
      })
      .then((r) => {
        setAssets(r.data.data ?? (r.data as unknown as Asset[]));
        setTotal(r.data.total ?? 0);
      })
      .catch(() => setError(t('loadError')))
      .finally(() => setLoading(false));
  }, [sp, t]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (status) params.set('status', status);
    if (type) params.set('type', type);
    router.push(`/assets?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">{t('pageTitle')}</h1>
        <Link
          href="/assets/new"
          className={cn(
            'inline-flex items-center justify-center font-medium whitespace-nowrap h-9 px-4 text-sm rounded-lg',
            'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-sm transition-all duration-150',
          )}
        >
          {t('addButton')}
        </Link>
      </div>

      {/* Filter row */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          leftIcon={<SearchIcon />}
          containerClassName="flex-1"
        />
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="sm:w-44"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s || t('allStatus')}</option>
          ))}
        </Select>
        <Select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="sm:w-44"
        >
          {TYPES.map((tp) => (
            <option key={tp} value={tp}>{tp || t('allTypes')}</option>
          ))}
        </Select>
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
                <TableHead>{t('tableHeaders.type')}</TableHead>
                <TableHead>{t('tableHeaders.brand')}</TableHead>
                <TableHead>{t('tableHeaders.serialImeiPlate')}</TableHead>
                <TableHead>{t('tableHeaders.valuation')}</TableHead>
                <TableHead>{t('tableHeaders.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState icon={<BoxIcon />} title={t('noData')} />
                  </td>
                </tr>
              ) : (
                assets.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium text-neutral-900">{a.assetName}</TableCell>
                    <TableCell>{a.assetType}</TableCell>
                    <TableCell>{a.brand}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {a.serialNumber || a.imei || a.licensePlate || '—'}
                    </TableCell>
                    <TableCell>{new Intl.NumberFormat('vi-VN').format(a.valuationAmount)}</TableCell>
                    <TableCell>
                      <Badge variant={assetStatusVariant(a.status)}>{a.status}</Badge>
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
