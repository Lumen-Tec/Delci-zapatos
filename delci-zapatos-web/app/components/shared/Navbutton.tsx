'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useDashboardOptional } from '@/app/dashboard/DashboardContext';

interface NavItem {
  label: string;
  href: string;
  icon: string;
  dashboardView?: 'home' | 'clients' | 'products_list' | 'accounts';
  dashboardAliases?: Array<'home' | 'clients' | 'products_list' | 'accounts'>;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    dashboardView: 'home',
    icon: 'https://res.cloudinary.com/drec8g03e/image/upload/v1769717761/dashboard_dut33u.svg'
  },
  {
    label: 'Inventario',
    href: '/dashboard',
    dashboardView: 'products_list',
    dashboardAliases: ['products_list'],
    icon: 'https://res.cloudinary.com/drec8g03e/image/upload/v1769717761/inventario_sdhozi.svg'
  },
  {
    label: 'Cuentas',
    href: '/dashboard',
    dashboardView: 'accounts',
    dashboardAliases: ['accounts'],
    icon: 'https://res.cloudinary.com/drec8g03e/image/upload/v1769717760/cuentas_uqp46t.svg'
  },
  {
    label: 'Clientes',
    href: '/dashboard',
    dashboardView: 'clients',
    icon: 'https://res.cloudinary.com/drec8g03e/image/upload/v1769717760/clientes_t9s3kf.svg'
  },
];

const NavIcon = ({ src, alt, className }: { src: string; alt: string; className?: string }) => (
  <Image
    src={src}
    alt={alt}
    width={24}
    height={24}
    className={className}
  />
);

export const NavButton = () => {
  const pathname = usePathname();
  const dashboard = useDashboardOptional();
  const [activeDashboardView, setActiveDashboardView] = React.useState<'home' | 'clients' | 'products_list' | 'accounts'>('home');

  const normalizedDashboardView = React.useMemo<'home' | 'clients' | 'products_list' | 'accounts'>(() => {
    const currentKey = dashboard?.view.key;

    if (currentKey === 'clients') return 'clients';
    if (currentKey === 'products_list' || currentKey === 'products_new') return 'products_list';
    if (currentKey === 'accounts' || currentKey === 'accounts_new' || currentKey === 'accounts_detail') return 'accounts';
    if (currentKey === 'home') return 'home';

    return activeDashboardView;
  }, [dashboard?.view.key, activeDashboardView]);

  React.useEffect(() => {
    if (pathname !== '/dashboard') return;

    try {
      const stored = localStorage.getItem('delci_dashboard_view');
      if (!stored) return;

      const parsed = JSON.parse(stored);
      if (parsed?.key === 'clients') {
        setActiveDashboardView('clients');
      } else if (parsed?.key === 'products_list') {
        setActiveDashboardView('products_list');
      } else if (parsed?.key === 'accounts') {
        setActiveDashboardView('accounts');
      } else {
        setActiveDashboardView('home');
      }
    } catch {
      setActiveDashboardView('home');
    }
  }, [pathname]);

  const handleDashboardNavigation = (view: 'home' | 'clients' | 'products_list' | 'accounts') => {
    localStorage.setItem('delci_dashboard_view', JSON.stringify({ key: view }));
    setActiveDashboardView(view);

    if (!dashboard) return;

    if (view === 'home') {
      dashboard.setView({ key: 'home' });
    } else if (view === 'products_list') {
      dashboard.setView({ key: 'products_list' });
    } else if (view === 'accounts') {
      dashboard.setView({ key: 'accounts' });
    } else {
      dashboard.setView({ key: 'clients' });
    }
  };

  const isActive = (item: NavItem) => {
    if (item.dashboardView) {
      if (pathname !== '/dashboard') return false;

      if (normalizedDashboardView === item.dashboardView) return true;

      return item.dashboardAliases?.includes(normalizedDashboardView) ?? false;
    }

    return pathname === item.href;
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-gradient-to-br from-pink-200 via-pink-300 to-rose-300 border-t border-rose-200 px-4 py-2 flex justify-around items-center z-50 md:hidden shadow-lg font-sans"
      style={{
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))',
      }}
    >
      {navItems.map((item) => (
        <Link
          key={`${item.href}-${item.label}`}
          href={item.href}
          onClick={(event) => {
            if (item.dashboardView) {
              if (pathname === '/dashboard') {
                event.preventDefault();
              }
              handleDashboardNavigation(item.dashboardView);
            }
          }}
          className={`
            flex flex-col items-center justify-center transition-all duration-200 rounded-xl px-3 py-2 min-w-[60px] h-14
            ${isActive(item)
              ? 'bg-white/90 text-rose-700 shadow-lg backdrop-blur-sm border border-rose-200'
              : 'text-gray-700 hover:text-rose-700 hover:bg-white/60 hover:shadow-md'
            }
          `}
        >
          <NavIcon
            src={item.icon}
            alt={item.label}
            className="w-6 h-6 mb-1"
          />
          <span className="text-xs font-medium tracking-tight">{item.label}</span>
        </Link>
      ))}
    </div>
  );
};

NavButton.displayName = 'NavButton';