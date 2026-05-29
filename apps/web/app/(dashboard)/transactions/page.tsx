'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { PageIntro, StatePanel } from '@/components/page-states';

export default function TransactionsPage() {
  const t = useTranslations('transactions');

  return (
    <div className="space-y-6">
      <PageIntro title={t('pageTitle')} description={t('unavailableDescription')} />
      <StatePanel
        title={t('unavailableTitle')}
        description={t('unavailableDescription')}
        tone="warning"
        action={
          <Link
            href="/contracts"
            className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            {t('goToContracts')}
          </Link>
        }
      />
    </div>
  );
}
