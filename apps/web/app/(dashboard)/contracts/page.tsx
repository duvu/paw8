'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useTranslations } from 'next-intl';

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
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">{t('pageTitle')}</h1>
        <Link href="/contracts/new" className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700">
          {t('addButton')}
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        {TABS.map((tabItem) => (
          <button
            key={tabItem.key}
            onClick={() => setTab(tabItem.key)}
            className={`px-4 py-2 text-sm border-b-2 -mb-px ${tab === tabItem.key ? 'border-blue-600 text-blue-600 font-medium' : 'border-transparent text-gray-600 hover:text-gray-800'}`}
          >
            {tabItem.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="border border-gray-300 rounded px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
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
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t('tableHeaders.code')}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t('tableHeaders.customer')}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t('tableHeaders.status')}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t('tableHeaders.principal')}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t('tableHeaders.dueDate')}</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {contracts.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{c.contractCode}</td>
                    <td className="px-4 py-3">{c.customerName}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3">{new Intl.NumberFormat('vi-VN').format(c.principalAmount)}</td>
                    <td className="px-4 py-3">{new Date(c.dueDate).toLocaleDateString('vi-VN')}</td>
                    <td className="px-4 py-3">
                      <Link href={`/contracts/${c.id}`} className="text-blue-600 hover:underline text-xs">{t('viewButton')}</Link>
                    </td>
                  </tr>
                ))}
                {contracts.length === 0 && (
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

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    near_due: 'bg-yellow-100 text-yellow-700',
    overdue: 'bg-red-100 text-red-700',
    settled: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-gray-100 text-gray-500',
    draft: 'bg-gray-100 text-gray-500',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs ${colors[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}
