import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function Home() {
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
        <section className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-indigo-700 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {t('eyebrow')}
          </div>

          <div className="space-y-5">
            <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              {t('title')}
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-600">
              {t('description')}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 hover:bg-slate-800"
            >
              {t('primaryCta')}
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:border-slate-400 hover:text-slate-950"
            >
              {t('secondaryCta')}
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {highlights.map((item) => (
              <article
                key={item.title}
                className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-[0_24px_70px_-46px_rgba(15,23,42,0.45)]"
              >
                <h2 className="text-base font-semibold text-slate-950">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/80 bg-slate-950 p-8 text-white shadow-[0_40px_120px_-60px_rgba(15,23,42,0.9)]">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-200">
                Paw8
              </span>
              <span className="text-xs font-medium text-slate-300">{t('statusBadge')}</span>
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-semibold text-white">{t('panelTitle')}</h2>
              <p className="text-sm leading-7 text-slate-300">{t('panelDescription')}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{t('panelCards.contractsLabel')}</p>
                <p className="mt-3 text-3xl font-semibold text-white">{t('panelCards.contractsValue')}</p>
                <p className="mt-2 text-sm text-slate-300">{t('panelCards.contractsDescription')}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{t('panelCards.securityLabel')}</p>
                <p className="mt-3 text-3xl font-semibold text-white">{t('panelCards.securityValue')}</p>
                <p className="mt-2 text-sm text-slate-300">{t('panelCards.securityDescription')}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
