'use client';

import React, { useEffect, useMemo, useReducer } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Plus, Trash2 } from 'lucide-react';
import { Navbar } from '@/app/components/shared/Navbar';
import { NavButton } from '@/app/components/shared/Navbutton';
import { Footer } from '@/app/components/shared/Footer';
import { Button } from '@/app/components/shared/Button';
import { InputField } from '@/app/components/shared/InputField';
import { AccountSummary } from '@/app/components/accounts/AccountSummary';
import { PaymentForm } from '@/app/components/accounts/PaymentForm';
import { mockAccounts, mockClients } from '@/app/lib/mockData';
import {
  formatCurrency,
  todayISO,
  computeStatus,
  getNearestUpcomingPaymentDate,
  getNextPaymentDateFrom,
  isAllowedPaymentDay,
} from '@/app/lib/accountUtils';
import type { Account, AccountPayment } from '@/app/models/account';
import type { Client } from '@/app/models/client';

interface AccountState {
  account: Account | null;
  client: Client | null;
  paymentAmount: string;
  biweeklyAmount: string;
}

type AccountAction =
  | { type: 'SET_ACCOUNT'; payload: Account | null }
  | { type: 'SET_CLIENT'; payload: Client | null }
  | { type: 'SET_PAYMENT_AMOUNT'; payload: string }
  | { type: 'SET_BIWEEKLY_AMOUNT'; payload: string }
  | { type: 'RESET_PAYMENT_FORM'; payload: { amount: string } }
  | { type: 'INIT_ACCOUNT'; payload: { account: Account | null; client: Client | null; biweeklyAmount: string; paymentAmount: string } };

const accountReducer = (state: AccountState, action: AccountAction): AccountState => {
  switch (action.type) {
    case 'SET_ACCOUNT':
      return { ...state, account: action.payload };
    case 'SET_CLIENT':
      return { ...state, client: action.payload };
    case 'SET_PAYMENT_AMOUNT':
      return { ...state, paymentAmount: action.payload };
    case 'SET_BIWEEKLY_AMOUNT':
      return { ...state, biweeklyAmount: action.payload };
    case 'RESET_PAYMENT_FORM':
      return { ...state, paymentAmount: action.payload.amount };
    case 'INIT_ACCOUNT':
      return {
        ...state,
        account: action.payload.account,
        client: action.payload.client,
        biweeklyAmount: action.payload.biweeklyAmount,
        paymentAmount: action.payload.paymentAmount,
      };
    default:
      return state;
  }
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

export default function AccountDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const accountId = params?.id;

  const initialState: AccountState = {
    account: null,
    client: null,
    paymentAmount: '',
    biweeklyAmount: '',
  };

  const [state, dispatch] = useReducer(accountReducer, initialState);

  useEffect(() => {
    if (!accountId) return;

    const accounts = loadAccounts();
    const found = accounts.find((a) => a.id === accountId) ?? null;

    const foundClient = mockClients.find((c) => c.id === found?.clientId) ?? null;

    const computedNext = (() => {
      if (!found || found.remainingAmount <= 0) return undefined;

      if (!found.nextPaymentDate) {
        return getNearestUpcomingPaymentDate(found.createdAt ?? todayISO());
      }

      return isAllowedPaymentDay(found.nextPaymentDate)
        ? found.nextPaymentDate
        : getNearestUpcomingPaymentDate(found.nextPaymentDate);
    })();

    let nextFound: Account | undefined;
    if (found && found.remainingAmount > 0 && computedNext &&
        (!found.nextPaymentDate || !isAllowedPaymentDay(found.nextPaymentDate))) {
      nextFound = { ...found, nextPaymentDate: computedNext };
      const updated = accounts.map((a) => (a.id === nextFound!.id ? nextFound! : a));
      saveAccounts(updated);
    }

    const biweekly = found?.biweeklyAmount;
    const remaining = found?.remainingAmount ?? 0;
    const defaultAmount = biweekly != null ? Math.min(biweekly, remaining) : remaining;

    dispatch({
      type: 'INIT_ACCOUNT',
      payload: {
        account: nextFound ?? found,
        client: foundClient,
        biweeklyAmount: biweekly != null ? String(biweekly) : '',
        paymentAmount: defaultAmount > 0 ? String(defaultAmount) : '',
      },
    });
  }, [accountId]);

  const payments = useMemo(() => state.account?.payments ?? [], [state.account]);
  const items = useMemo(() => state.account?.items ?? [], [state.account]);

  const handlePersistAccount = (next: Account) => {
    const accounts = loadAccounts();
    const updated = accounts.map((a) => (a.id === next.id ? next : a));
    saveAccounts(updated);
    dispatch({ type: 'SET_ACCOUNT', payload: next });
  };

  const handleRemoveItem = (itemId: string) => {
    if (!state.account) return;

    const nextItems = (state.account.items ?? []).filter((i) => i.id !== itemId);
    const totalAmount = nextItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const totalProducts = nextItems.reduce((sum, item) => sum + item.quantity, 0);

    const totalPaid = state.account.totalPaid;
    const remainingAmount = Math.max(0, totalAmount - totalPaid);

    const nextPaymentDate = remainingAmount > 0 ? state.account.nextPaymentDate : undefined;
    const status = computeStatus(remainingAmount, nextPaymentDate);

    const next: Account = {
      ...state.account,
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
    if (!state.account) return;
    const amt = Number(state.biweeklyAmount);
    if (!Number.isFinite(amt) || amt <= 0) return;

    const next: Account = {
      ...state.account,
      biweeklyAmount: amt,
    };

    handlePersistAccount(next);
  };

  const handleRegisterPayment = () => {
    if (!state.account) return;

    const amt = Number(state.paymentAmount);
    if (!Number.isFinite(amt) || amt <= 0) return;

    const paymentDate = state.account.nextPaymentDate ?? getNearestUpcomingPaymentDate(todayISO());

    const nextTotalPaid = state.account.totalPaid + amt;
    const remainingAmount = Math.max(0, state.account.totalAmount - nextTotalPaid);

    const payment: AccountPayment = {
      id: `PAY-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      date: paymentDate,
      amount: amt,
    };

    const nextPaymentDate = remainingAmount > 0 ? getNextPaymentDateFrom(paymentDate) : undefined;
    const status = computeStatus(remainingAmount, nextPaymentDate);

    const next: Account = {
      ...state.account,
      totalPaid: nextTotalPaid,
      remainingAmount,
      lastPaymentDate: paymentDate,
      nextPaymentDate,
      payments: [...(state.account.payments ?? []), payment],
      status,
    };

    handlePersistAccount(next);

    const nextSuggestedAmount = next.biweeklyAmount != null ? Math.min(next.biweeklyAmount, next.remainingAmount) : next.remainingAmount;
    dispatch({ 
      type: 'RESET_PAYMENT_FORM', 
      payload: {
        amount: nextSuggestedAmount > 0 ? String(nextSuggestedAmount) : ''
      }
    });
  };

  if (!state.account) {
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
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Cuenta #{state.account.id}</h1>
                <p className="text-sm text-gray-600 mt-1">{state.account.clientName}</p>
              </div>
            </div>

            <Button onClick={() => router.push(`/cuentas/${state.account!.id}/productos`)} variant="primary">
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
                {state.client ? (
                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                    <div className="text-sm font-semibold text-gray-900">{state.client.name}</div>
                    <div className="text-xs text-gray-600 mt-1">{state.client.phone}</div>
                    <div className="text-xs text-gray-600 mt-1">{state.client.address}</div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">No hay datos extra del cliente.</div>
                )}
              </div>
            </div>

            <AccountSummary account={state.account} />

            <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Monto quincenal</h2>
              </div>
              <div className="p-6 space-y-3">
                <InputField
                  label="Monto quincenal"
                  type="number"
                  value={state.biweeklyAmount}
                  onChange={(value) => dispatch({ type: 'SET_BIWEEKLY_AMOUNT', payload: value })}
                  placeholder="Ej: 5000"
                />
                <Button onClick={handleSaveBiweeklyAmount} variant="secondary">
                  Guardar
                </Button>
              </div>
            </div>

            <PaymentForm
              account={state.account}
              paymentAmount={state.paymentAmount}
              onPaymentAmountChange={(value) => dispatch({ type: 'SET_PAYMENT_AMOUNT', payload: value })}
              onRegisterPayment={handleRegisterPayment}
              onNotifyClient={() => {
                const phone = state.client?.phone?.replace(/[^0-9+]/g, '') ?? '';
                const name = state.account!.clientName;
                const remaining = state.account!.remainingAmount;
                const nextDate = state.account!.nextPaymentDate ?? '';
                const biweekly = state.account!.biweeklyAmount;
                const lines = [
                  `Hola ${name} 👋`,
                  `Le recordamos que tiene un pago programado para el *${nextDate}*.`,
                  biweekly ? `Monto quincenal: *₡${biweekly.toLocaleString('es-CR')}*` : '',
                  `Saldo pendiente: *₡${remaining.toLocaleString('es-CR')}*`,
                  '',
                  'Gracias por su preferencia 🙏',
                ].filter(Boolean).join('\n');
                const url = `https://wa.me/${phone}?text=${encodeURIComponent(lines)}`;
                window.open(url, '_blank', 'noopener,noreferrer');
              }}
            />
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
                              <div className="sm:hidden text-xs mt-0.5">
                                {item.originalPrice && item.discountPercentage ? (
                                  <span className="flex items-center gap-1 flex-wrap">
                                    <span className="line-through text-gray-400">{formatCurrency(item.originalPrice)}</span>
                                    <span className="text-rose-500">-{item.discountPercentage}%</span>
                                    <span className="font-semibold text-rose-600">{formatCurrency(item.unitPrice)}</span>
                                  </span>
                                ) : (
                                  <span className="text-gray-500">{formatCurrency(item.unitPrice)} · Sub: {formatCurrency(item.unitPrice * item.quantity)}</span>
                                )}
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
