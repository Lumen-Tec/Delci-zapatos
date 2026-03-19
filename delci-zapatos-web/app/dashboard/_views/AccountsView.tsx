'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Plus } from 'lucide-react';
import { useDashboard } from '@/app/dashboard/DashboardContext';
import { FullAccountsTable } from '@/app/components/accounts/FullAccountsTable';
import { Button } from '@/app/components/commons/Button';
import type { Account } from '@/models/account';

export default function AccountsView() {
  const { setView } = useDashboard();
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    // TODO: Cargar cuentas desde API.
    // const response = await fetch('/api/accounts', { cache: 'no-store' });
    // const data = (await response.json()) as Account[];
    // setAccounts(data);
    setAccounts([]);
  }, []);

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 md:pb-8 w-full">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg">
              <Image
                src="https://res.cloudinary.com/drec8g03e/image/upload/v1769717760/cuentas_uqp46t.svg"
                alt="Cuentas"
                width={24}
                height={24}
                className="w-6 h-6"
              />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Cuentas</h1>
              <p className="text-sm text-gray-600 mt-1">Gestiona las cuentas y abonos de los clientes</p>
            </div>
          </div>

          <Button
            onClick={() => setView({ key: 'accounts_new' })}
            className="w-fit self-end flex items-center justify-center gap-2 py-3 px-6 sm:py-2 sm:px-4 text-base sm:text-sm shadow-lg hover:shadow-xl active:scale-95 transition-all"
            size="lg"
          >
            <Plus className="w-6 h-6 sm:w-5 sm:h-5" />
            Crear cuenta
          </Button>
        </div>
      </div>
      <FullAccountsTable
        accounts={accounts}
        onViewAccount={(accountId) => setView({ key: 'accounts_detail', accountId })}
        className="mb-6 sm:mb-8"
      />
    </div>
  );
}
