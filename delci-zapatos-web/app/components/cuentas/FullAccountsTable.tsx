'use client';

import React, { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { Button } from '@/app/components/shared/Button';
import Image from 'next/image';

export interface Account {
  id: string;
  clientId: string;
  clientName: string;
  totalAmount: number;
  totalPaid: number;
  remainingAmount: number;
  totalProducts: number;
  status: 'active' | 'paid' | 'overdue';
  lastPaymentDate?: string;
  nextPaymentDate?: string;
}

export interface AccountFilterState {
  accountId: string;
  clientName: string;
  status: string;
}

interface FullAccountsTableProps {
  accounts: Account[];
  onViewAccount?: (accountId: string) => void;
  className?: string;
}

export const FullAccountsTable = ({ accounts, onViewAccount, className = '' }: FullAccountsTableProps) => {
  const [filters, setFilters] = useState<AccountFilterState>({
    accountId: '',
    clientName: '',
    status: 'all',
  });

  const handleFilterChange = (filterType: keyof AccountFilterState, value: string) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const filteredAccounts = accounts.filter(account => {
    const matchesId = !filters.accountId || account.id.includes(filters.accountId);
    const matchesClient = !filters.clientName || account.clientName.toLowerCase().includes(filters.clientName.toLowerCase());
    const matchesStatus = filters.status === 'all' || account.status === filters.status;

    return matchesId && matchesClient && matchesStatus;
  });

  const getStatusBadge = (status: Account['status']) => {
    const styles = {
      active: 'bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border-amber-200 shadow-sm',
      paid: 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-200 shadow-sm',
      overdue: 'bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-red-200 shadow-sm',
    };

    const labels = {
      active: 'Activa',
      paid: 'Pagada',
      overdue: 'Vencida',
    };

    return (
      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className={`bg-white rounded-2xl shadow-lg border border-gray-100 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Cuentas</h2>
            <p className="text-sm text-gray-500 mt-1">Gestiona las cuentas y abonos de los clientes</p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => console.log('Create account clicked')}
          >
            Crear Cuenta
          </Button>
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3">
            {/* ID Cuenta */}
            <div>
              <label htmlFor="account-id" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                ID Cuenta
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  id="account-id"
                  type="text"
                  value={filters.accountId}
                  onChange={(e) => handleFilterChange('accountId', e.target.value)}
                  placeholder="Ej: ACC001"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 hover:border-gray-300 placeholder:text-gray-400 shadow-sm"
                />
              </div>
            </div>

            {/* Nombre Cliente */}
            <div>
              <label htmlFor="client-name-filter" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Cliente
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  id="client-name-filter"
                  type="text"
                  value={filters.clientName}
                  onChange={(e) => handleFilterChange('clientName', e.target.value)}
                  placeholder="Buscar cliente..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 hover:border-gray-300 placeholder:text-gray-400 shadow-sm"
                />
              </div>
            </div>

            {/* Estado */}
            <div>
              <label htmlFor="status-filter" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Estado
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="w-4 h-4 text-gray-400" />
                </div>
                <select
                  id="status-filter"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 hover:border-gray-300 appearance-none shadow-sm"
                >
                  <option value="all">Todos</option>
                  <option value="active">Activa</option>
                  <option value="paid">Pagada</option>
                  <option value="overdue">Vencida</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="hidden sm:table-cell px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Cuenta
                </th>
                <th className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Cliente
                </th>
                <th className="hidden sm:table-cell px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Productos
                </th>
                <th className="hidden md:table-cell px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Total
                </th>
                <th className="hidden lg:table-cell px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Pagado
                </th>
                <th className="hidden lg:table-cell px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Restante
                </th>
                <th className="hidden sm:table-cell px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Estado
                </th>
                <th className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Acciones
                </th>
              </tr>
            </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAccounts.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No se encontraron cuentas</h3>
                    <p className="text-gray-500">Intenta ajustar los filtros de búsqueda</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredAccounts.map((account) => (
                <tr key={account.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="hidden sm:table-cell px-1 sm:px-2 md:px-3 lg:px-6 py-1.5 sm:py-2 md:py-3 lg:py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 bg-pink-100 rounded-lg flex items-center justify-center mr-1 sm:mr-2 md:mr-3">
                        <span className="text-pink-600 font-semibold text-xs">ACC</span>
                      </div>
                      <span className="text-xs sm:text-xs md:text-sm lg:text-sm font-medium text-gray-900 truncate max-w-[60px] sm:max-w-[80px]">#{account.id}</span>
                    </div>
                  </td>
                  <td className="px-1 sm:px-2 md:px-3 lg:px-6 py-1.5 sm:py-2 md:py-3 lg:py-4 whitespace-nowrap">
                    <div>
                      <div className="text-xs sm:text-xs md:text-sm lg:text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-[150px] md:max-w-[200px]">{account.clientName}</div>
                      <div className="sm:hidden text-xs text-gray-500 mt-0.5">
                        #{account.id} • {account.totalProducts} productos • {account.status === 'active' ? 'Activa' : account.status === 'paid' ? 'Pagada' : 'Vencida'}
                      </div>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-1 sm:px-2 md:px-3 lg:px-6 py-1.5 sm:py-2 md:py-3 lg:py-4 whitespace-nowrap">
                    <div className="text-xs sm:text-xs md:text-sm lg:text-sm text-gray-900">{account.totalProducts}</div>
                  </td>
                  <td className="hidden md:table-cell px-1 sm:px-2 md:px-3 lg:px-6 py-1.5 sm:py-2 md:py-3 lg:py-4 whitespace-nowrap">
                    <div className="text-xs sm:text-xs md:text-sm lg:text-sm font-medium text-gray-900">
                      {formatCurrency(account.totalAmount)}
                    </div>
                  </td>
                  <td className="hidden lg:table-cell px-1 sm:px-2 md:px-3 lg:px-6 py-1.5 sm:py-2 md:py-3 lg:py-4 whitespace-nowrap">
                    <div className="text-xs sm:text-xs md:text-sm lg:text-sm text-gray-900">
                      {formatCurrency(account.totalPaid)}
                    </div>
                  </td>
                  <td className="hidden lg:table-cell px-1 sm:px-2 md:px-3 lg:px-6 py-1.5 sm:py-2 md:py-3 lg:py-4 whitespace-nowrap">
                    <div className="text-xs sm:text-xs md:text-sm lg:text-sm font-medium text-gray-900">
                      {formatCurrency(account.remainingAmount)}
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-1 sm:px-2 md:px-3 lg:px-6 py-1.5 sm:py-2 md:py-3 lg:py-4 whitespace-nowrap">
                    {getStatusBadge(account.status)}
                  </td>
                  <td className="px-1 sm:px-2 md:px-3 lg:px-6 py-1.5 sm:py-2 md:py-3 lg:py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => onViewAccount?.(account.id)}
                      className="inline-flex items-center justify-center px-3 sm:px-4 py-1.5 sm:py-2 md:py-2 rounded-lg text-pink-600 hover:text-white bg-pink-50 hover:bg-pink-500 transition-all duration-200 shadow-sm hover:shadow-md text-xs font-medium whitespace-nowrap min-w-[60px] sm:min-w-[80px]"
                      title="Ver cuenta"
                    >
                      <span className="hidden sm:inline">Ver cuenta</span>
                      <span className="sm:hidden">Ver</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer with stats */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-2xl">
        <div className="flex flex-col gap-4">
          <div className="text-sm text-gray-600 text-center">
            Mostrando <span className="font-medium text-gray-900">{filteredAccounts.length}</span> de{' '}
            <span className="font-medium text-gray-900">{accounts.length}</span> cuentas
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
              <span className="text-gray-600">Activas: {accounts.filter(a => a.status === 'active').length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              <span className="text-gray-600">Pagadas: {accounts.filter(a => a.status === 'paid').length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-600">Vencidas: {accounts.filter(a => a.status === 'overdue').length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
