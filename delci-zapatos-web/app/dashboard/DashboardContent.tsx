'use client';
import React from 'react';
import { useDashboard } from '@/app/dashboard/DashboardContext';
import { Navbar } from '@/app/components/shared/Navbar';
import { Footer } from '@/app/components/shared/Footer';
import HomeView from './_views/HomeView';
import AccountsCreateView from './_views/AccountsCreateView';
import AccountsDetailView from './_views/AccountsDetailView';

export function DashboardContent() {
  const { view } = useDashboard();

  let content: React.ReactNode;

  if (view.key === 'home') {
    content = <HomeView />;
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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-100 via-pink-50 to-rose-100 relative">
      <Navbar />
      <main className="flex-grow relative z-10 w-full">{content}</main>
      <Footer />
    </div>
  );
}