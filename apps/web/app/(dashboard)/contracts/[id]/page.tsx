'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';
import {
  Button,
  Input,
  Select,
  Badge,
  BadgeVariant,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Modal,
  Spinner,
  EmptyState,
  Alert,
} from '@/components/ui';

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

function statusBadgeVariant(s: string): BadgeVariant {
  const m: Record<string, BadgeVariant> = {
    active: 'success',
    near_due: 'warning',
    overdue: 'destructive',
    settled: 'info',
    cancelled: 'default',
    extended: 'warning',
  };
  return m[s] ?? 'default';
}

const PAYMENT_METHODS = ['cash', 'transfer', 'other'];

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
      api.get<Contract & Record<string, unknown>>(`/contracts/${cid}`),
      api.get<Transaction[] | { data: Transaction[] }>(`/transactions?contractId=${cid}&limit=100`),
    ])
      .then(([c, tx]) => {
        const raw = c.data as Contract & Record<string, unknown>;
        setContract({
          id: raw.id as string,
          contractCode: ((raw.contract_code ?? raw.contractCode) as string) ?? '',
          status: raw.status as string,
          principalAmount: parseFloat(String(raw.principal_amount ?? raw.principalAmount ?? 0)),
          interestRate: parseFloat(String(raw.interest_rate ?? raw.interestRate ?? 0)),
          interestType: ((raw.interest_type ?? raw.interestType) as string) ?? '',
          startDate: ((raw.start_date ?? raw.startDate) as string) ?? '',
          dueDate: ((raw.due_date ?? raw.dueDate) as string) ?? '',
          notes: (raw.notes as string) ?? '',
          customerName: ((raw.customer_name ?? raw.customer_full_name ?? raw.customerName) as string) ?? '',
          customerId: ((raw.customer_id ?? raw.customerId) as string) ?? '',
          storeName: ((raw.store_name ?? raw.storeName) as string) ?? '',
          createdAt: ((raw.createdAt ?? raw.created_at) as string) ?? '',
        });
        const embeddedAssets = (raw.assets as Array<Asset & Record<string, unknown>>) ?? [];
        setAssets(embeddedAssets.map((a) => ({
          id: a.id as string,
          assetName: ((a.asset_name ?? a.assetName) as string) ?? '',
          assetType: ((a.asset_type ?? a.assetType) as string) ?? '',
          brand: (a.brand as string) ?? '',
          status: a.status as string,
        })));
        const rawTx = Array.isArray(tx.data) ? tx.data : (tx.data as { data: Transaction[] }).data ?? [];
        setTransactions((rawTx as Array<Transaction & Record<string, unknown>>).map((txItem) => ({
          id: txItem.id as string,
          transactionType: ((txItem.transaction_type ?? txItem.transactionType) as string) ?? '',
          amount: parseFloat(String(txItem.amount ?? 0)),
          paymentMethod: ((txItem.payment_method ?? txItem.paymentMethod) as string) ?? '',
          transactionDate: ((txItem.transaction_date ?? txItem.transactionDate) as string) ?? '',
          note: (txItem.note as string) ?? '',
          createdBy: ((txItem.created_by ?? txItem.createdBy) as string) ?? '',
        })));
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }
  if (error) return <Alert variant="destructive">{error}</Alert>;
  if (!contract) return null;

  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n);
  const canAct = ['active', 'near_due', 'overdue', 'extended'].includes(contract.status);

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 font-mono">{contract.contractCode}</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {t('contractInfo.customer')}:{' '}
            <Link href={`/customers/${contract.customerId}`} className="text-primary-600 hover:underline">
              {contract.customerName}
            </Link>
          </p>
        </div>
        <Badge variant={statusBadgeVariant(contract.status)}>{contract.status}</Badge>
      </div>

      {/* Contract Info */}
      <Card>
        <CardHeader>
          <CardTitle>{t('contractInfo.customer')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Row label={t('contractInfo.principal')} value={`${fmt(contract.principalAmount)} VND`} />
            <Row label={t('contractInfo.interestRate')} value={`${contract.interestRate}% (${contract.interestType})`} />
            <Row label={t('contractInfo.startDate')} value={new Date(contract.startDate).toLocaleDateString('vi-VN')} />
            <Row label={t('contractInfo.dueDate')} value={new Date(contract.dueDate).toLocaleDateString('vi-VN')} />
            <Row label={t('contractInfo.store')} value={contract.storeName ?? '—'} />
            <Row label={t('contractInfo.created')} value={new Date(contract.createdAt).toLocaleDateString('vi-VN')} />
            {contract.notes && <Row label={t('contractInfo.notes')} value={contract.notes} />}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {canAct && (
        <div className="flex gap-3">
          <Button
            onClick={() => setModal('collect')}
            className="bg-success-600 hover:bg-success-700 text-white shadow-sm"
          >
            {t('actions.collectInterest')}
          </Button>
          <Button
            onClick={() => setModal('extend')}
            className="bg-warning-500 hover:bg-warning-600 text-white shadow-sm"
          >
            {t('actions.extend')}
          </Button>
          <Button onClick={() => setModal('settle')}>
            {t('actions.settle')}
          </Button>
        </div>
      )}

      {/* Assets */}
      <Card>
        <CardHeader>
          <CardTitle>{t('pawnedAssets')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('assetHeaders.name')}</TableHead>
                  <TableHead>{t('assetHeaders.type')}</TableHead>
                  <TableHead>{t('assetHeaders.brand')}</TableHead>
                  <TableHead>{t('assetHeaders.status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <Link href={`/assets/${a.id}`} className="text-primary-600 hover:underline font-medium">
                        {a.assetName}
                      </Link>
                    </TableCell>
                    <TableCell>{a.assetType}</TableCell>
                    <TableCell>{a.brand}</TableCell>
                    <TableCell>
                      <Badge variant={a.status === 'holding' ? 'warning' : a.status === 'redeemed' ? 'success' : 'default'}>
                        {a.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {assets.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <EmptyState title={t('noAssets')} className="py-8" />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('transactionHistory')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('txHeaders.type')}</TableHead>
                  <TableHead>{t('txHeaders.amount')}</TableHead>
                  <TableHead>{t('txHeaders.method')}</TableHead>
                  <TableHead>{t('txHeaders.date')}</TableHead>
                  <TableHead>{t('txHeaders.note')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-medium">{tx.transactionType}</TableCell>
                    <TableCell>{fmt(tx.amount)}</TableCell>
                    <TableCell>{tx.paymentMethod}</TableCell>
                    <TableCell>{new Date(tx.transactionDate).toLocaleDateString('vi-VN')}</TableCell>
                    <TableCell className="text-neutral-500">{tx.note}</TableCell>
                  </TableRow>
                ))}
                {transactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <EmptyState title={t('noTransactions')} className="py-8" />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Collect Modal */}
      <Modal
        open={modal === 'collect'}
        onClose={() => setModal(null)}
        title={t('modalTitles.collect')}
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setModal(null)}>Cancel</Button>
            <Button form="collect-form" type="submit" loading={submitting} disabled={submitting}>
              {submitting ? t('saving') : t('collect')}
            </Button>
          </>
        }
      >
        <form id="collect-form" onSubmit={handleCollect} className="space-y-3">
          {modalError && <Alert variant="destructive">{modalError}</Alert>}
          <Input
            label={t('modalFields.amount')}
            type="number"
            value={collectForm.amount}
            onChange={(e) => setCollectForm((f) => ({ ...f, amount: e.target.value }))}
            required
          />
          <Select
            label={t('modalFields.paymentMethod')}
            value={collectForm.paymentMethod}
            onChange={(e) => setCollectForm((f) => ({ ...f, paymentMethod: e.target.value }))}
          >
            {PAYMENT_METHODS.map((o) => <option key={o} value={o}>{o}</option>)}
          </Select>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-neutral-700">{t('modalFields.note')}</label>
            <textarea
              value={collectForm.note}
              onChange={(e) => setCollectForm((f) => ({ ...f, note: e.target.value }))}
              rows={2}
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500/25 focus:border-primary-500"
            />
          </div>
        </form>
      </Modal>

      {/* Extend Modal */}
      <Modal
        open={modal === 'extend'}
        onClose={() => setModal(null)}
        title={t('modalTitles.extend')}
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setModal(null)}>Cancel</Button>
            <Button form="extend-form" type="submit" loading={submitting} disabled={submitting}>
              {submitting ? t('saving') : t('extend')}
            </Button>
          </>
        }
      >
        <form id="extend-form" onSubmit={handleExtend} className="space-y-3">
          {modalError && <Alert variant="destructive">{modalError}</Alert>}
          <Input
            label={t('modalFields.newDueDate')}
            type="date"
            value={extendForm.newDueDate}
            onChange={(e) => setExtendForm((f) => ({ ...f, newDueDate: e.target.value }))}
            required
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-neutral-700">{t('modalFields.note')}</label>
            <textarea
              value={extendForm.note}
              onChange={(e) => setExtendForm((f) => ({ ...f, note: e.target.value }))}
              rows={2}
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500/25 focus:border-primary-500"
            />
          </div>
        </form>
      </Modal>

      {/* Settle Modal */}
      <Modal
        open={modal === 'settle'}
        onClose={() => setModal(null)}
        title={t('modalTitles.settle')}
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setModal(null)}>Cancel</Button>
            <Button form="settle-form" type="submit" loading={submitting} disabled={submitting}>
              {submitting ? t('saving') : t('settle')}
            </Button>
          </>
        }
      >
        <form id="settle-form" onSubmit={handleSettle} className="space-y-3">
          {modalError && <Alert variant="destructive">{modalError}</Alert>}
          <Select
            label={t('modalFields.paymentMethod')}
            value={settleForm.paymentMethod}
            onChange={(e) => setSettleForm((f) => ({ ...f, paymentMethod: e.target.value }))}
          >
            {PAYMENT_METHODS.map((o) => <option key={o} value={o}>{o}</option>)}
          </Select>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-neutral-700">{t('modalFields.note')}</label>
            <textarea
              value={settleForm.note}
              onChange={(e) => setSettleForm((f) => ({ ...f, note: e.target.value }))}
              rows={2}
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500/25 focus:border-primary-500"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-neutral-500">{label}: </span>
      <span className="text-neutral-800">{value}</span>
    </div>
  );
}
