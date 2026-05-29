'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useTranslations } from 'next-intl';

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
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">{t('pageTitle')}</h1>
        <Link
          href="/customers/new"
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700"
        >
          {t('addButton')}
        </Link>
      </div>

      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="border border-gray-300 rounded px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-gray-700 text-white px-4 py-2 text-sm rounded hover:bg-gray-800"
        >
          {t('searchButton')}
        </button>
      </form>

      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      {loading ? (
        <p className="text-gray-500">{t('searchButton')}...</p>
      ) : (
        <>
          <p className="text-xs text-gray-500 mb-2">{t('total', { total })}</p>
          <div className="bg-white rounded border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t('tableHeaders.name')}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t('tableHeaders.phone')}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t('tableHeaders.identity')}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t('tableHeaders.status')}</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{c.fullName}</td>
                    <td className="px-4 py-3">{c.phone}</td>
                    <td className="px-4 py-3">{c.identityNumber}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/customers/${c.id}`} className="text-blue-600 hover:underline text-xs">
                        {t('viewButton')}
                      </Link>
                    </td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-gray-400">{t('noData')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
