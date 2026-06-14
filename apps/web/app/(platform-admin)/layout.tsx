'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

function Icon({ d, ...p }: { d: string } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d={d} />
    </svg>
  );
}

const icons = {
  dashboard: <Icon d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  tenants: <Icon d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />,
  activity: <Icon d="M22 12h-4l-3 9L9 3l-3 9H2" />,
};

const navItems: NavItem[] = [
  { href: '/platform/dashboard', label: 'Dashboard', icon: icons.dashboard },
  { href: '/platform/tenants', label: 'Tenants', icon: icons.tenants },
  { href: '/platform/activity', label: 'Activity', icon: icons.activity },
];

export default function PlatformAdminLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.replace('/login');
      return;
    }
    if (!loading && currentUser && currentUser.role !== 'platform_admin') {
      router.replace('/dashboard');
    }
  }, [loading, currentUser, router]);

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-neutral-400">
          <svg className="animate-spin" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </div>
      </div>
    );
  }

  if (currentUser.role !== 'platform_admin') {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-neutral-950">
      {/* Sidebar */}
      <aside className={cn(
        'hidden lg:flex lg:flex-col',
        'fixed inset-y-0 left-0 z-30',
        'w-[var(--sidebar-width)] bg-neutral-900 text-white',
        'border-r border-white/10',
      )}>
        {/* Brand */}
        <div className="px-6 py-5 border-b border-white/10">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-3">
            Platform Admin
          </p>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-rose-600 flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <span className="text-base font-bold text-white">Paw8 Admin</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {navItems.map((item) => {
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
                <span className={cn('shrink-0', active ? 'text-rose-400' : 'text-neutral-500')}>
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
            <p className="text-xs text-neutral-400 mt-0.5">Platform Administrator</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void logout()}
            className="w-full text-neutral-400 hover:text-red-400 hover:bg-red-500/10"
          >
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className={cn(
        'flex flex-col flex-1 min-w-0',
        'lg:pl-[var(--sidebar-width)]',
      )}>
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-3 bg-neutral-900 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-rose-600 flex items-center justify-center">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <span className="text-sm font-bold text-white">Platform Admin</span>
          </div>
          <button
            onClick={() => void logout()}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        </header>

        {/* Mobile nav */}
        <nav className="lg:hidden flex border-b border-neutral-800 bg-neutral-900 overflow-x-auto">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors',
                  active
                    ? 'text-rose-400 border-b-2 border-rose-400'
                    : 'text-neutral-400 hover:text-white',
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 p-4 sm:p-6 bg-neutral-950">
          {children}
        </main>
      </div>
    </div>
  );
}
