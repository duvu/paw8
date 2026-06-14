'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { marketplaceApi, type MarketplaceListing, type BuyerInquiry } from '@/lib/api';
import {
  Button,
  Badge,
  Alert,
  PageHeader,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  SkeletonRow,
} from '@/components/ui';

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

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [inquiries, setInquiries] = useState<BuyerInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      marketplaceApi.getListing(params.id),
      marketplaceApi.getInquiries(params.id),
    ])
      .then(([listingRes, inquiriesRes]) => {
        setListing(listingRes.data);
        setInquiries(inquiriesRes.data);
      })
      .catch(() => setError('Không thể tải thông tin niêm yết.'))
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleAction = async (action: 'publish' | 'cancel') => {
    if (!listing) return;
    setActionLoading(action);
    setError('');
    try {
      const res = action === 'publish'
        ? await marketplaceApi.publishListing(listing.id)
        : await marketplaceApi.cancelListing(listing.id);
      setListing(res.data);
    } catch {
      setError(action === 'publish' ? 'Không thể đăng niêm yết.' : 'Không thể hủy niêm yết.');
    } finally {
      setActionLoading('');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-neutral-100 animate-pulse rounded w-48" />
        <div className="h-32 bg-neutral-100 animate-pulse rounded" />
      </div>
    );
  }

  if (error && !listing) {
    return <Alert variant="destructive">{error}</Alert>;
  }

  if (!listing) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={listing.title}
        subtitle={
          <Badge variant={statusVariant(listing.status)}>
            {statusLabel[listing.status] ?? listing.status}
          </Badge>
        }
        actions={
          <div className="flex gap-2">
            {listing.status === 'draft' && (
              <Button
                size="sm"
                onClick={() => handleAction('publish')}
                disabled={actionLoading === 'publish'}
              >
                {actionLoading === 'publish' ? 'Đang đăng...' : 'Đăng niêm yết'}
              </Button>
            )}
            {listing.status === 'active' && (
              <>
                <Link href={`/marketplace/${listing.id}/sell`}>
                  <Button size="sm">Xác nhận bán</Button>
                </Link>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction('cancel')}
                  disabled={actionLoading === 'cancel'}
                >
                  {actionLoading === 'cancel' ? 'Đang hủy...' : 'Hủy niêm yết'}
                </Button>
              </>
            )}
          </div>
        }
      />

      {error && <Alert variant="destructive">{error}</Alert>}

      <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-3">
        <h3 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">Thông tin niêm yết</h3>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <dt className="text-neutral-500">Giá niêm yết</dt>
            <dd className="font-semibold text-neutral-900">{Number(listing.listingPrice).toLocaleString('vi-VN')} ₫</dd>
          </div>
          {listing.soldPrice && (
            <div>
              <dt className="text-neutral-500">Giá bán thực tế</dt>
              <dd className="font-semibold text-neutral-900">{Number(listing.soldPrice).toLocaleString('vi-VN')} ₫</dd>
            </div>
          )}
          {listing.buyerName && (
            <div>
              <dt className="text-neutral-500">Người mua</dt>
              <dd>{listing.buyerName} — {listing.buyerPhone}</dd>
            </div>
          )}
          {listing.soldAt && (
            <div>
              <dt className="text-neutral-500">Ngày bán</dt>
              <dd>{new Date(listing.soldAt).toLocaleDateString('vi-VN')}</dd>
            </div>
          )}
          <div>
            <dt className="text-neutral-500">Ngày tạo</dt>
            <dd>{new Date(listing.createdAt).toLocaleDateString('vi-VN')}</dd>
          </div>
        </dl>
        {listing.description && (
          <p className="text-sm text-neutral-600 pt-1">{listing.description}</p>
        )}
        {listing.photos && listing.photos.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {listing.photos.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                <img src={url} alt={`Ảnh ${i + 1}`} className="h-20 w-20 object-cover rounded-lg border border-neutral-200" />
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">
          Yêu cầu từ khách hàng ({inquiries.length})
        </h3>
        {inquiries.length === 0 ? (
          <p className="text-sm text-neutral-400">Chưa có yêu cầu nào.</p>
        ) : (
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>SĐT</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tin nhắn</TableHead>
                  <TableHead>Thời gian</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inquiries.map((inq) => (
                  <TableRow key={inq.id}>
                    <TableCell className="font-medium">{inq.buyerName}</TableCell>
                    <TableCell>{inq.buyerPhone}</TableCell>
                    <TableCell>{inq.buyerEmail ?? '—'}</TableCell>
                    <TableCell className="max-w-xs truncate">{inq.message}</TableCell>
                    <TableCell>{new Date(inq.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </div>
    </div>
  );
}
