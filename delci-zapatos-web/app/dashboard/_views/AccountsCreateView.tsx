'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Plus, Trash2, X } from 'lucide-react';
import { useDashboardOptional } from '@/app/dashboard/DashboardContext';
import { Button } from '@/app/components/commons/Button';
import { InputField } from '@/app/components/commons/InputField';
import { getNearestUpcomingPaymentDate, todayISO } from '@/lib/accountUtils';
import type { Client } from '@/models/client';
import type { Account, AccountItem } from '@/models/account';

type CreateStep = 1 | 2 | 3;

type AccountDraft = {
  clientId: string;
  biweeklyAmount: number;
  nextPaymentDate: string;
  initialPendingAmount: number;
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

  const [draft, setDraft] = useState<AccountDraft>(() => {
    if (typeof window === 'undefined') return createDefaultDraft();
    return safeParse<AccountDraft>(window.localStorage.getItem(DRAFT_KEY)) ?? createDefaultDraft();
  });

  useEffect(() => {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [draft]);

  useEffect(() => {
    // TODO: Cargar clientes desde API.
    // const response = await fetch('/api/clients', { cache: 'no-store' });
    // const data = (await response.json()) as Client[];
    // setClients(data);
    setClients([]);
  }, []);

  const selectedClient = useMemo(() => clients.find((client) => client.id === draft.clientId) ?? null, [clients, draft.clientId]);
  const { totalAmount: itemsAmount } = useMemo(() => computeTotalsFromItems(draft.items), [draft.items]);
  const totalAmount = itemsAmount + Math.max(0, draft.initialPendingAmount || 0);

  const canContinueStepOne = Boolean(draft.clientId);
  const canContinueStepTwo = draft.biweeklyAmount > 0;

  const handleCreate = async () => {
    const payload: Omit<Account, 'id'> = {
      clientId: draft.clientId,
      clientName: selectedClient?.name ?? 'Cliente',
      createdAt: todayISO(),
      totalAmount,
      totalPaid: 0,
      remainingAmount: totalAmount,
      totalProducts: draft.items.reduce((sum, item) => sum + item.quantity, 0),
      status: totalAmount > 0 ? 'active' : 'paid',
      nextPaymentDate: draft.nextPaymentDate || undefined,
      biweeklyAmount: draft.biweeklyAmount || undefined,
      items: draft.items.length > 0 ? draft.items : undefined,
      payments: [],
    };

    // TODO: Integrar POST /api/accounts.
    // await fetch('/api/accounts', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(payload),
    // });
    console.log('Pending API integration - create account payload:', payload);

    window.localStorage.removeItem(DRAFT_KEY);
    dashboard?.setView({ key: 'accounts' });
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
              <div>
                <label htmlFor="client-select" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Cliente</label>
                <select
                  id="client-select"
                  value={draft.clientId}
                  onChange={(e) => setDraft((prev) => ({ ...prev, clientId: e.target.value }))}
                  className="w-full pl-4 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm"
                >
                  <option value="">Seleccionar cliente</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} · {client.phone}
                    </option>
                  ))}
                </select>
              </div>

              {selectedClient ? (
                <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{selectedClient.name}</div>
                      <div className="text-xs text-gray-600 mt-1">{selectedClient.phone}</div>
                      <div className="text-xs text-gray-600 mt-1">{selectedClient.address}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDraft((prev) => ({ ...prev, clientId: '' }))}
                      className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"
                      title="Quitar cliente"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-4 text-sm text-rose-700">
                  TODO: Integrar selector/listado real de clientes desde API.
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

              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Productos</h2>
                    <p className="text-sm text-gray-600 mt-1">{draft.items.length} agregados</p>
                  </div>
                  <Button type="button" onClick={() => dashboard?.setView({ key: 'accounts_detail' })} variant="secondary">
                    <Plus className="w-4 h-4 mr-1" />
                    Ver/Editar items
                  </Button>
                </div>

                <div className="p-4">
                  {draft.items.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-sm font-semibold text-gray-900">No hay productos agregados</div>
                      <div className="text-sm text-gray-600 mt-1">Puedes crear la cuenta sin productos.</div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Producto</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Cant.</th>
                            <th className="hidden sm:table-cell px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Subtotal</th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Accion</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {draft.items.map((item) => (
                            <tr key={item.id} className="hover:bg-pink-50/30 transition-all">
                              <td className="px-4 py-3">
                                <div className="text-sm font-semibold text-gray-900">{item.name}</div>
                              </td>
                              <td className="px-4 py-3 text-right text-sm text-gray-900">{item.quantity}</td>
                              <td className="hidden sm:table-cell px-4 py-3 text-right text-sm font-semibold text-gray-900">
                                {formatCurrency(item.unitPrice * item.quantity)}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => setDraft((prev) => ({ ...prev, items: prev.items.filter((i) => i.id !== item.id) }))}
                                  className="inline-flex items-center justify-center px-3 py-2 rounded-xl text-gray-600 hover:text-white bg-gray-100 hover:bg-gray-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">Cliente</div>
                <div className="mt-1 text-sm font-semibold text-gray-900">{selectedClient?.name || 'Sin seleccionar'}</div>
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
                TODO: Integrar APIs de clientes, productos de cuenta y creacion de cuentas.
              </div>
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
              <Button type="button" variant="primary" onClick={handleCreate} disabled={!canContinueStepOne || !canContinueStepTwo}>
                Crear cuenta
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
