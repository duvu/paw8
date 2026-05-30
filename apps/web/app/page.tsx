import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Badge, Card, CardContent } from '@/components/ui';
import { cn } from '@/lib/cn';

export default async function Page() {
  const t = await getTranslations('landing');

  const highlights = [
    {
      title: t('operationsTitle'),
      description: t('operationsDescription'),
    },
    {
      title: t('securityTitle'),
      description: t('securityDescription'),
    },
    {
      title: t('visibilityTitle'),
      description: t('visibilityDescription'),
    },
  ];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center px-6 py-16 sm:px-10 lg:px-12">
      <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        {/* Left: hero content */}
        <section className="space-y-8 text-center lg:text-left">
          <Badge variant="success" className="gap-1.5 px-4 py-1.5 text-xs uppercase tracking-widest">
            <span className="h-2 w-2 rounded-full bg-current opacity-70" />
            {t('eyebrow')}
          </Badge>

          <div className="space-y-5">
            <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
              {t('title')}
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-8 text-neutral-600 lg:mx-0">
              {t('description')}
            </p>
          </div>

          <div className="flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
            <Link
              href="/login"
              className={cn(
                'inline-flex items-center justify-center font-medium whitespace-nowrap transition-all duration-150',
                'h-11 px-6 text-base rounded-xl',
                'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-sm',
              )}
            >
              {t('primaryCta')}
            </Link>
            <Link
              href="/dashboard"
              className={cn(
                'inline-flex items-center justify-center font-medium whitespace-nowrap transition-all duration-150',
                'h-11 px-6 text-base rounded-xl',
                'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50 active:bg-neutral-100 shadow-sm',
              )}
            >
              {t('secondaryCta')}
            </Link>
          </div>

          {/* Feature highlight cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            {highlights.map((item) => (
              <Card key={item.title}>
                <CardContent className="pt-5">
                  <h2 className="text-sm font-semibold text-neutral-900">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Right: dark product panel */}
        <section className="rounded-2xl border border-white/10 bg-neutral-900 p-8 text-white shadow-2xl">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-neutral-200">
                Paw8
              </span>
              <Badge variant="success" className="text-xs">
                {t('statusBadge')}
              </Badge>
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-semibold text-white">{t('panelTitle')}</h2>
              <p className="text-sm leading-7 text-neutral-300">{t('panelDescription')}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-widest text-neutral-400">
                  {t('panelCards.contractsLabel')}
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {t('panelCards.contractsValue')}
                </p>
                <p className="mt-2 text-sm text-neutral-300">
                  {t('panelCards.contractsDescription')}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-widest text-neutral-400">
                  {t('panelCards.securityLabel')}
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {t('panelCards.securityValue')}
                </p>
                <p className="mt-2 text-sm text-neutral-300">
                  {t('panelCards.securityDescription')}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
