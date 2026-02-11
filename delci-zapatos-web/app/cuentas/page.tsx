'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Navbar } from '@/app/components/shared/Navbar';
import { NavButton } from '@/app/components/shared/Navbutton';
import { FullAccountsTable } from '@/app/components/cuentas/FullAccountsTable';
import { Footer } from '@/app/components/shared/Footer';
import { Button } from '@/app/components/shared/Button';
import { mockAccounts } from '@/app/lib/mockData';
import type { Account } from '@/app/models/account';

export default function AccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>(mockAccounts);

  useEffect(() => {
    const raw = window.localStorage.getItem('delci_accounts');
    if (!raw) {
      window.localStorage.setItem('delci_accounts', JSON.stringify(mockAccounts));
      setAccounts(mockAccounts);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Account[];
      setAccounts(parsed);
    } catch {
      window.localStorage.setItem('delci_accounts', JSON.stringify(mockAccounts));
      setAccounts(mockAccounts);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem('delci_accounts', JSON.stringify(accounts));
  }, [accounts]);

  const handleViewAccount = (accountId: string) => {
    router.push(`/cuentas/${accountId}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-100 via-pink-50 to-rose-100 relative">
      <Navbar />
      <NavButton />

      <div className="flex-grow relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 md:pb-8 w-full">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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

            <Button
              onClick={() => router.push('/cuentas/nueva')}
              className="w-fit self-end flex items-center justify-center gap-2 py-3 px-6 sm:py-2 sm:px-4 text-base sm:text-sm shadow-lg hover:shadow-xl active:scale-95 transition-all"
              size="lg"
            >
              <Plus className="w-6 h-6 sm:w-5 sm:h-5" />
              Crear Cuenta
            </Button>
          </div>
        </div>

        {/* Accounts Table */}
        <FullAccountsTable
          accounts={accounts}
          onViewAccount={handleViewAccount}
          className="mb-6 sm:mb-8"
        />
      </div>

      <Footer />
    </div>
  );
}
