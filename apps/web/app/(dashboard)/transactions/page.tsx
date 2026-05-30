'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Card, CardContent, EmptyState, Button , PageHeader} from '@/components/ui';

export default function TransactionsPage() {
  const t = useTranslations('transactions');

  return (
    <div className="space-y-6">
      <PageHeader title={t('pageTitle')} subtitle={t('unavailableDescription')} />
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
