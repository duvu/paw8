'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useTranslations } from 'next-intl';

interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  status: string;
  role: string;
  createdAt: string;
}

interface PagedResult {
  data: User[];
  total: number;
}

export default function UsersPage() {
  const t = useTranslations('users');
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<PagedResult>('/users', { params: { limit: 100 } })
      .then((r) => {
        setUsers(r.data.data ?? (r.data as unknown as User[]));
        setTotal(r.data.total ?? 0);
      })
      .catch(() => setError(t('loadError')))
      .finally(() => setLoading(false));
  }, [t]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">{t('pageTitle')}</h1>
        <Link href="/users/new" className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700">
          {t('addButton')}
        </Link>
      </div>

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
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t('tableHeaders.email')}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t('tableHeaders.phone')}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t('tableHeaders.role')}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t('tableHeaders.status')}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t('tableHeaders.created')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{u.fullName}</td>
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3">{u.phone}</td>
                    <td className="px-4 py-3">{u.role}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                  </tr>
                ))}
                {users.length === 0 && (
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
