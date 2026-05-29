'use client';

import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';

const LOCALES = ['vi', 'en', 'zh'] as const;

export default function LanguageSwitcher() {
  const t = useTranslations('languageSwitcher');
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value;
    // Set cookie for next-intl locale detection
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`;
    // Navigate to same path — next-intl will pick up the cookie
    router.refresh();
    // Small delay to allow cookie to be set
    setTimeout(() => {
      window.location.href = pathname;
    }, 50);
  };

  // Detect current locale from cookie
  const getCurrentLocale = () => {
    if (typeof document === 'undefined') return 'vi';
    const match = document.cookie.match(/NEXT_LOCALE=([^;]+)/);
    return match ? match[1] : 'vi';
  };

  return (
    <select
      defaultValue={getCurrentLocale()}
      onChange={handleChange}
      className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700"
      aria-label={t('label')}
    >
      {LOCALES.map((locale) => (
        <option key={locale} value={locale}>
          {t(locale)}
        </option>
      ))}
    </select>
  );
}
