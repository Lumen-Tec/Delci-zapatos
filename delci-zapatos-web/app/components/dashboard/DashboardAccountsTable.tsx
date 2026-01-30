'use client';

import React, { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { Account } from '@/app/components/cuentas/FullAccountsTable';

interface DashboardAccountsTableProps {
  accounts: Account[];
  onViewAccount?: (accountId: string) => void;
  className?: string;
}

interface FilterState {
  accountId: string;
  client: string;
  status: string;
}

export const DashboardAccountsTable = ({ accounts, onViewAccount, className = '' }: DashboardAccountsTableProps) => {
  const [filters, setFilters] = useState<FilterState>({
    accountId: '',
    client: '',
    status: 'all',
  });

  // Filter accounts based on filters
  const filteredAccounts = accounts.filter(account => {
    const matchesId = !filters.accountId || account.id.includes(filters.accountId);
    const matchesClient = !filters.client || account.clientName.toLowerCase().includes(filters.client.toLowerCase());
    const matchesStatus = filters.status === 'all' || account.status === filters.status;

    return matchesId && matchesClient && matchesStatus;
  });

  const handleFilterChange = (field: keyof FilterState, value: string) => {
    setFilters({
      ...filters,
      [field]: value,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
    }).format(amount);
  };

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

  return (
    <div className={`bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Cuentas</h2>
            <p className="text-sm text-gray-500 mt-1">Gestiona las cuentas y abonos de los clientes</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-col lg:flex-row gap-4">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                  value={filters.client}
                  onChange={(e) => handleFilterChange('client', e.target.value)}
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
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {/* ID - Hidden on mobile */}
              <th className="hidden md:table-cell px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                ID
              </th>
              {/* Cliente - Always visible */}
              <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Cliente
              </th>
              {/* Productos - Hidden on mobile */}
              <th className="hidden lg:table-cell px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Productos
              </th>
              {/* Monto Total - Hidden on mobile */}
              <th className="hidden md:table-cell px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Monto Total
              </th>
              {/* Estado - Always visible */}
              <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Estado
              </th>
              {/* Acción - Always visible */}
              <th className="px-4 sm:px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Acción
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-50">
            {filteredAccounts.map((account, index) => (
              <tr
                key={account.id}
                className={`hover:bg-pink-50/30 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
              >
                {/* ID - Hidden on mobile */}
                <td className="hidden md:table-cell px-4 sm:px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-100 text-sm font-mono font-medium text-gray-700">
                    #{account.id}
                  </span>
                </td>
                {/* Cliente - Always visible, shows more info on mobile */}
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">{account.clientName}</span>
                    {/* Show ID and amount on mobile as subtitle */}
                    <span className="md:hidden text-xs text-gray-500 mt-0.5">
                      #{account.id} · {formatCurrency(account.totalAmount)}
                    </span>
                  </div>
                </td>
                {/* Productos - Hidden on mobile */}
                <td className="hidden lg:table-cell px-4 sm:px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-700">
                    {account.totalProducts}
                  </span>
                </td>
                {/* Monto Total - Hidden on mobile */}
                <td className="hidden md:table-cell px-4 sm:px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(account.totalAmount)}
                  </span>
                </td>
                {/* Estado - Always visible */}
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(account.status)}
                </td>
                {/* Acción - Always visible */}
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-center">
                  <button
                    onClick={() => onViewAccount?.(account.id)}
                    className="inline-flex items-center justify-center px-3 py-2 rounded-xl text-pink-600 hover:text-white bg-pink-50 hover:bg-pink-500 transition-all duration-200 shadow-sm hover:shadow-md text-xs font-medium whitespace-nowrap"
                    title="Ver cuenta"
                  >
                    Ver cuenta
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm text-gray-600">
            Mostrando <span className="font-medium text-gray-900">{filteredAccounts.length}</span> de{' '}
            <span className="font-medium text-gray-900">{accounts.length}</span> cuentas
          </div>
          <div className="flex gap-4 text-sm">
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
