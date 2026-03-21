'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
    width={20}
    height={20}
    className={className}
  />
);

export const Navbar = React.memo(() => {
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
    <nav className="sticky top-0 z-50 w-full bg-gradient-to-br from-pink-200/90 via-pink-300/90 to-rose-300/90 backdrop-blur-md border-b border-rose-200/50 shadow-sm font-sans">
      <div className="flex items-center justify-between max-w-7xl mx-auto px-4 py-2">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center shrink-0">
          <div className="relative h-16 w-32">
            <Image
              src="https://res.cloudinary.com/drec8g03e/image/upload/v1772501928/delci-zapatos_jhguv9.png"
              alt="Delci Zapatos Logo"
              fill
              className="object-contain object-left"
              priority
              sizes="128px"
            />
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center justify-center flex-1 gap-2 lg:gap-3">
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
                px-3 md:px-4 py-2 rounded-lg font-medium text-base transition-all duration-200 flex items-center gap-2 tracking-tight border
                ${isActive(item)
                  ? 'bg-white/90 text-rose-700 shadow-lg backdrop-blur-sm border-rose-200'
                  : 'text-gray-700 hover:text-rose-700 hover:bg-white/60 hover:shadow-md border-transparent'
                }
              `}
            >
              <NavIcon 
                src={item.icon} 
                alt={item.label}
                className="w-4 h-4"
              />
              <span className="hidden md:inline">{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Desktop Spacer */}
        <div className="hidden md:block w-24 shrink-0" />

        {/* Mobile Spacer - Empty since we use bottom nav */}
        <div className="md:hidden w-10 shrink-0" />
      </div>
    </nav>
  );
});

Navbar.displayName = 'Navbar';