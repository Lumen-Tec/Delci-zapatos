'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Plus, Trash2 } from 'lucide-react';
import { Navbar } from '@/app/components/shared/Navbar';
import { NavButton } from '@/app/components/shared/Navbutton';
import { Footer } from '@/app/components/shared/Footer';
import { Button } from '@/app/components/shared/Button';
import { InputField } from '@/app/components/shared/InputField';
import { ClientAutocomplete } from '@/app/components/shared/ClientAutocomplete';
import { mockClients } from '@/app/lib/mockData';
import type { Client } from '@/app/models/client';
import type { Account, AccountItem } from '@/app/models/account';

type AccountDraft = {
  clientId: string;
  biweeklyAmount: number;
  nextPaymentDate: string;
  items: AccountItem[];
};

const DRAFT_KEY = 'delci_account_draft';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    minimumFractionDigits: 2,
  }).format(amount);
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const addDaysISO = (dateISO: string, days: number) => {
  const d = new Date(dateISO);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const computeTotalsFromItems = (items: AccountItem[]) => {
  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const totalProducts = items.reduce((sum, item) => sum + item.quantity, 0);
  return { totalAmount, totalProducts };
};

const safeParse = <T,>(raw: string | null): T | null => {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export default function NuevaCuentaPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [draft, setDraft] = useState<AccountDraft>({
    clientId: '',
    biweeklyAmount: 0,
    nextPaymentDate: addDaysISO(todayISO(), 15),
    items: [],
  });

  useEffect(() => {
    const stored = safeParse<AccountDraft>(window.localStorage.getItem(DRAFT_KEY));
    if (stored) {
      setDraft(stored);
      return;
    }

    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, []);

  useEffect(() => {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [draft]);

  const selectedClient = useMemo(() => clients.find((c) => c.id === draft.clientId) ?? null, [clients, draft.clientId]);

  const { totalAmount, totalProducts } = useMemo(() => computeTotalsFromItems(draft.items), [draft.items]);

  const handleRemoveItem = (id: string) => {
    setDraft((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.id !== id),
    }));
  };

  const getNextAccountId = (existing: Account[]) => {
    const nums = existing
      .map((a) => Number(a.id.replace(/\D/g, '')))
      .filter((n) => Number.isFinite(n));
    const next = (nums.length > 0 ? Math.max(...nums) : 0) + 1;
    return `ACC${String(next).padStart(3, '0')}`;
  };

  const computeStatus = (remainingAmount: number, nextPaymentDate?: string) => {
    if (remainingAmount <= 0) return 'paid' as const;

    if (nextPaymentDate) {
      const today = todayISO();
      if (nextPaymentDate < today) return 'overdue' as const;
    }

    return 'active' as const;
  };

  const handleCreateAccount = () => {
    if (!draft.clientId) return;

    const createdAt = todayISO();

    const rawAccounts = window.localStorage.getItem('delci_accounts');
    const existing = safeParse<Account[]>(rawAccounts) ?? [];

    const id = getNextAccountId(existing);

    const remainingAmount = totalAmount;
    const status = computeStatus(remainingAmount, draft.nextPaymentDate);

    const account: Account = {
      id,
      clientId: draft.clientId,
      clientName: selectedClient?.name ?? 'Cliente',
      createdAt,
      totalAmount,
      totalPaid: 0,
      remainingAmount,
      totalProducts,
      status,
      nextPaymentDate: draft.nextPaymentDate || undefined,
      biweeklyAmount: draft.biweeklyAmount || undefined,
      items: draft.items.length > 0 ? draft.items : undefined,
      payments: [],
    };

    const next = [account, ...existing];
    window.localStorage.setItem('delci_accounts', JSON.stringify(next));
    window.localStorage.removeItem(DRAFT_KEY);

    router.push(`/cuentas/${id}`);
  };

  const canCreate = Boolean(draft.clientId) && draft.items.length > 0 && draft.biweeklyAmount > 0;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-100 via-pink-50 to-rose-100 relative">
      <Navbar />
      <NavButton />

      <div className="flex-grow relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 md:pb-8 w-full">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push('/cuentas')}
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
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Nueva cuenta</h1>
                <p className="text-sm text-gray-600 mt-1">Selecciona cliente, productos y monto quincenal</p>
              </div>
            </div>

            <Button onClick={() => router.push('/cuentas/nueva/productos')} variant="primary">
              <Plus className="w-5 h-5 mr-2" />
              Agregar productos
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Cliente</h2>
              </div>
              <div className="p-6 space-y-4">
                <ClientAutocomplete
                  clients={clients}
                  value={draft.clientId}
                  onChange={(clientId) => setDraft((prev) => ({ ...prev, clientId }))}
                  label="Cliente"
                  placeholder="Buscar por nombre, teléfono o dirección..."
                  required
                />

                {selectedClient ? (
                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                    <div className="text-sm font-semibold text-gray-900">{selectedClient.name}</div>
                    <div className="text-xs text-gray-600 mt-1">{selectedClient.phone}</div>
                    <div className="text-xs text-gray-600 mt-1">{selectedClient.address}</div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Pagos</h2>
              </div>
              <div className="p-6 space-y-4">
                <InputField
                  label="Monto quincenal"
                  type="number"
                  value={String(draft.biweeklyAmount)}
                  onChange={(value) => setDraft((prev) => ({ ...prev, biweeklyAmount: Number(value) || 0 }))}
                  required
                />

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Próximo pago</label>
                  <input
                    type="date"
                    value={draft.nextPaymentDate}
                    onChange={(e) => setDraft((prev) => ({ ...prev, nextPaymentDate: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 hover:border-gray-300 shadow-sm"
                  />
                </div>

                <div className="rounded-xl bg-pink-50 border border-pink-100 p-4">
                  <div className="text-xs text-gray-600">Sugerencia</div>
                  <div className="text-sm font-semibold text-gray-900 mt-1">Siguiente quincena: {addDaysISO(draft.nextPaymentDate, 15)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Productos</h2>
                  <p className="text-sm text-gray-600 mt-1">{draft.items.length} agregados</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-600">Total</div>
                  <div className="text-lg font-bold text-gray-900">{formatCurrency(totalAmount)}</div>
                </div>
              </div>

              <div className="p-6">
                {draft.items.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="text-sm font-semibold text-gray-900">No hay productos agregados</div>
                    <div className="text-sm text-gray-600 mt-1">Usa “Agregar productos” para seleccionar del inventario.</div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Producto</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Cant.</th>
                          <th className="hidden sm:table-cell px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Precio</th>
                          <th className="hidden sm:table-cell px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Subtotal</th>
                          <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {draft.items.map((item) => (
                          <tr key={item.id} className="hover:bg-pink-50/30 transition-all">
                            <td className="px-4 py-3">
                              <div className="text-sm font-semibold text-gray-900">{item.name}</div>
                              <div className="text-xs text-gray-600 mt-0.5">
                                {item.category === 'zapatos' ? `Talla: ${item.size} · ${item.color}` : item.category}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-gray-900">{item.quantity}</td>
                            <td className="hidden sm:table-cell px-4 py-3 text-right text-sm text-gray-700">
                              {item.originalPrice && item.discountPercentage ? (
                                <div>
                                  <span className="line-through text-gray-400 text-xs">{formatCurrency(item.originalPrice)}</span>
                                  <div className="text-rose-600 font-semibold">{formatCurrency(item.unitPrice)}</div>
                                  <span className="text-xs text-rose-500">-{item.discountPercentage}%</span>
                                </div>
                              ) : (
                                formatCurrency(item.unitPrice)
                              )}
                            </td>
                            <td className="hidden sm:table-cell px-4 py-3 text-right text-sm font-semibold text-gray-900">
                              {formatCurrency(item.unitPrice * item.quantity)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.id)}
                                className="inline-flex items-center justify-center px-3 py-2 rounded-xl text-gray-600 hover:text-white bg-gray-100 hover:bg-gray-600 transition-all duration-200 shadow-sm"
                                title="Eliminar"
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

            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <Button variant="secondary" onClick={() => {
                window.localStorage.removeItem(DRAFT_KEY);
                router.push('/cuentas');
              }}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleCreateAccount} disabled={!canCreate}>
                Crear cuenta
              </Button>
            </div>

            {!canCreate ? (
              <div className="text-sm text-gray-600">
                Debes seleccionar un cliente, agregar al menos un producto y definir el monto quincenal.
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
