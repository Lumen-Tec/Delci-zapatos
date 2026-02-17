'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Search, Check } from 'lucide-react';
import { Navbar } from '@/app/components/shared/Navbar';
import { NavButton } from '@/app/components/shared/Navbutton';
import { Footer } from '@/app/components/shared/Footer';
import { Pagination } from '@/app/components/shared/Pagination';
import { usePagination } from '@/app/hooks/usePagination';
import { mockClients } from '@/app/lib/mockData';
import type { Client } from '@/app/models/client';
import type { AccountItem } from '@/app/models/account';

type Draft = {
  clientId: string;
  biweeklyAmount: number;
  nextPaymentDate: string;
  items: AccountItem[];
};

const DRAFT_KEY = 'delci_account_draft';

const safeParse = <T,>(raw: string | null): T | null => {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export default function SeleccionarClientePage() {
  const router = useRouter();
  const [clients] = useState<Client[]>(mockClients);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const stored = safeParse<Draft>(window.localStorage.getItem(DRAFT_KEY));
    if (!stored) {
      router.replace('/cuentas/nueva');
      return;
    }
    setDraft(stored);
  }, [router]);

  const filteredClients = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q)
    );
  }, [clients, query]);

  const {
    currentPage,
    totalPages,
    totalItems,
    paginatedItems,
    startIndex,
    endIndex,
    pageSize,
    setPage,
    setPageSize,
    resetPage,
  } = usePagination(filteredClients, { initialPageSize: 10 });

  // Reset to page 1 when search query changes
  useEffect(() => {
    resetPage();
  }, [query, resetPage]);

  const handleSelect = (clientId: string) => {
    if (!draft) return;
    const next = { ...draft, clientId };
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
    router.push('/cuentas/nueva');
  };

  if (!draft) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-100 via-pink-50 to-rose-100 relative">
      <Navbar />
      <NavButton />

      <div className="flex-grow relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 md:pb-8 w-full">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/cuentas/nueva')}
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/80 border border-rose-200 text-rose-700 shadow-sm hover:bg-white transition-all"
              title="Volver"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg">
              <Image
                src="https://res.cloudinary.com/drec8g03e/image/upload/v1769717760/cuentas_uqp46t.svg"
                alt="Cuentas"
                width={24}
                height={24}
                className="w-6 h-6 text-white"
              />
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Seleccionar cliente</h1>
              <p className="text-sm text-gray-600 mt-1">Busca y selecciona un cliente para la cuenta</p>
            </div>
          </div>
        </div>

        {/* Search + Table Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
          {/* Search */}
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <div className="relative max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nombre o teléfono..."
                autoFocus
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 hover:border-gray-300 placeholder:text-gray-400 shadow-sm"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  <th className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Nombre
                  </th>
                  <th className="hidden sm:table-cell px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Teléfono
                  </th>
                  <th className="hidden md:table-cell px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Dirección
                  </th>
                  <th className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <Search className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No se encontraron clientes</h3>
                        <p className="text-gray-500">Intenta con otro término de búsqueda</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((client) => {
                    const isSelected = draft.clientId === client.id;
                    return (
                      <tr
                        key={client.id}
                        className={`transition-colors duration-150 cursor-pointer ${
                          isSelected
                            ? 'bg-pink-50 hover:bg-pink-100/70'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleSelect(client.id)}
                      >
                        <td className="px-2 sm:px-3 md:px-4 lg:px-6 py-1.5 sm:py-2 md:py-3 lg:py-4 whitespace-nowrap">
                          <div>
                            <div className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[150px] sm:max-w-[200px]">{client.name}</div>
                            <div className="sm:hidden text-xs text-gray-500 mt-0.5">{client.phone}</div>
                            <div className="md:hidden text-xs text-gray-500 mt-0.5 truncate max-w-[150px] sm:max-w-[200px]">{client.address}</div>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-2 sm:px-3 md:px-4 lg:px-6 py-1.5 sm:py-2 md:py-3 lg:py-4 whitespace-nowrap">
                          <div className="text-xs sm:text-sm text-gray-700">{client.phone}</div>
                        </td>
                        <td className="hidden md:table-cell px-2 sm:px-3 md:px-4 lg:px-6 py-1.5 sm:py-2 md:py-3 lg:py-4">
                          <div className="text-xs sm:text-sm text-gray-500 truncate max-w-[300px]">{client.address}</div>
                        </td>
                        <td className="px-2 sm:px-3 md:px-4 lg:px-6 py-1.5 sm:py-2 md:py-3 lg:py-4 whitespace-nowrap text-right">
                          {isSelected ? (
                            <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium bg-pink-500 text-white shadow-sm">
                              <Check className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Seleccionado</span>
                            </span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelect(client.id);
                              }}
                              className="inline-flex items-center justify-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-pink-600 hover:text-white bg-pink-50 hover:bg-pink-500 transition-all duration-200 shadow-sm hover:shadow-md text-xs font-medium whitespace-nowrap min-w-[50px] sm:min-w-[80px]"
                            >
                              <span className="hidden sm:inline">Seleccionar</span>
                              <span className="sm:hidden">Elegir</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-gray-50 border-t border-gray-200">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              startIndex={startIndex}
              endIndex={endIndex}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              itemLabel="clientes"
            />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
