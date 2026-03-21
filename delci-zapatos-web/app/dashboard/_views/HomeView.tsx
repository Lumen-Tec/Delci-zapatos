'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useDashboard } from '@/app/dashboard/DashboardContext';
import { WelcomeSection } from '@/app/components/dashboard/WelcomeSection';
import { StatCard } from '@/app/components/dashboard/StatCard';
import { DashboardAccountsTable } from '@/app/components/dashboard/DashboardAccountsTable';
import { SupportPanel } from '@/app/components/dashboard/SupportPanel';
import { Button } from '@/app/components/commons/Button';
import type { AccountListResult } from '@/types/accountsRepository';
import type { Client } from '@/models/client';

export default function Dashboard() {
  const { setView } = useDashboard();
  const [accounts, setAccounts] = useState<AccountListResult[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [accountsResponse, clientsResponse] = await Promise.all([
        fetch('/api/accounts', { cache: 'no-store' }),
        fetch('/api/clients', { cache: 'no-store' }),
      ]);

      const [accountsData, clientsData] = await Promise.all([
        accountsResponse.json(),
        clientsResponse.json(),
      ]);

      if (!accountsResponse.ok || !accountsData?.ok) {
        throw new Error(accountsData?.error || 'Error al cargar cuentas');
      }

      if (!clientsResponse.ok || !clientsData?.ok) {
        throw new Error(clientsData?.error || 'Error al cargar clientes');
      }

      setAccounts((accountsData.accounts ?? []) as AccountListResult[]);
      setClients((clientsData.clients ?? []) as Client[]);
    } catch (loadError) {
      console.error('Error loading dashboard data:', loadError);
      setAccounts([]);
      setClients([]);
      setError('Error al cargar datos del dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const pendingAccountsCount = useMemo(() => {
    return accounts.filter((account) => account.remainingAmount > 0).length;
  }, [accounts]);

  const handleCardAction = (action: string) => {
    console.log(`Action: ${action}`);
    switch (action) {
      case 'view-clients':
        setView({ key: 'clients' });
        break;
      case 'add-product':
        setView({ key: 'products_list' });
        break;
      case 'view-accounts':
        setView({ key: 'accounts' });
        break;
      case 'view-alerts':
        setView({ key: 'accounts' });
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const handleViewDetail = (accountId: string) => {
    setView({ key: 'accounts_detail', accountId });
  };

  // Icons for cards - using same icons as navbar
  const inventoryIcon = (
    <Image
      src="https://res.cloudinary.com/drec8g03e/image/upload/v1769717761/inventario_sdhozi.svg"
      alt="Inventario"
      width={24}
      height={24}
      className="w-6 h-6"
    />
  );

  const accountsIcon = (
    <Image
      src="https://res.cloudinary.com/drec8g03e/image/upload/v1769717760/cuentas_uqp46t.svg"
      alt="Cuentas"
      width={24}
      height={24}
      className="w-6 h-6"
    />
  );

  const clientsIcon = (
    <Image
      src="https://res.cloudinary.com/drec8g03e/image/upload/v1769717760/clientes_t9s3kf.svg"
      alt="Clientes"
      width={24}
      height={24}
      className="w-6 h-6"
    />
  );

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 md:pb-8 w-full">
        {/* Welcome Section */}
        <WelcomeSection />

        {/* Stats Cards */}
        {isLoading ? (
          <div className="mb-6 sm:mb-8 animate-pulse">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-32 rounded-2xl border border-gray-100 bg-gray-50" />
              ))}
            </div>
            <div className="h-72 rounded-2xl border border-gray-100 bg-gray-50" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 sm:mb-8 animate-content-fade-in">
            <p className="text-red-600">{error}</p>
            <Button
              onClick={loadDashboardData}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              Reintentar
            </Button>
          </div>
        ) : (
          <div className="animate-content-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <StatCard
                title="Mi inventario"
                value={0}
                description="productos en inventario/bodega"
                icon={inventoryIcon}
                buttonText="Ver inventario"
                color="blue"
                onButtonClick={() => handleCardAction('add-product')}
              />

              <StatCard
                title="Cuentas de clientes"
                value={pendingAccountsCount}
                description="Total de cuentas"
                icon={accountsIcon}
                buttonText="Ver cuentas"
                color="orange"
                onButtonClick={() => handleCardAction('view-accounts')}
              />

              <StatCard
                title="Mis clientes"
                value={clients.length}
                description="Total de clientes"
                icon={clientsIcon}
                buttonText="Ver clientes"
                color="green"
                onButtonClick={() => handleCardAction('view-clients')}
              />
            </div>

            <DashboardAccountsTable
              accounts={accounts}
              onViewAccount={handleViewDetail}
              className="mb-6 sm:mb-8"
            />
          </div>
        )}

        {/* Support Panel */}
        <SupportPanel />
    </div>
  );
}