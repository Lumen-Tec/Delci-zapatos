'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Search, Calendar } from 'lucide-react';
import type { Account } from '@/app/models/account';
import { usePagination } from '@/app/hooks/usePagination';
import { Pagination } from '@/app/components/shared/Pagination';

interface DashboardAccountsTableProps {
  accounts: Account[];
  onViewAccount?: (accountId: string) => void;
  className?: string;
}

export const DashboardAccountsTable = ({ accounts, onViewAccount, className = '' }: DashboardAccountsTableProps) => {
  const [clientFilter, setClientFilter] = useState('');

  const filteredAccounts = useMemo(() => {
    return accounts
      .filter((account) => {
        const isEligible =
          (account.status === 'active' || account.status === 'overdue') &&
          !!account.nextPaymentDate;
        const matchesClient =
          !clientFilter ||
          account.clientName.toLowerCase().includes(clientFilter.toLowerCase());
        return isEligible && matchesClient;
      })
      .sort((a, b) => {
        const dateA = a.nextPaymentDate ?? '';
        const dateB = b.nextPaymentDate ?? '';
        return dateA.localeCompare(dateB);
      });
  }, [accounts, clientFilter]);

  const totalEligible = useMemo(() => {
    return accounts.filter(
      (a) => (a.status === 'active' || a.status === 'overdue') && a.nextPaymentDate
    ).length;
  }, [accounts]);

  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedItems: paginatedAccounts,
    startIndex,
    endIndex,
    setPage,
    setPageSize,
    resetPage,
  } = usePagination(filteredAccounts, { initialPageSize: 10 });

  // Reset to page 1 when filter changes
  useEffect(() => {
    resetPage();
  }, [clientFilter, resetPage]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-CR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getPaymentDateStyle = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const paymentDate = new Date(dateStr + 'T00:00:00');
    const diffDays = Math.ceil((paymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'text-red-700 bg-red-50';
    if (diffDays <= 3) return 'text-amber-700 bg-amber-50';
    return 'text-gray-700 bg-gray-50';
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
    <div className={`bg-white rounded-2xl shadow-lg border border-gray-100 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></span>
            Próximos pagos
          </h3>

          {/* Client filter */}
          <div className="grid grid-cols-1 gap-3 max-w-md">
            <div>
              <label htmlFor="dashboard-client-filter" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Cliente
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  id="dashboard-client-filter"
                  type="text"
                  value={clientFilter}
                  onChange={(e) => setClientFilter(e.target.value)}
                  placeholder="Buscar cliente..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 hover:border-gray-300 placeholder:text-gray-400 shadow-sm"
                />
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
              <th className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Cliente
              </th>
              <th className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Próximo pago
              </th>
              <th className="hidden sm:table-cell px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Monto
              </th>
              <th className="hidden sm:table-cell px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Restante
              </th>
              <th className="hidden md:table-cell px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
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
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Calendar className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No hay próximos pagos</h3>
                    <p className="text-gray-500">No se encontraron cuentas con pagos pendientes</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedAccounts.map((account) => (
                <tr key={account.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-1 sm:px-2 md:px-3 lg:px-6 py-1.5 sm:py-2 md:py-3 lg:py-4 whitespace-nowrap">
                    <div>
                      <div className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-[200px]">
                        {account.clientName}
                      </div>
                      <div className="sm:hidden text-xs text-gray-500 mt-0.5">
                        {account.biweeklyAmount ? formatCurrency(account.biweeklyAmount) : '-'} · {account.status === 'active' ? 'Activa' : 'Vencida'}
                      </div>
                    </div>
                  </td>
                  <td className="px-1 sm:px-2 md:px-3 lg:px-6 py-1.5 sm:py-2 md:py-3 lg:py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${getPaymentDateStyle(account.nextPaymentDate!)}`}>
                      {formatDate(account.nextPaymentDate!)}
                    </span>
                  </td>
                  <td className="hidden sm:table-cell px-1 sm:px-2 md:px-3 lg:px-6 py-1.5 sm:py-2 md:py-3 lg:py-4 whitespace-nowrap">
                    <div className="text-xs sm:text-sm font-medium text-gray-900">
                      {account.biweeklyAmount ? formatCurrency(account.biweeklyAmount) : '-'}
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-1 sm:px-2 md:px-3 lg:px-6 py-1.5 sm:py-2 md:py-3 lg:py-4 whitespace-nowrap">
                    <div className="text-xs sm:text-sm font-medium text-gray-900">
                      {formatCurrency(account.remainingAmount)}
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-1 sm:px-2 md:px-3 lg:px-6 py-1.5 sm:py-2 md:py-3 lg:py-4 whitespace-nowrap">
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

      {/* Pagination */}
      {filteredAccounts.length > 0 && (
        <div className="border-t border-gray-100">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            startIndex={startIndex}
            endIndex={endIndex}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            itemLabel="cuentas"
          />
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-2xl">
        <div className="text-sm text-gray-600 text-center">
          Mostrando <span className="font-medium text-gray-900">{filteredAccounts.length}</span> de{' '}
          <span className="font-medium text-gray-900">{totalEligible}</span>{' '}
          cuentas con pagos pendientes
        </div>
      </div>
    </div>
  );
};
