'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useTranslations } from 'next-intl';

interface Customer {
  id: string;
  fullName: string;
  phone: string;
  identityNumber: string;
  dateOfBirth: string;
  permanentAddress: string;
  currentAddress: string;
  occupation: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  notes: string;
  status: string;
  createdAt: string;
}

interface Contract {
  id: string;
  contractCode: string;
  status: string;
  principalAmount: number;
  startDate: string;
  dueDate: string;
}

interface Document {
  id: string;
  originalFilename: string;
  entityType: string;
  createdAt: string;
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations('customers');
  const [id, setId] = useState('');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get<Customer>(`/customers/${id}`),
      api.get<{ data: Contract[] }>(`/contracts?customerId=${id}&limit=50`),
      api.get<{ data: Document[] }>(`/files?entityType=customer&entityId=${id}`),
    ])
      .then(([c, ct, d]) => {
        setCustomer(c.data);
        setContracts(ct.data.data ?? []);
        setDocuments(d.data.data ?? []);
      })
      .catch(() => setError(t('detailLoadError')))
      .finally(() => setLoading(false));
  }, [id, t]);

  if (loading) return <p className="text-gray-500">...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!customer) return null;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">{customer.fullName}</h1>
        <span className={`px-2 py-1 rounded text-xs ${customer.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
          {customer.status}
        </span>
      </div>

      {/* Info */}
      <div className="bg-white rounded border border-gray-200 p-4 grid grid-cols-2 gap-3 text-sm">
        <Row label={t('fieldLabels.phone')} value={customer.phone} />
        <Row label={t('fieldLabels.identityNo')} value={customer.identityNumber} />
        <Row label={t('fieldLabels.dateOfBirth')} value={customer.dateOfBirth} />
        <Row label={t('fieldLabels.occupation')} value={customer.occupation} />
        <Row label={t('fieldLabels.emergencyContact')} value={`${customer.emergencyContactName} — ${customer.emergencyContactPhone}`} />
        <Row label={t('fieldLabels.permanentAddress')} value={customer.permanentAddress} />
        <Row label={t('fieldLabels.currentAddress')} value={customer.currentAddress} />
        {customer.notes && <Row label={t('fieldLabels.notes')} value={customer.notes} />}
        <Row label={t('fieldLabels.created')} value={new Date(customer.createdAt).toLocaleDateString('vi-VN')} />
      </div>

      {/* Contracts */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-gray-700">{t('contracts')}</h2>
          <Link href={`/contracts/new?customerId=${customer.id}`} className="text-xs text-blue-600 hover:underline">
            {t('newContract')}
          </Link>
        </div>
        <div className="bg-white rounded border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-600">{t('contractHeaders.code')}</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">{t('contractHeaders.status')}</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">{t('contractHeaders.principal')}</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">{t('contractHeaders.dueDate')}</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {contracts.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono text-xs">{c.contractCode}</td>
                  <td className="px-4 py-2">{c.status}</td>
                  <td className="px-4 py-2">{new Intl.NumberFormat('vi-VN').format(c.principalAmount)}</td>
                  <td className="px-4 py-2">{new Date(c.dueDate).toLocaleDateString('vi-VN')}</td>
                  <td className="px-4 py-2">
                    <Link href={`/contracts/${c.id}`} className="text-blue-600 hover:underline text-xs">{t('viewButton')}</Link>
                  </td>
                </tr>
              ))}
              {contracts.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-4 text-center text-gray-400">{t('noContracts')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Documents */}
      <section>
        <h2 className="font-semibold text-gray-700 mb-2">{t('documents')}</h2>
        <ul className="bg-white rounded border border-gray-200 divide-y divide-gray-100">
          {documents.map((d) => (
            <li key={d.id} className="px-4 py-2 text-sm flex items-center justify-between">
              <span>{d.originalFilename}</span>
              <span className="text-xs text-gray-400">{new Date(d.createdAt).toLocaleDateString('vi-VN')}</span>
            </li>
          ))}
          {documents.length === 0 && <li className="px-4 py-4 text-center text-gray-400 text-sm">{t('noDocuments')}</li>}
        </ul>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-gray-500">{label}: </span>
      <span className="text-gray-800">{value}</span>
    </div>
  );
}
