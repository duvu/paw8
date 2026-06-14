'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import type { PublicListing } from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

interface PublicListingsResponse {
  items: PublicListing[];
  total: number;
}

export default function PublicMarketplacePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tenantCode = searchParams.get('tenant') ?? '';
  const [listings, setListings] = useState<PublicListing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    if (!tenantCode) {
      setLoading(false);
      setError('Vui lòng cung cấp mã tenant trong URL (?tenant=...)');
      return;
    }
    setLoading(true);
    setError('');
    axios
      .get<PublicListingsResponse>(`${API_BASE}/marketplace/public/listings`, {
        params: { tenant: tenantCode, q: q || undefined, page, limit },
      })
      .then((res) => {
        setListings(res.data.items);
        setTotal(res.data.total);
      })
      .catch(() => setError('Không thể tải danh sách tài sản.'))
      .finally(() => setLoading(false));
  }, [tenantCode, q, page]);

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-900">Sàn giao dịch tài sản</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Tài sản thanh lý đang được niêm yết bởi cửa hàng.
          </p>
        </div>

        <div className="mb-6 flex gap-3">
          <input
            type="text"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder="Tìm kiếm tài sản..."
            className="flex-1 rounded-lg border border-neutral-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-52 bg-neutral-100 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20 text-neutral-400">
            <p className="text-lg font-medium">Chưa có tài sản niêm yết</p>
            <p className="text-sm mt-1">Hãy quay lại sau.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((item) => (
              <Link
                key={item.id}
                href={`/market/${item.id}?tenant=${tenantCode}`}
                className="block bg-white rounded-xl border border-neutral-200 overflow-hidden hover:border-primary-300 hover:shadow-sm transition-all"
              >
                {item.photos && item.photos[0] ? (
                  <img
                    src={item.photos[0]}
                    alt={item.title}
                    className="h-40 w-full object-cover"
                  />
                ) : (
                  <div className="h-40 bg-neutral-100 flex items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="M21 15l-5-5L5 21" />
                    </svg>
                  </div>
                )}
                <div className="p-4">
                  <p className="font-semibold text-neutral-900 truncate">{item.title}</p>
                  {item.assetName && (
                    <p className="text-xs text-neutral-500 mt-0.5 truncate">
                      {item.assetType} — {item.brand} {item.model}
                    </p>
                  )}
                  <p className="text-primary-600 font-bold mt-2 text-sm">
                    {Number(item.listingPrice).toLocaleString('vi-VN')} ₫
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && total > limit && (
          <div className="flex items-center justify-between mt-8 text-sm text-neutral-500">
            <span>Tổng: {total} tài sản</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 rounded-lg border border-neutral-200 disabled:opacity-40 hover:bg-neutral-50"
              >
                ← Trước
              </button>
              <button
                disabled={page * limit >= total}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-neutral-200 disabled:opacity-40 hover:bg-neutral-50"
              >
                Sau →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
