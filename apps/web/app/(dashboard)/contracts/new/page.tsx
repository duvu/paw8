'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { useTranslations } from 'next-intl';

interface Customer { id: string; fullName: string; phone: string; identityNumber: string; }
interface Asset { id: string; assetName: string; assetType: string; brand: string; valuationAmount: number; }

interface LoanTerms {
  principalAmount: string;
  interestRate: string;
  interestType: string;
  startDate: string;
  dueDate: string;
  notes: string;
  assetIds: string[];
}

const INTEREST_TYPES = ['daily', 'monthly', 'periodic'];

export default function NewContractPage() {
  const t = useTranslations('contracts');
  const router = useRouter();
  const sp = useSearchParams();
  const preCustomerId = sp.get('customerId') ?? '';

  const [step, setStep] = useState<1 | 2 | 3>(preCustomerId ? 2 : 1);
  const [customerId, setCustomerId] = useState(preCustomerId);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [assetSearch, setAssetSearch] = useState('');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);

  const [terms, setTerms] = useState<LoanTerms>({
    principalAmount: '',
    interestRate: '',
    interestType: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    notes: '',
    assetIds: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load pre-selected customer
  useEffect(() => {
    if (preCustomerId) {
      api.get<Customer>(`/customers/${preCustomerId}`).then((r) => setSelectedCustomer(r.data)).catch(() => {});
    }
  }, [preCustomerId]);

  const searchCustomers = async () => {
    if (!customerSearch.trim()) return;
    const r = await api.get<{ data: Customer[] }>('/customers', { params: { q: customerSearch, limit: 20 } });
    setCustomers(r.data.data ?? []);
  };

  const searchAssets = async () => {
    const r = await api.get<{ data: Asset[] }>('/assets', { params: { q: assetSearch || undefined, status: 'available', limit: 20 } });
    setAssets(r.data.data ?? []);
  };

  useEffect(() => {
    if (step === 2) searchAssets();
  }, [step]);

  const toggleAsset = (id: string) => {
    setSelectedAssetIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!customerId) return setError(t('pleaseSelectCustomer'));
    setError('');
    setLoading(true);
    try {
      await api.post('/contracts', {
        customerId,
        assetIds: selectedAssetIds,
        principalAmount: Number(terms.principalAmount),
        interestRate: Number(terms.interestRate),
        interestType: terms.interestType,
        startDate: terms.startDate,
        dueDate: terms.dueDate,
        notes: terms.notes,
      });
      router.push('/contracts');
    } catch {
      setError(t('createError'));
    } finally {
      setLoading(false);
    }
  };

  const STEPS = [t('steps.customer'), t('steps.assets'), t('steps.loanTerms')];

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-gray-800 mb-6">{t('newTitle')}</h1>

      {/* Step Indicator */}
      <div className="flex gap-4 mb-6">
        {STEPS.map((s, i) => {
          const n = (i + 1) as 1 | 2 | 3;
          return (
            <div key={s} className={`text-sm px-3 py-1 rounded ${step === n ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{s}</div>
          );
        })}
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>}

      {/* Step 1 — Customer */}
      {step === 1 && (
        <div className="bg-white rounded border border-gray-200 p-6 space-y-4">
          <div className="flex gap-2">
            <input
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchCustomers()}
              placeholder={t('form.searchCustomerPlaceholder')}
              className="border border-gray-300 rounded px-3 py-2 text-sm flex-1 focus:outline-none"
            />
            <button onClick={searchCustomers} className="bg-gray-700 text-white px-4 py-2 text-sm rounded hover:bg-gray-800">{t('searchButton')}</button>
          </div>
          <div className="divide-y divide-gray-100">
            {customers.map((c) => (
              <div
                key={c.id}
                onClick={() => { setSelectedCustomer(c); setCustomerId(c.id); }}
                className={`px-3 py-2 cursor-pointer hover:bg-blue-50 text-sm ${customerId === c.id ? 'bg-blue-50 font-medium' : ''}`}
              >
                {c.fullName} — {c.phone} — {c.identityNumber}
              </div>
            ))}
          </div>
          {selectedCustomer && (
            <p className="text-sm text-green-700 bg-green-50 p-2 rounded">{t('form.selected', { name: selectedCustomer.fullName })}</p>
          )}
          <div className="flex gap-3">
            <button
              disabled={!customerId}
              onClick={() => setStep(2)}
              className="bg-blue-600 text-white px-6 py-2 rounded text-sm disabled:opacity-50"
            >
              {t('next')}
            </button>
          </div>
        </div>
      )}

      {/* Step 2 — Assets */}
      {step === 2 && (
        <div className="bg-white rounded border border-gray-200 p-6 space-y-4">
          <p className="text-sm text-gray-600">{t('form.selectAssets')}</p>
          <div className="flex gap-2">
            <input
              value={assetSearch}
              onChange={(e) => setAssetSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchAssets()}
              placeholder={t('form.searchAssetsPlaceholder')}
              className="border border-gray-300 rounded px-3 py-2 text-sm flex-1 focus:outline-none"
            />
            <button onClick={searchAssets} className="bg-gray-700 text-white px-4 py-2 text-sm rounded hover:bg-gray-800">{t('searchButton')}</button>
          </div>
          <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
            {assets.map((a) => (
              <div
                key={a.id}
                onClick={() => toggleAsset(a.id)}
                className={`px-3 py-2 cursor-pointer hover:bg-blue-50 text-sm flex items-center gap-2 ${selectedAssetIds.includes(a.id) ? 'bg-blue-50' : ''}`}
              >
                <input type="checkbox" checked={selectedAssetIds.includes(a.id)} readOnly />
                {a.assetName} — {a.assetType} — {a.brand} — {new Intl.NumberFormat('vi-VN').format(a.valuationAmount)} VND
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="border border-gray-300 text-gray-700 px-6 py-2 rounded text-sm hover:bg-gray-50">{t('back')}</button>
            <button onClick={() => setStep(3)} className="bg-blue-600 text-white px-6 py-2 rounded text-sm">{t('next')}</button>
          </div>
        </div>
      )}

      {/* Step 3 — Loan Terms */}
      {step === 3 && (
        <div className="bg-white rounded border border-gray-200 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block font-medium text-gray-700 mb-1">{t('form.principalAmount')}</label>
              <input type="number" value={terms.principalAmount} onChange={(e) => setTerms((prev) => ({ ...prev, principalAmount: e.target.value }))} required
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none" />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">{t('form.interestRate')}</label>
              <input type="number" step="0.01" value={terms.interestRate} onChange={(e) => setTerms((prev) => ({ ...prev, interestRate: e.target.value }))} required
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none" />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">{t('form.interestType')}</label>
              <select value={terms.interestType} onChange={(e) => setTerms((prev) => ({ ...prev, interestType: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none">
                {INTEREST_TYPES.map((x) => <option key={x} value={x}>{t(`interestType.${x}` as 'interestType.daily' | 'interestType.monthly' | 'interestType.periodic')}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">{t('form.startDate')}</label>
              <input type="date" value={terms.startDate} onChange={(e) => setTerms((prev) => ({ ...prev, startDate: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none" />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">{t('form.dueDate')}</label>
              <input type="date" value={terms.dueDate} onChange={(e) => setTerms((prev) => ({ ...prev, dueDate: e.target.value }))} required
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.notes')}</label>
            <textarea value={terms.notes} onChange={(e) => setTerms((prev) => ({ ...prev, notes: e.target.value }))} rows={2}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="border border-gray-300 text-gray-700 px-6 py-2 rounded text-sm hover:bg-gray-50">{t('back')}</button>
            <button
              onClick={handleSubmit}
              disabled={loading || !terms.principalAmount || !terms.dueDate}
              className="bg-blue-600 text-white px-6 py-2 rounded text-sm disabled:opacity-50"
            >
              {loading ? t('creating') : t('createButton')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
