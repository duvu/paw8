'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';
import {
  Button,
  Input,
  Select,
  Card,
  CardContent,
  Alert,
} from '@/components/ui';

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
      <h1 className="text-xl font-bold text-neutral-900 mb-6">{t('newTitle')}</h1>

      {/* Step Indicator */}
      <div className="flex gap-2 mb-6">
        {STEPS.map((s, i) => {
          const n = (i + 1) as 1 | 2 | 3;
          return (
            <div
              key={s}
              className={cn(
                'flex items-center gap-2 text-sm px-4 py-1.5 rounded-full font-medium transition-colors',
                step === n
                  ? 'bg-primary-600 text-white shadow-sm'
                  : step > n
                  ? 'bg-success-100 text-success-700'
                  : 'bg-neutral-100 text-neutral-500',
              )}
            >
              <span className={cn(
                'inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold',
                step === n ? 'bg-white/20' : step > n ? 'bg-success-200' : 'bg-neutral-200',
              )}>
                {i + 1}
              </span>
              {s}
            </div>
          );
        })}
      </div>

      {error && <Alert variant="destructive" className="mb-4">{error}</Alert>}

      {/* Step 1 — Customer */}
      {step === 1 && (
        <Card>
          <CardContent className="pt-5 space-y-4">
            <div className="flex gap-2">
              <Input
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchCustomers()}
                placeholder={t('form.searchCustomerPlaceholder')}
                className="flex-1"
              />
              <Button variant="secondary" onClick={searchCustomers}>{t('searchButton')}</Button>
            </div>
            <div className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 overflow-hidden">
              {customers.map((c) => (
                <div
                  key={c.id}
                  onClick={() => { setSelectedCustomer(c); setCustomerId(c.id); }}
                  className={cn(
                    'px-3 py-2.5 cursor-pointer hover:bg-primary-50 text-sm transition-colors',
                    customerId === c.id ? 'bg-primary-50 font-medium text-primary-700' : 'text-neutral-700',
                  )}
                >
                  {c.fullName} — {c.phone} — {c.identityNumber}
                </div>
              ))}
              {customers.length === 0 && (
                <div className="px-3 py-4 text-sm text-neutral-400 text-center">
                  {t('form.searchCustomerPlaceholder')}
                </div>
              )}
            </div>
            {selectedCustomer && (
              <Alert variant="success">{t('form.selected', { name: selectedCustomer.fullName })}</Alert>
            )}
            <div className="flex gap-3 pt-1">
              <Button
                disabled={!customerId}
                onClick={() => setStep(2)}
              >
                {t('next')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2 — Assets */}
      {step === 2 && (
        <Card>
          <CardContent className="pt-5 space-y-4">
            <p className="text-sm text-neutral-600">{t('form.selectAssets')}</p>
            <div className="flex gap-2">
              <Input
                value={assetSearch}
                onChange={(e) => setAssetSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchAssets()}
                placeholder={t('form.searchAssetsPlaceholder')}
                className="flex-1"
              />
              <Button variant="secondary" onClick={searchAssets}>{t('searchButton')}</Button>
            </div>
            <div className="divide-y divide-neutral-100 max-h-64 overflow-y-auto rounded-lg border border-neutral-200 overflow-hidden">
              {assets.map((a) => (
                <div
                  key={a.id}
                  onClick={() => toggleAsset(a.id)}
                  className={cn(
                    'px-3 py-2.5 cursor-pointer hover:bg-primary-50 text-sm flex items-center gap-2 transition-colors',
                    selectedAssetIds.includes(a.id) ? 'bg-primary-50' : '',
                  )}
                >
                  <input type="checkbox" checked={selectedAssetIds.includes(a.id)} readOnly className="accent-primary-600" />
                  <span className="text-neutral-700">
                    {a.assetName} — {a.assetType} — {a.brand} — {new Intl.NumberFormat('vi-VN').format(a.valuationAmount)} VND
                  </span>
                </div>
              ))}
              {assets.length === 0 && (
                <div className="px-3 py-4 text-sm text-neutral-400 text-center">{t('form.searchAssetsPlaceholder')}</div>
              )}
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="secondary" onClick={() => setStep(1)}>{t('back')}</Button>
              <Button onClick={() => setStep(3)}>{t('next')}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3 — Loan Terms */}
      {step === 3 && (
        <Card>
          <CardContent className="pt-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('form.principalAmount')}
                type="number"
                value={terms.principalAmount}
                onChange={(e) => setTerms((prev) => ({ ...prev, principalAmount: e.target.value }))}
                required
              />
              <Input
                label={t('form.interestRate')}
                type="number"
                step="0.01"
                value={terms.interestRate}
                onChange={(e) => setTerms((prev) => ({ ...prev, interestRate: e.target.value }))}
                required
              />
              <Select
                label={t('form.interestType')}
                value={terms.interestType}
                onChange={(e) => setTerms((prev) => ({ ...prev, interestType: e.target.value }))}
              >
                {INTEREST_TYPES.map((x) => (
                  <option key={x} value={x}>
                    {t(`interestType.${x}` as 'interestType.daily' | 'interestType.monthly' | 'interestType.periodic')}
                  </option>
                ))}
              </Select>
              <Input
                label={t('form.startDate')}
                type="date"
                value={terms.startDate}
                onChange={(e) => setTerms((prev) => ({ ...prev, startDate: e.target.value }))}
              />
              <Input
                label={t('form.dueDate')}
                type="date"
                value={terms.dueDate}
                onChange={(e) => setTerms((prev) => ({ ...prev, dueDate: e.target.value }))}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-neutral-700">{t('form.notes')}</label>
              <textarea
                value={terms.notes}
                onChange={(e) => setTerms((prev) => ({ ...prev, notes: e.target.value }))}
                rows={2}
                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500/25 focus:border-primary-500"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="secondary" onClick={() => setStep(2)}>{t('back')}</Button>
              <Button
                onClick={handleSubmit}
                loading={loading}
                disabled={loading || !terms.principalAmount || !terms.dueDate}
              >
                {loading ? t('creating') : t('createButton')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
