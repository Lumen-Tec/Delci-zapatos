'use client';

import React, { useState } from 'react';
import { Navbar } from '@/app/components/shared/Navbar';
import { NavButton } from '@/app/components/shared/Navbutton';
import { WelcomeSection } from '@/app/components/dashboard/WelcomeSection';
import { StatCard } from '@/app/components/dashboard/StatCard';
import { AccountsTableWithFilters, FilterState } from '@/app/components/dashboard/AccountsTableWithFilters';
import { SupportPanel } from '@/app/components/dashboard/SupportPanel';
import { Footer } from '@/app/components/shared/Footer';
import { mockStats, mockAccounts } from '@/app/lib/mockData';

export default function Dashboard() {
  const [filters, setFilters] = useState<FilterState>({
    accountId: '',
    client: '',
    status: 'all',
  });

  // Filter accounts based on filters
  const filteredAccounts = mockAccounts.filter(account => {
    const matchesId = !filters.accountId || account.id.includes(filters.accountId);
    const matchesClient = !filters.client || account.client.toLowerCase().includes(filters.client.toLowerCase());
    const matchesStatus = filters.status === 'all' || account.status === filters.status;

    return matchesId && matchesClient && matchesStatus;
  });

  const handleCardAction = (action: string) => {
    console.log(`Action: ${action}`);
    // TODO: Implement navigation logic
  };

  const handleViewDetail = (accountId: string) => {
    console.log(`View detail for account: ${accountId}`);
    // TODO: Implement detail view
  };

  // Icons for cards - using same icons as navbar
  const inventoryIcon = (
    <img
      src="https://res.cloudinary.com/drec8g03e/image/upload/v1769717761/inventario_sdhozi.svg"
      alt="Inventario"
      className="w-6 h-6"
    />
  );

  const accountsIcon = (
    <img
      src="https://res.cloudinary.com/drec8g03e/image/upload/v1769717760/cuentas_uqp46t.svg"
      alt="Cuentas"
      className="w-6 h-6"
    />
  );

  const clientsIcon = (
    <img
      src="https://res.cloudinary.com/drec8g03e/image/upload/v1769717760/clientes_t9s3kf.svg"
      alt="Clientes"
      className="w-6 h-6"
    />
  );

  const alertsIcon = (
    <img
      src="https://res.cloudinary.com/drec8g03e/image/upload/v1769731416/alert_ur8ndd.svg"
      alt="Alertas"
      className="w-6 h-6"
    />
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-100 via-pink-50 to-rose-100 relative overflow-hidden">
      <Navbar />
      <NavButton />

      <div className="flex-grow relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full">
        {/* Welcome Section */}
        <WelcomeSection />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <StatCard
            title="Mi inventario"
            value={mockStats.inventory.total}
            description={mockStats.inventory.description}
            icon={inventoryIcon}
            buttonText="Agregar producto"
            color="blue"
            onButtonClick={() => handleCardAction('add-product')}
          />

          <StatCard
            title="Cuentas pendientes"
            value={mockStats.pendingAccounts.total}
            description={mockStats.pendingAccounts.description}
            icon={accountsIcon}
            buttonText="Ver cuentas"
            color="orange"
            onButtonClick={() => handleCardAction('view-accounts')}
          />

          <StatCard
            title="Mis clientes"
            value={mockStats.clients.total}
            description={mockStats.clients.description}
            icon={clientsIcon}
            buttonText="Ver clientes"
            color="green"
            onButtonClick={() => handleCardAction('view-clients')}
          />

          <StatCard
            title="Alertas de pago"
            value={mockStats.paymentAlerts.total}
            description={mockStats.paymentAlerts.description}
            icon={alertsIcon}
            buttonText="Ver cuentas"
            color="pink"
            buttonVariant="outline"
            onButtonClick={() => handleCardAction('view-alerts')}
          />
        </div>

        {/* Accounts Table with Filters */}
        <AccountsTableWithFilters
          accounts={mockAccounts}
          onViewDetail={handleViewDetail}
          className="mb-6 sm:mb-8"
        />

        {/* Support Panel */}
        <SupportPanel />
      </div>

      <Footer />
    </div>
  );
}