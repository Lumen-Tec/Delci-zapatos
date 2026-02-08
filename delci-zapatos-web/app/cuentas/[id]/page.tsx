'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, CreditCard, Plus, Trash2 } from 'lucide-react';
import { Navbar } from '@/app/components/shared/Navbar';
import { NavButton } from '@/app/components/shared/Navbutton';
import { Footer } from '@/app/components/shared/Footer';
import { Button } from '@/app/components/shared/Button';
import { InputField } from '@/app/components/shared/InputField';
import { mockAccounts, mockClients } from '@/app/lib/mockData';
import type { Account, AccountPayment } from '@/app/models/account';
import type { Client } from '@/app/models/client';

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

const safeParse = <T,>(raw: string | null): T | null => {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const loadAccounts = (): Account[] => {
  const raw = window.localStorage.getItem('delci_accounts');
  const parsed = safeParse<Account[]>(raw);
  return parsed ?? mockAccounts;
};

const saveAccounts = (accounts: Account[]) => {
  window.localStorage.setItem('delci_accounts', JSON.stringify(accounts));
};

const computeStatus = (remainingAmount: number, nextPaymentDate?: string) => {
  if (remainingAmount <= 0) return 'paid' as const;

  if (nextPaymentDate) {
    const today = todayISO();
    if (nextPaymentDate < today) return 'overdue' as const;
  }

  return 'active' as const;
};

export default function AccountDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const accountId = params?.id;

  const [account, setAccount] = useState<Account | null>(null);
  const [client, setClient] = useState<Client | null>(null);

  const [paymentDate, setPaymentDate] = useState<string>(todayISO());
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [biweeklyAmount, setBiweeklyAmount] = useState<string>('');

  useEffect(() => {
    if (!accountId) return;

    const accounts = loadAccounts();
    const found = accounts.find((a) => a.id === accountId) ?? null;
    setAccount(found);

    const foundClient = mockClients.find((c) => c.id === found?.clientId) ?? null;
    setClient(foundClient);

    const computedNext =
      found && found.remainingAmount > 0
        ? found.nextPaymentDate ?? (found.createdAt ? addDaysISO(found.createdAt, 15) : undefined)
        : undefined;

    if (found && found.remainingAmount > 0 && !found.nextPaymentDate && computedNext) {
      const nextFound: Account = { ...found, nextPaymentDate: computedNext };
      const updated = accounts.map((a) => (a.id === nextFound.id ? nextFound : a));
      saveAccounts(updated);
      setAccount(nextFound);
    }

    setPaymentDate(computedNext ?? todayISO());

    const biweekly = found?.biweeklyAmount;
    setBiweeklyAmount(biweekly != null ? String(biweekly) : '');

    const remaining = found?.remainingAmount ?? 0;
    const defaultAmount = biweekly != null ? Math.min(biweekly, remaining) : remaining;
    setPaymentAmount(defaultAmount > 0 ? String(defaultAmount) : '');
  }, [accountId]);

  const payments = useMemo(() => account?.payments ?? [], [account]);
  const items = useMemo(() => account?.items ?? [], [account]);

  const handlePersistAccount = (next: Account) => {
    const accounts = loadAccounts();
    const updated = accounts.map((a) => (a.id === next.id ? next : a));
    saveAccounts(updated);
    setAccount(next);
  };

  const handleRemoveItem = (itemId: string) => {
    if (!account) return;

    const nextItems = (account.items ?? []).filter((i) => i.id !== itemId);
    const totalAmount = nextItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const totalProducts = nextItems.reduce((sum, item) => sum + item.quantity, 0);

    const totalPaid = account.totalPaid;
    const remainingAmount = Math.max(0, totalAmount - totalPaid);

    const nextPaymentDate = remainingAmount > 0 ? account.nextPaymentDate : undefined;
    const status = computeStatus(remainingAmount, nextPaymentDate);

    const next: Account = {
      ...account,
      items: nextItems.length > 0 ? nextItems : undefined,
      totalAmount,
      totalProducts,
      remainingAmount,
      status,
      nextPaymentDate,
    };

    handlePersistAccount(next);
  };

  const handleSaveBiweeklyAmount = () => {
    if (!account) return;
    const amt = Number(biweeklyAmount);
    if (!Number.isFinite(amt) || amt <= 0) return;

    const next: Account = {
      ...account,
      biweeklyAmount: amt,
    };

    handlePersistAccount(next);
  };

  const handleRegisterPayment = () => {
    if (!account) return;

    const amt = Number(paymentAmount);
    if (!Number.isFinite(amt) || amt <= 0) return;
    if (!paymentDate) return;

    const nextTotalPaid = account.totalPaid + amt;
    const remainingAmount = Math.max(0, account.totalAmount - nextTotalPaid);

    const payment: AccountPayment = {
      id: `PAY-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      date: paymentDate,
      amount: amt,
    };

    const nextPaymentDate = remainingAmount > 0 ? addDaysISO(paymentDate, 15) : undefined;
    const status = computeStatus(remainingAmount, nextPaymentDate);

    const next: Account = {
      ...account,
      totalPaid: nextTotalPaid,
      remainingAmount,
      lastPaymentDate: paymentDate,
      nextPaymentDate,
      payments: [...(account.payments ?? []), payment],
      status,
    };

    handlePersistAccount(next);

    const nextSuggestedAmount = next.biweeklyAmount != null ? Math.min(next.biweeklyAmount, next.remainingAmount) : next.remainingAmount;
    setPaymentAmount(nextSuggestedAmount > 0 ? String(nextSuggestedAmount) : '');
    setPaymentDate(next.nextPaymentDate ?? todayISO());
  };

  if (!account) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-100 via-pink-50 to-rose-100 relative">
        <Navbar />
        <NavButton />

        <div className="flex-grow relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden p-8 text-center">
            <div className="text-lg font-bold text-gray-900">Cuenta no encontrada</div>
            <div className="text-sm text-gray-600 mt-2">La cuenta {accountId ? `#${accountId}` : ''} no existe.</div>
            <div className="mt-6 flex justify-center">
              <Button onClick={() => router.push('/cuentas')} variant="primary">
                Volver a cuentas
              </Button>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-100 via-pink-50 to-rose-100 relative">
      <Navbar />
      <NavButton />

      <div className="flex-grow relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 md:pb-8 w-full">
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
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Cuenta #{account.id}</h1>
                <p className="text-sm text-gray-600 mt-1">{account.clientName}</p>
              </div>
            </div>

            <Button onClick={() => router.push(`/cuentas/${account.id}/productos`)} variant="primary">
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
              <div className="p-6">
                {client ? (
                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                    <div className="text-sm font-semibold text-gray-900">{client.name}</div>
                    <div className="text-xs text-gray-600 mt-1">{client.phone}</div>
                    <div className="text-xs text-gray-600 mt-1">{client.address}</div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">No hay datos extra del cliente.</div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Resumen</h2>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(account.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pagado</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(account.totalPaid)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pendiente</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(account.remainingAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Próximo pago</span>
                  <span className="font-semibold text-gray-900">{account.nextPaymentDate ?? '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Último pago</span>
                  <span className="font-semibold text-gray-900">{account.lastPaymentDate ?? '-'}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Monto quincenal</h2>
              </div>
              <div className="p-6 space-y-3">
                <InputField
                  label="Monto quincenal"
                  type="number"
                  value={biweeklyAmount}
                  onChange={(value) => setBiweeklyAmount(value)}
                  placeholder="Ej: 5000"
                />
                <Button onClick={handleSaveBiweeklyAmount} variant="secondary">
                  Guardar
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Registrar pago</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Fecha</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 hover:border-gray-300 shadow-sm"
                  />
                </div>

                <InputField
                  label="Monto"
                  type="number"
                  value={paymentAmount}
                  onChange={(value) => setPaymentAmount(value)}
                  placeholder={account.biweeklyAmount ? String(account.biweeklyAmount) : 'Monto'}
                />

                <Button onClick={handleRegisterPayment} variant="primary">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Marcar pagado
                </Button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Productos</h2>
              </div>
              <div className="p-6">
                {items.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="text-sm font-semibold text-gray-900">No hay productos en esta cuenta</div>
                    <div className="text-sm text-gray-600 mt-1">Agrega productos para calcular el total.</div>
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
                        {items.map((item) => (
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

            <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Pagos anteriores</h2>
              </div>
              <div className="p-6">
                {payments.length === 0 ? (
                  <div className="text-sm text-gray-600">Aún no hay pagos registrados.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Monto</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {payments
                          .slice()
                          .sort((a, b) => b.date.localeCompare(a.date))
                          .map((p) => (
                            <tr key={p.id} className="hover:bg-pink-50/30 transition-all">
                              <td className="px-4 py-3 text-sm text-gray-700">{p.date}</td>
                              <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">{formatCurrency(p.amount)}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
