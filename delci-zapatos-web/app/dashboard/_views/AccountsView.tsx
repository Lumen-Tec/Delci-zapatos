'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Plus } from 'lucide-react';
import { useDashboard } from '@/app/dashboard/DashboardContext';
import { FullAccountsTable } from '@/app/components/accounts/FullAccountsTable';
import { Button } from '@/app/components/commons/Button';
import type { AccountListResult } from '@/types/accountsRepository';

export default function AccountsView() {
  const { setView } = useDashboard();
  const [accounts, setAccounts] = useState<AccountListResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAccounts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/accounts', { cache: 'no-store' });
      const data = await response.json();

      if (!response.ok || !data?.ok) {
        setError(data?.error || 'Error al cargar cuentas');
        setAccounts([]);
        return;
      }

      setAccounts((data.accounts ?? []) as AccountListResult[]);
    } catch (loadError) {
      console.error('Error loading accounts:', loadError);
      setError('Error de conexión al servidor');
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
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
      {isLoading ? (
        <div className="animate-pulse">
          <div className="h-16 rounded-t-2xl border border-gray-100 bg-gray-50"></div>
          <div className="h-96 rounded-b-2xl border-x border-b border-gray-100 bg-white">
            <div className="space-y-3 p-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-10 rounded-lg bg-gray-100" />
              ))}
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 animate-content-fade-in">
          <p className="text-red-600">{error}</p>
          <Button
            onClick={loadAccounts}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            Reintentar
          </Button>
        </div>
      ) : (
        <div className="animate-content-fade-in">
          <FullAccountsTable
            accounts={accounts}
            onViewAccount={(accountId) => setView({ key: 'accounts_detail', accountId })}
            className="mb-6 sm:mb-8"
          />
        </div>
      )}
    </div>
  );
}
