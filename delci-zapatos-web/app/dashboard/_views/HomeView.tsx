'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useDashboard } from '@/app/dashboard/DashboardContext';
import { FullAccountsTable } from '@/app/components/accounts/FullAccountsTable';
import { Button } from '@/app/components/commons/Button';
import type { AccountListResult } from '@/types/accountsRepository';

export default function HomeView() {
  const { setView } = useDashboard();
  const [accounts, set_accounts] = useState<AccountListResult[]>([]);
  const [is_loading_accounts, set_is_loading_accounts] = useState(false);
  const [accounts_error, set_accounts_error] = useState<string | null>(null);

  const load_accounts = useCallback(async () => {
    set_is_loading_accounts(true);
    set_accounts_error(null);

    try {
      const response = await fetch('/api/accounts', { cache: 'no-store' });
      const data = await response.json();

      if (!response.ok || !data?.ok) {
        set_accounts_error(data?.error || 'Error al cargar cuentas');
        set_accounts([]);
        return;
      }

      set_accounts((data.accounts ?? []) as AccountListResult[]);
    } catch (load_error) {
      console.error('Error loading accounts:', load_error);
      set_accounts_error('Error de conexion al servidor');
      set_accounts([]);
    } finally {
      set_is_loading_accounts(false);
    }
  }, []);

  useEffect(() => {
    void load_accounts();
  }, [load_accounts]);

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-8 w-full">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">¡Hola, Delci!</h1>
          <p className="text-sm text-gray-600 mt-1">
            Bienvenida a tu sistema de gestión. Aquí tienes el resumen de hoy.
          </p>
        </div>

        <Button
          onClick={() => setView({ key: 'accounts_new' })}
          className="w-fit self-end sm:self-auto flex items-center justify-center gap-2 py-3 px-5 shadow-lg hover:shadow-xl transition-all"
          size="lg"
        >
          <Plus className="w-5 h-5" />
          Crear cuenta
        </Button>
      </div>

      {is_loading_accounts ? (
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
      ) : accounts_error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 animate-content-fade-in">
          <p className="text-red-600">{accounts_error}</p>
          <Button
            onClick={load_accounts}
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
            onViewAccount={(account_id) => setView({ key: 'accounts_detail', accountId: account_id })}
            className="mb-6 sm:mb-8"
          />
        </div>
      )}
    </div>
  );
}
