'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from '@/components/language-switcher';
import {
  adminRoles,
  auditRoles,
  canAccessRole,
  dashboardRoles,
  getDefaultRouteForRole,
  marketplaceRoles,
  reportingRoles,
} from '@/lib/role-access';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui';

interface NavItem {
  href: string;
  label: string;
  allowedRoles?: readonly string[];
  icon: React.ReactNode;
}

/* ─── Icon helpers ─────────────────────────────────────────────────────── */
function Icon({ d, ...p }: { d: string } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d={d} />
    </svg>
  );
}

const icons = {
  dashboard: <Icon d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  customers: <Icon d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />,
  assets: <Icon d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />,
  contracts: <Icon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />,
  reports: <Icon d="M18 20V10M12 20V4M6 20v-6" />,
  users: <Icon d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />,
  stores: <Icon d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  audit: <Icon d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />,
  marketplace: <Icon d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-8 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />,
  more: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" />
    </svg>
  ),
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('nav');
  const tAuth = useTranslations('auth');
  const tShell = useTranslations('shell');
  const tRole = useTranslations('users.roles');

  const allNavItems: NavItem[] = [
    { href: '/dashboard', label: t('dashboard'), allowedRoles: dashboardRoles, icon: icons.dashboard },
    { href: '/customers', label: t('customers'), icon: icons.customers },
    { href: '/assets', label: t('assets'), icon: icons.assets },
    { href: '/contracts', label: t('contracts'), icon: icons.contracts },
    { href: '/reports', label: t('reports'), allowedRoles: reportingRoles, icon: icons.reports },
    { href: '/users', label: t('users'), allowedRoles: adminRoles, icon: icons.users },
    { href: '/stores', label: t('stores'), allowedRoles: adminRoles, icon: icons.stores },
    { href: '/audit-logs', label: t('auditLogs'), allowedRoles: auditRoles, icon: icons.audit },
    { href: '/marketplace', label: t('marketplace'), allowedRoles: marketplaceRoles, icon: icons.marketplace },
  ];

  const visibleNavItems = allNavItems.filter((item) =>
    canAccessRole(currentUser?.role ?? '', item.allowedRoles)
  );

  // Bottom nav: first 4 visible + "more" if needed
  const bottomPrimary = visibleNavItems.slice(0, 4);
  const bottomMore = visibleNavItems.slice(4);

  const currentItem = allNavItems.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );

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
    if (!loading && currentUser && currentItem && !canAccessRole(currentUser.role, currentItem.allowedRoles)) {
      router.replace(getDefaultRouteForRole(currentUser.role));
    }
  }, [loading, currentItem, currentUser, router]);

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-neutral-400">
          <svg className="animate-spin" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <p className="text-sm">{tShell('signInRequired')}</p>
        </div>
      </div>
    );
  }

  if (currentItem && !canAccessRole(currentUser.role, currentItem.allowedRoles)) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-neutral-50">
      {/* ── Desktop Sidebar ─────────────────────────────────────────────── */}
      <aside className={cn(
        'hidden lg:flex lg:flex-col',
        'fixed inset-y-0 left-0 z-30',
        'w-[var(--sidebar-width)] bg-neutral-900 text-white',
        'border-r border-white/10',
      )}>
        {/* Brand */}
        <div className="px-6 py-5 border-b border-white/10">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-3">
            {tShell('workspace')}
          </p>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-base font-bold text-white">{tShell('productName')}</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {visibleNavItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  active
                    ? 'bg-white/12 text-white'
                    : 'text-neutral-400 hover:bg-white/8 hover:text-white',
                )}
              >
                <span className={cn('shrink-0', active ? 'text-primary-400' : 'text-neutral-500')}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Account footer */}
        <div className="border-t border-white/10 px-4 py-4">
          <div className="mb-3">
            <p className="text-xs font-semibold text-white truncate">
              {currentUser.fullName || currentUser.email || currentUser.sub}
            </p>
            <p className="text-xs text-neutral-400 mt-0.5">{roleLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void logout()}
              className="flex-1 text-neutral-400 hover:text-red-400 hover:bg-red-500/10"
            >
              {tAuth('logoutButton')}
            </Button>
          </div>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className={cn(
        'flex flex-col flex-1 min-w-0',
        'lg:pl-[var(--sidebar-width)]',
        'pb-16 lg:pb-0', // space for mobile bottom nav
      )}>
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-3 bg-white border-b border-neutral-200">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary-600 flex items-center justify-center">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-sm font-bold text-neutral-900">{tShell('productName')}</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <button
              onClick={() => void logout()}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              aria-label={tAuth('logoutButton')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>

      {/* ── Mobile Bottom Navigation ─────────────────────────────────────── */}
      <nav className={cn(
        'lg:hidden fixed bottom-0 inset-x-0 z-30',
        'bg-white border-t border-neutral-200',
        'flex items-stretch',
        'safe-area-inset-bottom',
      )}>
        {bottomPrimary.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 flex-1 py-2.5 px-1 min-w-0',
                'transition-colors',
                active ? 'text-primary-600' : 'text-neutral-400 hover:text-neutral-600',
              )}
            >
              <span className={cn(
                'p-1.5 rounded-xl transition-colors',
                active ? 'bg-primary-50' : 'bg-transparent',
              )}>
                {item.icon}
              </span>
              <span className="text-[10px] font-medium leading-none truncate max-w-[60px] text-center">
                {item.label}
              </span>
            </Link>
          );
        })}
        {/* More drawer trigger (simple dropdown) */}
        {bottomMore.length > 0 && (
          <MoreMenu items={bottomMore} pathname={pathname} moreLabel="More" />
        )}
      </nav>
    </div>
  );
}

/* ── More menu for secondary mobile nav items ─────────────────────────── */
function MoreMenu({ items, pathname, moreLabel }: { items: NavItem[]; pathname: string; moreLabel: string }) {
  const anyActive = items.some((i) => pathname === i.href || pathname.startsWith(`${i.href}/`));

  return (
    <div className="relative group flex-1">
      <button
        className={cn(
          'flex flex-col items-center justify-center gap-1 w-full py-2.5 px-1',
          'transition-colors',
          anyActive ? 'text-primary-600' : 'text-neutral-400',
        )}
      >
        <span className={cn(
          'p-1.5 rounded-xl transition-colors',
          anyActive ? 'bg-primary-50' : 'bg-transparent',
        )}>
          {icons.more}
        </span>
        <span className="text-[10px] font-medium leading-none">{moreLabel}</span>
      </button>
      {/* Dropdown */}
      <div className={cn(
        'absolute bottom-full right-0 mb-1',
        'bg-white rounded-xl border border-neutral-200 shadow-lg min-w-[140px]',
        'opacity-0 pointer-events-none group-focus-within:opacity-100 group-focus-within:pointer-events-auto',
        'transition-all duration-150',
      )}>
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 px-3 py-2.5 text-sm font-medium',
                'first:rounded-t-xl last:rounded-b-xl transition-colors',
                active
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-neutral-700 hover:bg-neutral-50',
              )}
            >
              <span className={active ? 'text-primary-500' : 'text-neutral-400'}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
