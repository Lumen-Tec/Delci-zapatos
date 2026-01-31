'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
    href: '/inventario', 
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
    width={20}
    height={20}
    className={className}
  />
);

export const Navbar = React.memo(() => {
  const pathname = usePathname();

  const isActive = (href: string) => 
    pathname === href || (href === '/dashboard' && pathname === '/');

  return (
    <nav className="sticky top-0 z-50 w-full bg-gradient-to-br from-pink-200/90 via-pink-300/90 to-rose-300/90 backdrop-blur-md border-b border-rose-200/50 shadow-sm font-sans">
      <div className="flex items-center justify-between max-w-7xl mx-auto px-4 py-2">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center shrink-0">
          <div className="relative h-16 w-32">
            <Image
              src="https://res.cloudinary.com/drec8g03e/image/upload/f_webp/delci_zapatos_er5sri"
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
              key={item.href}
              href={item.href}
              className={`
                px-3 md:px-4 py-2 rounded-lg font-medium text-base transition-all duration-200 flex items-center gap-2 tracking-tight
                ${isActive(item.href)
                  ? 'bg-white/90 text-rose-700 shadow-lg backdrop-blur-sm border border-rose-200'
                  : 'text-gray-700 hover:text-rose-700 hover:bg-white/60 hover:shadow-md'
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