'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from '@/components/language-switcher';
import { PageIntro, StatePanel, Surface } from '@/components/page-states';
import {
  adminRoles,
  auditRoles,
  canAccessRole,
  dashboardRoles,
  getDefaultRouteForRole,
  reportingRoles,
} from '@/lib/role-access';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('nav');
  const tAuth = useTranslations('auth');
  const tShell = useTranslations('shell');
  const tRole = useTranslations('users.roles');

  const navItems = [
    { href: '/dashboard', label: t('dashboard'), allowedRoles: dashboardRoles },
    { href: '/customers', label: t('customers') },
    { href: '/assets', label: t('assets') },
    { href: '/contracts', label: t('contracts') },
    { href: '/reports', label: t('reports'), allowedRoles: reportingRoles },
    { href: '/users', label: t('users'), allowedRoles: adminRoles },
    { href: '/stores', label: t('stores'), allowedRoles: adminRoles },
    { href: '/audit-logs', label: t('auditLogs'), allowedRoles: auditRoles },
  ];

  const currentItem = navItems.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

  const roleLabel = currentUser?.role
    ? ({
        platform_admin: tRole('platform_admin'),
        tenant_owner: tRole('tenant_owner'),
        tenant_admin: tRole('tenant_admin'),
        store_manager: tRole('store_manager'),
        staff: tRole('staff'),
        accountant: tRole('accountant'),
      }[currentUser.role] ?? currentUser.role.replace(/_/g, ' '))
    : '';

  useEffect(() => {
    if (!loading && !currentUser) {
      router.replace('/login');
      return;
    }

    if (
      !loading &&
      currentUser &&
      currentItem &&
      !canAccessRole(currentUser.role, currentItem.allowedRoles)
    ) {
      router.replace(getDefaultRouteForRole(currentUser.role));
    }
  }, [loading, currentItem, currentUser, router]);

  if (loading) {
    return (
      <div className="min-h-screen px-6 py-10 sm:px-10">
        <div className="mx-auto max-w-3xl">
          <StatePanel
            title={tShell('signInRequired')}
            description={tShell('signInRequiredDescription')}
          />
        </div>
      </div>
    );
  }

  if (!currentUser) return null;

  if (currentItem && !canAccessRole(currentUser.role, currentItem.allowedRoles)) {
    return null;
  }

  return (
    <div className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex min-h-[calc(100vh-2rem)] gap-4 lg:gap-6">
        <aside className="hidden w-72 shrink-0 lg:flex">
          <Surface className="flex w-full flex-col overflow-hidden bg-slate-950 text-white">
            <div className="border-b border-white/10 px-6 py-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                {tShell('workspace')}
              </p>
              <div className="mt-3 space-y-1">
                <p className="text-2xl font-semibold text-white">{tShell('productName')}</p>
                <p className="text-sm leading-6 text-slate-300">{tShell('sessionProtected')}</p>
              </div>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4">
              {navItems
                .filter((item) => canAccessRole(currentUser.role, item.allowedRoles))
                .map((item) => {
                  const active = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`mb-1 block rounded-2xl px-4 py-3 text-sm font-medium transition ${
                        active
                          ? 'bg-white/12 text-white shadow-inner'
                          : 'text-slate-300 hover:bg-white/8 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
            </nav>
            <div className="border-t border-white/10 px-6 py-5">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{tShell('accountLabel')}</p>
                <p className="mt-2 text-base font-semibold text-white">
                  {currentUser.fullName || currentUser.email || currentUser.sub}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
                  <span className="rounded-full bg-white/8 px-3 py-1">{roleLabel}</span>
                  <span className="rounded-full bg-white/8 px-3 py-1">
                    {tShell('storeScope', { count: currentUser.allowedStoreIds.length })}
                  </span>
              </div>
            </div>
          </Surface>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-4 lg:gap-6">
          <Surface className="px-5 py-5 sm:px-6">
            <PageIntro
              eyebrow={tShell('workspace')}
              title={currentUser.fullName || currentUser.email || currentUser.sub}
              description={tShell('headerDescription', {
                role: roleLabel,
                stores: currentUser.allowedStoreIds.length,
              })}
              actions={
                <>
                  <LanguageSwitcher />
                  <button
                    onClick={() => {
                      void logout();
                    }}
                    className="inline-flex items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:border-red-300 hover:bg-red-100"
                  >
                    {tAuth('logoutButton')}
                  </button>
                </>
              }
            />
          </Surface>

          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}
