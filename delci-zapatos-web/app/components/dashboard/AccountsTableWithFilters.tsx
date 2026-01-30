'use client';

import React, { useState } from 'react';

export interface Account {
  id: string;
  client: string;
  productCount: number;
  totalAmount: number;
  status: 'pending' | 'paid';
}

export interface FilterState {
  accountId: string;
  client: string;
  status: 'all' | 'pending' | 'paid';
}

interface AccountsTableWithFiltersProps {
  accounts: Account[];
  onViewDetail?: (accountId: string) => void;
  className?: string;
}

// Search icon component
const SearchIcon = () => (
  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

// Filter icon component
const FilterIcon = () => (
  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

export const AccountsTableWithFilters = React.memo<AccountsTableWithFiltersProps>(({
  accounts,
  onViewDetail,
  className = '',
}) => {
  const [filters, setFilters] = useState<FilterState>({
    accountId: '',
    client: '',
    status: 'all',
  });

  // Filter accounts based on filters
  const filteredAccounts = accounts.filter(account => {
    const matchesId = !filters.accountId || account.id.includes(filters.accountId);
    const matchesClient = !filters.client || account.client.toLowerCase().includes(filters.client.toLowerCase());
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
      pending: 'bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border-amber-200 shadow-sm',
      paid: 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-200 shadow-sm',
    };

    const labels = {
      pending: 'Pendiente',
      paid: 'Pagado',
    };

    const icons = {
      pending: (
        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
      ),
      paid: (
        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status]}`}>
        {icons[status]}
        {labels[status]}
      </span>
    );
  };

  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden ${className}`}>
      {/* Header with Filters */}
      <div className="px-4 sm:px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-pink-50/50 via-white to-rose-50/50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Title */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></span>
              Cuentas Recientes
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              <span className="font-medium text-pink-600">{filteredAccounts.length}</span> de {accounts.length} cuentas encontradas
            </p>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 lg:max-w-2xl">
            {/* ID Cuenta */}
            <div className="hidden sm:block">
              <label htmlFor="account-id" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                ID Cuenta
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon />
                </div>
                <input
                  id="account-id"
                  type="text"
                  value={filters.accountId}
                  onChange={(e) => handleFilterChange('accountId', e.target.value)}
                  placeholder="Ej: 001"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 hover:border-gray-300 placeholder:text-gray-400 shadow-sm"
                />
              </div>
            </div>

            {/* Cliente */}
            <div>
              <label htmlFor="client-filter" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Cliente
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon />
                </div>
                <input
                  id="client-filter"
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
                  <FilterIcon />
                </div>
                <select
                  id="status-filter"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value as FilterState['status'])}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 hover:border-gray-300 appearance-none cursor-pointer shadow-sm"
                >
                  <option value="all">Todos</option>
                  <option value="pending">Pendiente</option>
                  <option value="paid">Pagado</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-50/50 border-b border-gray-100">
            <tr>
              {/* ID - Hidden on mobile */}
              <th className="hidden md:table-cell px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                ID
              </th>
              {/* Cliente - Always visible */}
              <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              {/* Productos - Hidden on mobile */}
              <th className="hidden lg:table-cell px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Productos
              </th>
              {/* Monto Total - Hidden on mobile */}
              <th className="hidden md:table-cell px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Monto Total
              </th>
              {/* Estado - Always visible */}
              <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              {/* Acción - Always visible */}
              <th className="px-4 sm:px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
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
                    <span className="text-sm font-semibold text-gray-900">{account.client}</span>
                    {/* Show ID and amount on mobile as subtitle */}
                    <span className="md:hidden text-xs text-gray-500 mt-0.5">
                      #{account.id} · {formatCurrency(account.totalAmount)}
                    </span>
                  </div>
                </td>
                {/* Productos - Hidden on mobile */}
                <td className="hidden lg:table-cell px-4 sm:px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-700">
                    {account.productCount}
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
                    onClick={() => onViewDetail?.(account.id)}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-pink-600 hover:text-white bg-pink-50 hover:bg-gradient-to-r hover:from-pink-500 hover:to-rose-500 transition-all duration-200 shadow-sm hover:shadow-md"
                    title="Ver detalle"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {filteredAccounts.length === 0 && (
        <div className="px-4 sm:px-6 py-16 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center mb-4 shadow-sm">
            <svg className="w-8 h-8 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-2">
            No hay cuentas
          </h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            No se encontraron cuentas con los filtros seleccionados. Intenta ajustar tus criterios de búsqueda.
          </p>
        </div>
      )}
    </div>
  );
});

AccountsTableWithFilters.displayName = 'AccountsTableWithFilters';
