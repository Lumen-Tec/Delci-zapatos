'use client';
import React from 'react';
import { useDashboard } from '@/app/dashboard/DashboardContext';
import { DashboardShell } from '@/app/dashboard/DashboardShell';
import HomeView from '@/app/dashboard/_views/HomeView';
import { ProductsListView } from '@/app/dashboard/_views/ProductsListView';
import { ProductsCreateView } from '@/app/dashboard/_views/ProductsCreateView';
import { ClientsView } from '@/app/dashboard/_views/ClientsView';
import AccountsView from './_views/AccountsView';
import AccountsCreateView from './_views/AccountsCreateView';
import AccountsDetailView from './_views/AccountsDetailView';

export function DashboardContent() {
  const { view } = useDashboard();

  let content: React.ReactNode;

  if (view.key === 'home') {
    content = <HomeView />;
  } else if (view.key === 'products_list') {
    content = <ProductsListView />;
  } else if (view.key === 'products_new') {
    content = <ProductsCreateView />;
  } else if (view.key === 'clients') {
    content = <ClientsView />;
  } else if (view.key === 'accounts') {
    content = <AccountsView />;
  } else if (view.key === 'accounts_new') {
    content = <AccountsCreateView />;
  } else if (view.key === 'accounts_detail') {
    content = <AccountsDetailView />;
  } else {
    content = (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="rounded-xl border border-rose-200 bg-white/90 p-4 text-sm text-rose-700">
          Vista no implementada.
        </div>
      </div>
    );
  }

  return <DashboardShell>{content}</DashboardShell>;
}