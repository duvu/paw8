'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useTranslations } from 'next-intl';

interface Contract {
  id: string;
  contractCode: string;
  status: string;
  principalAmount: number;
  interestRate: number;
  interestType: string;
  startDate: string;
  dueDate: string;
  notes: string;
  customerName: string;
  customerId: string;
  storeName: string;
  createdAt: string;
}

interface Asset {
  id: string;
  assetName: string;
  assetType: string;
  brand: string;
  status: string;
}

interface Transaction {
  id: string;
  transactionType: string;
  amount: number;
  paymentMethod: string;
  transactionDate: string;
  note: string;
  createdBy: string;
}

interface CollectForm { amount: string; paymentMethod: string; note: string; }
interface ExtendForm { newDueDate: string; note: string; }
interface SettleForm { paymentMethod: string; note: string; }

export default function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations('contracts');
  const [id, setId] = useState('');
  const [contract, setContract] = useState<Contract | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [modal, setModal] = useState<'collect' | 'extend' | 'settle' | null>(null);
  const [collectForm, setCollectForm] = useState<CollectForm>({ amount: '', paymentMethod: 'cash', note: '' });
  const [extendForm, setExtendForm] = useState<ExtendForm>({ newDueDate: '', note: '' });
  const [settleForm, setSettleForm] = useState<SettleForm>({ paymentMethod: 'cash', note: '' });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  const fetchData = (cid: string) => {
    Promise.all([
      api.get<Contract>(`/contracts/${cid}`),
      api.get<{ data: Asset[] }>(`/assets?contractId=${cid}`),
      api.get<{ data: Transaction[] }>(`/transactions?contractId=${cid}&limit=100`),
    ])
      .then(([c, a, tx]) => {
        setContract(c.data);
        setAssets(a.data.data ?? []);
        setTransactions(tx.data.data ?? []);
      })
      .catch(() => setError(t('loadError2')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (id) fetchData(id);
  }, [id]);

  const handleCollect = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setModalError('');
    try {
      await api.post(`/contracts/${id}/collect`, { ...collectForm, amount: Number(collectForm.amount) });
      setModal(null);
      fetchData(id);
    } catch { setModalError(t('collectError')); }
    finally { setSubmitting(false); }
  };

  const handleExtend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setModalError('');
    try {
      await api.post(`/contracts/${id}/extend`, extendForm);
      setModal(null);
      fetchData(id);
    } catch { setModalError(t('extendError')); }
    finally { setSubmitting(false); }
  };

  const handleSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setModalError('');
    try {
      await api.post(`/contracts/${id}/settle`, settleForm);
      setModal(null);
      fetchData(id);
    } catch { setModalError(t('settleError')); }
    finally { setSubmitting(false); }
  };

  if (loading) return <p className="text-gray-500">...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!contract) return null;

  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n);
  const canAct = ['active', 'near_due', 'overdue', 'extended'].includes(contract.status);

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800 font-mono">{contract.contractCode}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('contractInfo.customer')}: <Link href={`/customers/${contract.customerId}`} className="text-blue-600 hover:underline">{contract.customerName}</Link>
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor(contract.status)}`}>{contract.status}</span>
      </div>

      {/* Contract Info */}
      <div className="bg-white rounded border border-gray-200 p-4 grid grid-cols-2 gap-3 text-sm">
        <Row label={t('contractInfo.principal')} value={`${fmt(contract.principalAmount)} VND`} />
        <Row label={t('contractInfo.interestRate')} value={`${contract.interestRate}% (${contract.interestType})`} />
        <Row label={t('contractInfo.startDate')} value={new Date(contract.startDate).toLocaleDateString('vi-VN')} />
        <Row label={t('contractInfo.dueDate')} value={new Date(contract.dueDate).toLocaleDateString('vi-VN')} />
        <Row label={t('contractInfo.store')} value={contract.storeName ?? '—'} />
        <Row label={t('contractInfo.created')} value={new Date(contract.createdAt).toLocaleDateString('vi-VN')} />
        {contract.notes && <Row label={t('contractInfo.notes')} value={contract.notes} />}
      </div>

      {/* Actions */}
      {canAct && (
        <div className="flex gap-3">
          <button onClick={() => setModal('collect')} className="bg-green-600 text-white text-sm px-4 py-2 rounded hover:bg-green-700">{t('actions.collectInterest')}</button>
          <button onClick={() => setModal('extend')} className="bg-yellow-500 text-white text-sm px-4 py-2 rounded hover:bg-yellow-600">{t('actions.extend')}</button>
          <button onClick={() => setModal('settle')} className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700">{t('actions.settle')}</button>
        </div>
      )}

      {/* Assets */}
      <section>
        <h2 className="font-semibold text-gray-700 mb-2">{t('pawnedAssets')}</h2>
        <div className="bg-white rounded border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-600">{t('assetHeaders.name')}</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">{t('assetHeaders.type')}</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">{t('assetHeaders.brand')}</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">{t('assetHeaders.status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {assets.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-2">{a.assetName}</td>
                  <td className="px-4 py-2">{a.assetType}</td>
                  <td className="px-4 py-2">{a.brand}</td>
                  <td className="px-4 py-2">{a.status}</td>
                </tr>
              ))}
              {assets.length === 0 && <tr><td colSpan={4} className="px-4 py-4 text-center text-gray-400">{t('noAssets')}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {/* Transactions */}
      <section>
        <h2 className="font-semibold text-gray-700 mb-2">{t('transactionHistory')}</h2>
        <div className="bg-white rounded border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-600">{t('txHeaders.type')}</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">{t('txHeaders.amount')}</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">{t('txHeaders.method')}</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">{t('txHeaders.date')}</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">{t('txHeaders.note')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="px-4 py-2">{tx.transactionType}</td>
                  <td className="px-4 py-2">{fmt(tx.amount)}</td>
                  <td className="px-4 py-2">{tx.paymentMethod}</td>
                  <td className="px-4 py-2">{new Date(tx.transactionDate).toLocaleDateString('vi-VN')}</td>
                  <td className="px-4 py-2 text-gray-500">{tx.note}</td>
                </tr>
              ))}
              {transactions.length === 0 && <tr><td colSpan={5} className="px-4 py-4 text-center text-gray-400">{t('noTransactions')}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modals */}
      {modal === 'collect' && (
        <Modal title={t('modalTitles.collect')} onClose={() => setModal(null)}>
          <form onSubmit={handleCollect} className="space-y-3">
            {modalError && <p className="text-red-500 text-sm">{modalError}</p>}
            <Field label={t('modalFields.amount')} type="number" value={collectForm.amount} onChange={(v) => setCollectForm((f) => ({ ...f, amount: v }))} required />
            <SelectField label={t('modalFields.paymentMethod')} value={collectForm.paymentMethod} options={['cash', 'transfer', 'other']} onChange={(v) => setCollectForm((f) => ({ ...f, paymentMethod: v }))} />
            <TextareaField label={t('modalFields.note')} value={collectForm.note} onChange={(v) => setCollectForm((f) => ({ ...f, note: v }))} />
            <ModalActions submitting={submitting} onClose={() => setModal(null)} label={t('collect')} savingLabel={t('saving')} />
          </form>
        </Modal>
      )}

      {modal === 'extend' && (
        <Modal title={t('modalTitles.extend')} onClose={() => setModal(null)}>
          <form onSubmit={handleExtend} className="space-y-3">
            {modalError && <p className="text-red-500 text-sm">{modalError}</p>}
            <Field label={t('modalFields.newDueDate')} type="date" value={extendForm.newDueDate} onChange={(v) => setExtendForm((f) => ({ ...f, newDueDate: v }))} required />
            <TextareaField label={t('modalFields.note')} value={extendForm.note} onChange={(v) => setExtendForm((f) => ({ ...f, note: v }))} />
            <ModalActions submitting={submitting} onClose={() => setModal(null)} label={t('extend')} savingLabel={t('saving')} />
          </form>
        </Modal>
      )}

      {modal === 'settle' && (
        <Modal title={t('modalTitles.settle')} onClose={() => setModal(null)}>
          <form onSubmit={handleSettle} className="space-y-3">
            {modalError && <p className="text-red-500 text-sm">{modalError}</p>}
            <SelectField label={t('modalFields.paymentMethod')} value={settleForm.paymentMethod} options={['cash', 'transfer', 'other']} onChange={(v) => setSettleForm((f) => ({ ...f, paymentMethod: v }))} />
            <TextareaField label={t('modalFields.note')} value={settleForm.note} onChange={(v) => setSettleForm((f) => ({ ...f, note: v }))} />
            <ModalActions submitting={submitting} onClose={() => setModal(null)} label={t('settle')} savingLabel={t('saving')} />
          </form>
        </Modal>
      )}
    </div>
  );
}

function statusColor(s: string) {
  const m: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    near_due: 'bg-yellow-100 text-yellow-700',
    overdue: 'bg-red-100 text-red-700',
    settled: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-gray-100 text-gray-500',
  };
  return m[s] ?? 'bg-gray-100 text-gray-600';
}

function Row({ label, value }: { label: string; value: string }) {
  return <div><span className="text-gray-500">{label}: </span><span>{value}</span></div>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, type, value, onChange, required }: { label: string; type?: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type ?? 'text'} value={value} onChange={(e) => onChange(e.target.value)} required={required}
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function TextareaField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2}
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none" />
    </div>
  );
}

function ModalActions({ submitting, onClose, label, savingLabel }: { submitting: boolean; onClose: () => void; label: string; savingLabel: string }) {
  return (
    <div className="flex gap-3 pt-2">
      <button type="submit" disabled={submitting} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
        {submitting ? savingLabel : label}
      </button>
      <button type="button" onClick={onClose} className="border border-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-50">Cancel</button>
    </div>
  );
}
