'use client';

import React from 'react';
import Image from 'next/image';
import { Navbar } from '@/app/components/shared/Navbar';
import { NavButton } from '@/app/components/shared/Navbutton';
import { FullAccountsTable } from '@/app/components/cuentas/FullAccountsTable';
import { Footer } from '@/app/components/shared/Footer';
import { mockAccounts } from '@/app/lib/mockData';

export default function AccountsPage() {
  const handleViewAccount = (accountId: string) => {
    console.log(`View account: ${accountId}`);
    // TODO: Implement account detail view
  };

  const handleCreateAccount = () => {
    console.log('Create account clicked');
    // TODO: Implement create account modal
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-100 via-pink-50 to-rose-100 relative overflow-hidden">
      <Navbar />
      <NavButton />

      <div className="flex-grow relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 md:pb-8 w-full">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg">
              <Image
                src="https://res.cloudinary.com/drec8g03e/image/upload/v1769717760/cuentas_uqp46t.svg"
                alt="Cuentas"
                width={24}
                height={24}
                className="w-6 h-6 text-white"
              />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Cuentas</h1>
              <p className="text-sm text-gray-600 mt-1">Gestiona las cuentas y abonos de los clientes</p>
            </div>
          </div>
        </div>

        {/* Accounts Table */}
        <FullAccountsTable
          accounts={mockAccounts}
          onViewAccount={handleViewAccount}
          className="mb-6 sm:mb-8"
        />
      </div>

      <Footer />
    </div>
  );
}
