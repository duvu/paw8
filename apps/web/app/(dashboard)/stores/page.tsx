'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useTranslations } from 'next-intl';

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
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-4">{t('pageTitle')}</h1>
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
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t('tableHeaders.address')}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t('tableHeaders.phone')}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t('tableHeaders.status')}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t('tableHeaders.created')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stores.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3">{s.address}</td>
                    <td className="px-4 py-3">{s.phone}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">{new Date(s.createdAt).toLocaleDateString('vi-VN')}</td>
                  </tr>
                ))}
                {stores.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">{t('noData')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
