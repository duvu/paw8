'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { PageIntro } from '@/components/page-states';
import { Card, CardContent, EmptyState, Button } from '@/components/ui';

export default function TransactionsPage() {
  const t = useTranslations('transactions');

  return (
    <div className="space-y-6">
      <PageIntro title={t('pageTitle')} description={t('unavailableDescription')} />
      <Card>
        <CardContent>
          <EmptyState
            title={t('unavailableTitle')}
            description={t('unavailableDescription')}
            action={
              <Link href="/contracts">
                <Button>{t('goToContracts')}</Button>
              </Link>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
