'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useTranslations } from 'next-intl';
import {
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Alert,
  Spinner,
} from '@/components/ui';
import { cn } from '@/lib/cn';

interface Asset {
  id: string;
  assetName: string;
  assetType: string;
  brand: string;
  model: string;
  serialNumber: string;
  imei: string;
  licensePlate: string;
  chassisNumber: string;
  engineNumber: string;
  conditionDescription: string;
  valuationAmount: number;
  proposedLoanAmount: number;
  status: string;
  contractId: string | null;
  createdAt: string;
}

interface Contract {
  id: string;
  contractCode?: string;
  contract_code?: string;
  status: string;
  principalAmount?: number;
  principal_amount?: string | number;
  interestRate?: number;
  interest_rate?: string | number;
  interestType?: string;
  interest_type?: string;
  startDate?: string;
  start_date?: string;
  dueDate?: string;
  due_date?: string;
  customerId?: string;
  customer_id?: string;
  customerName?: string;
  customer_name?: string;
  storeName?: string;
  store_name?: string;
}

const assetStatusVariant = (status: string): 'success' | 'warning' | 'destructive' | 'info' | 'default' => {
  const map: Record<string, 'success' | 'warning' | 'destructive' | 'info' | 'default'> = {
    holding: 'info',
    redeemed: 'success',
    overdue: 'destructive',
    pending_liquidation: 'warning',
    liquidated: 'default',
  };
  return map[status] ?? 'default';
};

const contractStatusVariant = (status: string): 'success' | 'warning' | 'destructive' | 'info' | 'default' => {
  const map: Record<string, 'success' | 'warning' | 'destructive' | 'info' | 'default'> = {
    active: 'success',
    near_due: 'warning',
    overdue: 'destructive',
    settled: 'info',
  };
  return map[status] ?? 'default';
};

export default function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations('assets');
  const tc = useTranslations('contracts');
  const [id, setId] = useState('');
  const [asset, setAsset] = useState<Asset | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    api
      .get<Asset>(`/assets/${id}`)
      .then(async (r) => {
        const a = r.data;
        setAsset(a);
        if (a.contractId) {
          try {
            const cr = await api.get<Contract>(`/contracts/${a.contractId}`);
            setContract(cr.data);
          } catch {
            // Contract fetch failed — non-fatal, show without contract info
          }
        }
      })
      .catch(() => setError(t('detailLoadError')))
      .finally(() => setLoading(false));
  }, [id, t]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) return <Alert variant="destructive">{error}</Alert>;
  if (!asset) return null;

  return (
    <div className="max-w-3xl space-y-5">
      {/* Heading */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/assets" className="text-xs text-neutral-400 hover:text-primary-600 mb-1 inline-block">
            ← {t('pageTitle')}
          </Link>
          <h1 className="text-xl font-semibold text-neutral-900">{asset.assetName}</h1>
        </div>
        <Badge variant={assetStatusVariant(asset.status)}>{asset.status}</Badge>
      </div>

      {/* Asset info */}
      <Card>
        <CardHeader>
          <CardTitle>{t('detailTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <InfoRow label={t('fieldLabels.assetType')} value={asset.assetType} />
            <InfoRow label={t('fieldLabels.brand')} value={asset.brand} />
            <InfoRow label={t('fieldLabels.model')} value={asset.model} />
            {asset.serialNumber && (
              <InfoRow label={t('fieldLabels.serialNumber')} value={asset.serialNumber} mono />
            )}
            {asset.imei && (
              <InfoRow label={t('fieldLabels.imei')} value={asset.imei} mono />
            )}
            {asset.licensePlate && (
              <InfoRow label={t('fieldLabels.licensePlate')} value={asset.licensePlate} mono />
            )}
            {asset.chassisNumber && (
              <InfoRow label={t('fieldLabels.chassisNumber')} value={asset.chassisNumber} mono />
            )}
            {asset.engineNumber && (
              <InfoRow label={t('fieldLabels.engineNumber')} value={asset.engineNumber} mono />
            )}
            <InfoRow
              label={t('fieldLabels.valuationAmount')}
              value={`${new Intl.NumberFormat('vi-VN').format(asset.valuationAmount)} ₫`}
            />
            <InfoRow
              label={t('fieldLabels.proposedLoanAmount')}
              value={`${new Intl.NumberFormat('vi-VN').format(asset.proposedLoanAmount)} ₫`}
            />
            {asset.conditionDescription && (
              <InfoRow
                label={t('fieldLabels.conditionDescription')}
                value={asset.conditionDescription}
              />
            )}
            <InfoRow
              label={t('fieldLabels.created')}
              value={new Date(asset.createdAt).toLocaleDateString('vi-VN')}
            />
          </dl>
        </CardContent>
      </Card>

      {/* Linked Contract */}
      <Card>
        <CardHeader>
          <CardTitle>{t('linkedContract')}</CardTitle>
        </CardHeader>
        <CardContent>
          {!asset.contractId ? (
            <p className="text-sm text-neutral-400">{t('noLinkedContract')}</p>
          ) : contract ? (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Link
                  href={`/contracts/${contract.id}`}
                  className="font-mono text-sm text-primary-600 hover:underline font-medium"
                >
                  {contract.contractCode ?? contract.contract_code}
                </Link>
                <Badge variant={contractStatusVariant(contract.status)}>{contract.status}</Badge>
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                <InfoRow
                  label={tc('contractInfo.principal')}
                  value={`${new Intl.NumberFormat('vi-VN').format(Number(contract.principalAmount ?? contract.principal_amount ?? 0))} ₫`}
                />
                <InfoRow
                  label={tc('contractInfo.interestRate')}
                  value={`${contract.interestRate ?? contract.interest_rate ?? ''}% (${contract.interestType ?? contract.interest_type ?? ''})`}
                />
                <InfoRow
                  label={tc('contractInfo.startDate')}
                  value={new Date((contract.startDate ?? contract.start_date) as string).toLocaleDateString('vi-VN')}
                />
                <InfoRow
                  label={tc('contractInfo.dueDate')}
                  value={new Date((contract.dueDate ?? contract.due_date) as string).toLocaleDateString('vi-VN')}
                />
                <InfoRow label={tc('contractInfo.store')} value={(contract.storeName ?? contract.store_name) || '—'} />
              </dl>
              {(contract.customerId ?? contract.customer_id) && (
                <div className="pt-1">
                  <span className="text-xs text-neutral-500 mr-1">{t('customer')}:</span>
                  <Link
                    href={`/customers/${contract.customerId ?? contract.customer_id}`}
                    className="text-sm text-primary-600 hover:underline font-medium"
                  >
                    {contract.customerName ?? contract.customer_name}
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-neutral-400 font-mono">{asset.contractId}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-neutral-500 text-xs mb-0.5">{label}</dt>
      <dd className={cn('text-neutral-900', mono && 'font-mono text-xs')}>{value || '—'}</dd>
    </div>
  );
}
