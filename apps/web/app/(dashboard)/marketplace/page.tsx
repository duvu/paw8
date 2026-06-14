'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { marketplaceApi, type MarketplaceListing } from '@/lib/api';
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
  SkeletonRow,
  EmptyState,
  Alert,
  PageHeader,
} from '@/components/ui';
import { cn } from '@/lib/cn';

const statusVariant = (status: string): 'success' | 'warning' | 'destructive' | 'default' => {
  const map: Record<string, 'success' | 'warning' | 'destructive' | 'default'> = {
    active: 'success',
    draft: 'default',
    sold: 'warning',
    cancelled: 'destructive',
  };
  return map[status] ?? 'default';
};

const statusLabel: Record<string, string> = {
  active: 'Đang bán',
  draft: 'Nháp',
  sold: 'Đã bán',
  cancelled: 'Đã hủy',
};

const TABS = [
  { key: '', label: 'Tất cả' },
  { key: 'active', label: 'Đang bán' },
  { key: 'draft', label: 'Nháp' },
  { key: 'sold', label: 'Đã bán' },
  { key: 'cancelled', label: 'Đã hủy' },
];

export default function MarketplacePage() {
  const searchParams = useSearchParams();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(searchParams.get('status') ?? '');
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    setLoading(true);
    setError('');
    marketplaceApi
      .getListings({ status: activeTab || undefined, page, limit })
      .then((res) => {
        setListings(res.data.items);
        setTotal(res.data.total);
      })
      .catch(() => setError('Không thể tải danh sách.'))
      .finally(() => setLoading(false));
  }, [activeTab, page]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sàn giao dịch"
        subtitle="Quản lý tài sản thanh lý đang niêm yết và lịch sử bán."
        actions={
          <Link href="/marketplace/new">
            <Button size="sm">+ Niêm yết mới</Button>
          </Link>
        }
      />

      {error && <Alert variant="destructive">{error}</Alert>}

      <div className="flex gap-1 border-b border-neutral-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setPage(1); }}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors',
              activeTab === tab.key
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-neutral-500 hover:text-neutral-700',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <TableContainer>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tiêu đề</TableHead>
              <TableHead>Giá niêm yết</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
            ) : listings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <EmptyState
                    title="Chưa có niêm yết"
                    description="Tạo niêm yết đầu tiên để bắt đầu."
                  />
                </TableCell>
              </TableRow>
            ) : (
              listings.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.title}</TableCell>
                  <TableCell>{Number(l.listingPrice).toLocaleString('vi-VN')} ₫</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(l.status)}>
                      {statusLabel[l.status] ?? l.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(l.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                  <TableCell>
                    <Link href={`/marketplace/${l.id}`}>
                      <Button variant="ghost" size="sm">Xem</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {!loading && total > limit && (
        <div className="flex items-center justify-between text-sm text-neutral-500">
          <span>Tổng: {total}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              ← Trước
            </Button>
            <Button variant="outline" size="sm" disabled={page * limit >= total} onClick={() => setPage(p => p + 1)}>
              Sau →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
