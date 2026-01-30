'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: 'https://res.cloudinary.com/drec8g03e/image/upload/v1769717761/dashboard_dut33u.svg'
  },
  {
    label: 'Inventario',
    href: '/inventory',
    icon: 'https://res.cloudinary.com/drec8g03e/image/upload/v1769717761/inventario_sdhozi.svg'
  },
  {
    label: 'Cuentas',
    href: '/cuentas',
    icon: 'https://res.cloudinary.com/drec8g03e/image/upload/v1769717760/cuentas_uqp46t.svg'
  },
  {
    label: 'Clientes',
    href: '/clientes',
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

  const isActive = (href: string) =>
    pathname === href || (href === '/dashboard' && pathname === '/');

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-gradient-to-br from-pink-200 via-pink-300 to-rose-300 border-t border-rose-200 px-4 py-2 flex justify-around items-center z-50 md:hidden shadow-lg font-sans"
      style={{
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))',
      }}
    >
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`
            flex flex-col items-center justify-center transition-all duration-200 rounded-xl px-3 py-2 min-w-[60px] h-14
            ${isActive(item.href)
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