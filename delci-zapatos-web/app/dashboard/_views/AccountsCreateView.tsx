'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useDashboardOptional } from '@/app/dashboard/DashboardContext';
import { Button } from '@/app/components/commons/Button';
import { InputField } from '@/app/components/commons/InputField';
import { Pagination } from '@/app/components/shared/Pagination';
import { usePagination } from '@/hooks/usePagination';
import { getNearestUpcomingPaymentDate, todayISO } from '@/lib/accountUtils';
import type { Client } from '@/models/client';
import type { AccountItem } from '@/models/account';

type CreateStep = 1 | 2 | 3;

type AccountDraft = {
  clientId: string;
  biweeklyAmount: number;
  nextPaymentDate: string;
  initialPendingAmount: number;
  detail: string;
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

const createDefaultDraft = (): AccountDraft => ({
  clientId: '',
  biweeklyAmount: 0,
  nextPaymentDate: getNearestUpcomingPaymentDate(todayISO()),
  initialPendingAmount: 0,
  detail: '',
  items: [],
});

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    minimumFractionDigits: 2,
  }).format(amount);

function computeTotalsFromItems(items: AccountItem[]) {
  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const totalProducts = items.reduce((sum, item) => sum + item.quantity, 0);
  return { totalAmount, totalProducts };
}

export default function AccountsCreateView() {
  const dashboard = useDashboardOptional();
  const [step, setStep] = useState<CreateStep>(1);
  const [clients, setClients] = useState<Client[]>([]);
  const [query, setQuery] = useState('');
  const [isClientsLoading, setIsClientsLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [draft, setDraft] = useState<AccountDraft>(() => {
    if (typeof window === 'undefined') return createDefaultDraft();
    const storedDraft = safeParse<Partial<AccountDraft>>(window.localStorage.getItem(DRAFT_KEY));
    if (!storedDraft) return createDefaultDraft();
    return {
      ...createDefaultDraft(),
      ...storedDraft,
      detail: storedDraft.detail ?? '',
      items: storedDraft.items ?? [],
    };
  });

  useEffect(() => {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [draft]);

  useEffect(() => {
    const fetchClients = async () => {
      setIsClientsLoading(true);
      try {
        const response = await fetch('/api/clients', { cache: 'no-store' });
        const data = await response.json();

        if (!response.ok || !data?.ok) {
          setClients([]);
          return;
        }

        setClients((data.clients ?? []) as Client[]);
      } catch (error) {
        console.error('Error loading clients:', error);
        setClients([]);
      } finally {
        setIsClientsLoading(false);
      }
    };

    fetchClients();
  }, []);

  const selectedClient = useMemo(() => clients.find((client) => client.id === draft.clientId) ?? null, [clients, draft.clientId]);
  const { totalAmount: itemsAmount } = useMemo(() => computeTotalsFromItems(draft.items), [draft.items]);
  const totalAmount = itemsAmount + Math.max(0, draft.initialPendingAmount || 0);

  const filteredClients = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;

    const normalizedQuery = q.replace(/\D/g, '');
    return clients.filter((client) => {
      const matchesName = client.fullName.toLowerCase().includes(q);
      const matchesPhone = client.phone.replace(/\D/g, '').includes(normalizedQuery);
      return matchesName || matchesPhone;
    });
  }, [clients, query]);

  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedItems: paginatedClients,
    startIndex,
    endIndex,
    setPage,
    setPageSize,
    resetPage,
  } = usePagination(filteredClients, { initialPageSize: 10 });

  useEffect(() => {
    resetPage();
  }, [query, clients, resetPage]);

  const canContinueStepOne = Boolean(draft.clientId);
  const canContinueStepTwo = draft.biweeklyAmount > 0;

  const handleCreate = async () => {
    if (!draft.clientId || draft.biweeklyAmount <= 0) return;

    setIsCreating(true);
    setCreateError(null);

    try {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: draft.clientId,
          initialBalance: Math.max(0, draft.initialPendingAmount || 0),
          quincenalAmount: draft.biweeklyAmount,
          detail: draft.detail.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.ok) {
        setCreateError(data?.error || 'No se pudo crear la cuenta');
        return;
      }

      window.localStorage.removeItem(DRAFT_KEY);
      dashboard?.setView({ key: 'accounts' });
    } catch (error) {
      console.error('Error creating account:', error);
      setCreateError('Error de conexion al crear la cuenta');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 md:pb-8 w-full">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => dashboard?.setView({ key: 'accounts' })}
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
                className="w-6 h-6"
              />
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Nueva cuenta</h1>
              <p className="text-sm text-gray-600 mt-1">Creacion por fases para registrar cuenta</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-rose-100 bg-white/90 p-4">
        <div className="grid grid-cols-3 gap-2 text-xs sm:text-sm">
          {[
            { key: 1, label: 'Cliente' },
            { key: 2, label: 'Productos y Pago' },
            { key: 3, label: 'Resumen' },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setStep(item.key as CreateStep)}
              className={`rounded-lg px-3 py-2 font-medium transition-all ${
                step === item.key ? 'bg-pink-500 text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
        <div className="p-6 space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="relative max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar por nombre o telefono..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm"
                />
              </div>

              {isClientsLoading ? (
                <div className="text-sm text-gray-600">Cargando clientes...</div>
              ) : filteredClients.length === 0 ? (
                <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-4 text-sm text-rose-700">
                  No se encontraron clientes.
                </div>
              ) : (
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Telefono</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Accion</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {paginatedClients.map((client) => {
                          const isSelected = draft.clientId === client.id;

                          return (
                            <tr key={client.id} className={isSelected ? 'bg-pink-50/60' : 'hover:bg-gray-50'}>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{client.fullName}</td>
                              <td className="px-4 py-3 text-sm text-gray-700">{client.phone}</td>
                              <td className="px-4 py-3 text-right">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={isSelected ? 'secondary' : 'primary'}
                                  onClick={() => setDraft((prev) => ({ ...prev, clientId: client.id }))}
                                >
                                  {isSelected ? 'Seleccionado' : 'Seleccionar'}
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

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
                      itemLabel="clientes"
                    />
                  </div>
                </div>
              )}

              {selectedClient && (
                <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                  <div className="text-xs uppercase tracking-wide text-gray-500">Cliente seleccionado</div>
                  <div className="text-sm font-semibold text-gray-900 mt-1">{selectedClient.fullName}</div>
                  <div className="text-xs text-gray-600 mt-1">{selectedClient.phone}</div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  label="Monto quincenal"
                  type="number"
                  value={String(draft.biweeklyAmount)}
                  onChange={(value) => setDraft((prev) => ({ ...prev, biweeklyAmount: Number(value) || 0 }))}
                  required
                />

                <InputField
                  label="Saldo pendiente inicial"
                  type="number"
                  value={String(draft.initialPendingAmount)}
                  onChange={(value) => setDraft((prev) => ({ ...prev, initialPendingAmount: Number(value) || 0 }))}
                />
              </div>

              <div>
                <label htmlFor="account-detail" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Detalle de la cuenta (opcional)
                </label>
                <textarea
                  id="account-detail"
                  value={draft.detail}
                  onChange={(e) => setDraft((prev) => ({ ...prev, detail: e.target.value }))}
                  placeholder="Ej: Cuenta creada por compra de zapatos escolares"
                  rows={3}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base rounded-lg border border-gray-300 bg-white text-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-1 focus:border-pink-500"
                />
              </div>

              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Productos</h2>
                    <p className="text-sm text-gray-600 mt-1">Opcional por ahora</p>
                  </div>
                </div>

                <div className="p-4">
                  <div className="text-center py-8">
                    <div className="text-sm font-semibold text-gray-900">No hay productos agregados</div>
                    <div className="text-sm text-gray-600 mt-1">Puedes crear la cuenta sin productos por ahora.</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">Cliente</div>
                <div className="mt-1 text-sm font-semibold text-gray-900">{selectedClient?.fullName || 'Sin seleccionar'}</div>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">Detalle</div>
                <div className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{(draft.detail ?? '').trim() || 'Sin detalle'}</div>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total productos</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(itemsAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Saldo inicial manual</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(Math.max(0, draft.initialPendingAmount || 0))}</span>
                </div>
                <div className="flex items-center justify-between text-base pt-2 border-t border-gray-200">
                  <span className="font-medium text-gray-700">Saldo pendiente inicial total</span>
                  <span className="font-bold text-gray-900">{formatCurrency(totalAmount)}</span>
                </div>
              </div>

              <div className="rounded-xl border border-rose-100 bg-rose-50/70 p-3 text-xs text-rose-700">
                Puedes crear la cuenta sin productos. Los productos se podran agregar despues.
              </div>
            </div>
          )}

          {createError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {createError}
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
            {step > 1 && (
              <Button type="button" variant="secondary" onClick={() => setStep((prev) => (prev - 1) as CreateStep)}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Atras
              </Button>
            )}

            {step < 3 ? (
              <Button
                type="button"
                variant="primary"
                onClick={() => setStep((prev) => (prev + 1) as CreateStep)}
                disabled={(step === 1 && !canContinueStepOne) || (step === 2 && !canContinueStepTwo)}
              >
                Siguiente
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button type="button" variant="primary" onClick={handleCreate} disabled={!canContinueStepOne || !canContinueStepTwo} loading={isCreating}>
                Crear cuenta
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
