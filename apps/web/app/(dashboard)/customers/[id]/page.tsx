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
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  EmptyState,
  Alert,
  Spinner,
} from '@/components/ui';
import { cn } from '@/lib/cn';

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

const contractStatusVariant = (status: string): 'success' | 'warning' | 'destructive' | 'info' | 'default' => {
  const map: Record<string, 'success' | 'warning' | 'destructive' | 'info' | 'default'> = {
    active: 'success',
    near_due: 'warning',
    overdue: 'destructive',
    settled: 'info',
  };
  return map[status] ?? 'default';
};

const FileIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const ContractIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    <rect x="9" y="3" width="6" height="4" rx="2" />
  </svg>
);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) return <Alert variant="destructive">{error}</Alert>;
  if (!customer) return null;

  return (
    <div className="max-w-3xl space-y-5">
      {/* Page heading */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">{customer.fullName}</h1>
        <Badge variant={customer.status === 'active' ? 'success' : 'default'}>
          {customer.status}
        </Badge>
      </div>

      {/* Customer info */}
      <Card>
        <CardHeader>
          <CardTitle>{t('fieldLabels.info') ?? 'Customer Information'}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <InfoRow label={t('fieldLabels.phone')} value={customer.phone} />
            <InfoRow label={t('fieldLabels.identityNo')} value={customer.identityNumber} mono />
            <InfoRow label={t('fieldLabels.dateOfBirth')} value={customer.dateOfBirth} />
            <InfoRow label={t('fieldLabels.occupation')} value={customer.occupation} />
            <InfoRow
              label={t('fieldLabels.emergencyContact')}
              value={`${customer.emergencyContactName} — ${customer.emergencyContactPhone}`}
            />
            <InfoRow label={t('fieldLabels.permanentAddress')} value={customer.permanentAddress} />
            <InfoRow label={t('fieldLabels.currentAddress')} value={customer.currentAddress} />
            {customer.notes && <InfoRow label={t('fieldLabels.notes')} value={customer.notes} />}
            <InfoRow
              label={t('fieldLabels.created')}
              value={new Date(customer.createdAt).toLocaleDateString('vi-VN')}
            />
          </dl>
        </CardContent>
      </Card>

      {/* Contracts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('contracts')}</CardTitle>
            <Link
              href={`/contracts/new?customerId=${customer.id}`}
              className="text-xs text-primary-600 hover:underline font-medium"
            >
              {t('newContract')}
            </Link>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('contractHeaders.code')}</TableHead>
                  <TableHead>{t('contractHeaders.status')}</TableHead>
                  <TableHead>{t('contractHeaders.principal')}</TableHead>
                  <TableHead>{t('contractHeaders.dueDate')}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState icon={<ContractIcon />} title={t('noContracts')} />
                    </td>
                  </tr>
                ) : (
                  contracts.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">{c.contractCode}</TableCell>
                      <TableCell>
                        <Badge variant={contractStatusVariant(c.status)}>{c.status}</Badge>
                      </TableCell>
                      <TableCell>{new Intl.NumberFormat('vi-VN').format(c.principalAmount)}</TableCell>
                      <TableCell>{new Date(c.dueDate).toLocaleDateString('vi-VN')}</TableCell>
                      <TableCell>
                        <Link
                          href={`/contracts/${c.id}`}
                          className="text-primary-600 hover:underline text-xs font-medium"
                        >
                          {t('viewButton')}
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle>{t('documents')}</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {documents.length === 0 ? (
            <EmptyState icon={<FileIcon />} title={t('noDocuments')} />
          ) : (
            <ul className="divide-y divide-neutral-100">
              {documents.map((d) => (
                <li key={d.id} className="px-5 py-3 flex items-center justify-between text-sm">
                  <span className="text-neutral-800 font-medium">{d.originalFilename}</span>
                  <span className="text-xs text-neutral-400">
                    {new Date(d.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </li>
              ))}
            </ul>
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
