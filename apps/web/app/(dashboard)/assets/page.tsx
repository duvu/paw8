'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useTranslations } from 'next-intl';

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
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">{t('pageTitle')}</h1>
        <Link href="/assets/new" className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700">
          {t('addButton')}
        </Link>
      </div>

      <form onSubmit={handleSearch} className="mb-4 flex flex-wrap gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="border border-gray-300 rounded px-3 py-2 text-sm flex-1 min-w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none"
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s || t('allStatus')}</option>)}
        </select>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none"
        >
          {TYPES.map((tp) => <option key={tp} value={tp}>{tp || t('allTypes')}</option>)}
        </select>
        <button type="submit" className="bg-gray-700 text-white px-4 py-2 text-sm rounded hover:bg-gray-800">
          {t('searchButton')}
        </button>
      </form>

      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      {loading ? (
        <p className="text-gray-500">...</p>
      ) : (
        <>
          <p className="text-xs text-gray-500 mb-2">{t('total', { total })}</p>
          <div className="bg-white rounded border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t('tableHeaders.name')}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t('tableHeaders.type')}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t('tableHeaders.brand')}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t('tableHeaders.serialImeiPlate')}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t('tableHeaders.valuation')}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t('tableHeaders.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {assets.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{a.assetName}</td>
                    <td className="px-4 py-3">{a.assetType}</td>
                    <td className="px-4 py-3">{a.brand}</td>
                    <td className="px-4 py-3 text-xs">{a.serialNumber || a.imei || a.licensePlate || '—'}</td>
                    <td className="px-4 py-3">{new Intl.NumberFormat('vi-VN').format(a.valuationAmount)}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{a.status}</span>
                    </td>
                  </tr>
                ))}
                {assets.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">{t('noData')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
