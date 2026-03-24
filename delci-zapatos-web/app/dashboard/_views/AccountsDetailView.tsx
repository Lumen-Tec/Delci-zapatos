'use client';

import React, { useEffect, useMemo, useReducer, useState } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import Swal from 'sweetalert2';
import { ChevronLeft, Trash2, Edit2, Save, X } from 'lucide-react';
import { useDashboardOptional } from '@/app/dashboard/DashboardContext';
import { Button } from '@/app/components/commons/Button';
import { InputField } from '@/app/components/commons/InputField';
import { formatCurrency, computeStatus, getNearestUpcomingPaymentDate, getNextPaymentDateFrom } from '@/lib/accountUtils';
import { getSuggestedPaymentAmount, validatePaymentAmount } from '@/lib/paymentUtil';
import type { AccountDetailsResult, AccountPaymentResult } from '@/types/accountsRepository';

type DetailStep = 1 | 2 | 3;

interface AccountState {
  account: AccountDetailsResult | null;
  paymentAmount: string;
  biweeklyAmount: string;
}

type AccountAction =
  | { type: 'SET_ACCOUNT'; payload: AccountDetailsResult | null }
  | { type: 'SET_PAYMENT_AMOUNT'; payload: string }
  | { type: 'SET_BIWEEKLY_AMOUNT'; payload: string }
  | { type: 'RESET_PAYMENT_FORM'; payload: { amount: string } };

const accountReducer = (state: AccountState, action: AccountAction): AccountState => {
  switch (action.type) {
    case 'SET_ACCOUNT':
      return { ...state, account: action.payload };
    case 'SET_PAYMENT_AMOUNT':
      return { ...state, paymentAmount: action.payload };
    case 'SET_BIWEEKLY_AMOUNT':
      return { ...state, biweeklyAmount: action.payload };
    case 'RESET_PAYMENT_FORM':
      return { ...state, paymentAmount: action.payload.amount };
    default:
      return state;
  }
};

export default function AccountsDetailView() {
  const dashboard = useDashboardOptional();
  const params = useParams<{ id?: string | string[] }>();
  const routeId = params?.id;
  const routeAccountId = Array.isArray(routeId) ? routeId[0] : routeId;
  const dashboardAccountId = dashboard?.view.key === 'accounts_detail' ? dashboard.view.accountId : undefined;
  const accountId = dashboardAccountId ?? routeAccountId;
  const stepStorageKey = accountId ? `accounts-detail-step:${accountId}` : null;

  const [step, setStep] = useState<DetailStep>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editPaymentAmount, setEditPaymentAmount] = useState<string>('');
  const [editPaymentDate, setEditPaymentDate] = useState<string>('');
  const [isEditingDetail, setIsEditingDetail] = useState(false);
  const [editDetailValue, setEditDetailValue] = useState<string>('');

  const [state, dispatch] = useReducer(accountReducer, {
    account: null,
    paymentAmount: '',
    biweeklyAmount: '',
  });

  useEffect(() => {
    const fetchAccount = async () => {
      if (!accountId) {
        dispatch({ type: 'SET_ACCOUNT', payload: null });
        return;
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        const response = await fetch(`/api/accounts/getById?id=${encodeURIComponent(accountId)}`, {
          cache: 'no-store',
        });
        const data = await response.json();

        if (!response.ok || !data?.ok || !data?.account) {
          dispatch({ type: 'SET_ACCOUNT', payload: null });
          setLoadError(data?.error || 'No se pudo cargar el detalle de la cuenta');
          return;
        }

        dispatch({ type: 'SET_ACCOUNT', payload: data.account as AccountDetailsResult });
      } catch (error) {
        console.error('Error loading account details:', error);
        dispatch({ type: 'SET_ACCOUNT', payload: null });
        setLoadError('Error de conexion al cargar la cuenta');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccount();
  }, [accountId]);

  const account = state.account;
  const items = useMemo(() => account?.items ?? [], [account]);
  const payments = useMemo(() => account?.payments ?? [], [account]);

  const getStatusLabel = (status: AccountDetailsResult['status']) => {
    if (status === 'activa') return 'Activa';
    if (status === 'pagada') return 'Pagada';
    return 'Atrasada';
  };

  useEffect(() => {
    if (!stepStorageKey) return;

    const raw = window.localStorage.getItem(stepStorageKey);
    const parsed = Number(raw);
    if (parsed === 1 || parsed === 2 || parsed === 3) {
      setStep(parsed as DetailStep);
      return;
    }

    setStep(1);
  }, [stepStorageKey]);

  useEffect(() => {
    if (!stepStorageKey) return;
    window.localStorage.setItem(stepStorageKey, String(step));
  }, [step, stepStorageKey]);

  useEffect(() => {
    if (!account) return;
    const suggested = getSuggestedPaymentAmount(account.biweeklyAmount, account.remainingAmount);
    dispatch({ type: 'SET_BIWEEKLY_AMOUNT', payload: account.biweeklyAmount ? String(account.biweeklyAmount) : '' });
    dispatch({ type: 'SET_PAYMENT_AMOUNT', payload: suggested > 0 ? String(suggested) : '' });
  }, [account?.id, account?.biweeklyAmount]);

  const persistAccount = async (next: AccountDetailsResult) => {
    dispatch({ type: 'SET_ACCOUNT', payload: next });

    try {
      const response = await fetch('/api/accounts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: next.id,
          initialBalance: next.totalAmount - next.totalPaid,
          quincenalAmount: next.biweeklyAmount,
          detail: next.detail,
          status: next.status,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result?.ok) {
        console.error('Error updating account:', result?.error);
        await Swal.fire({
          icon: 'error',
          title: 'Error al actualizar',
          text: result?.error || 'No se pudo actualizar la cuenta',
          confirmButtonColor: '#ec4899',
        });
        return;
      }
    } catch (error) {
      console.error('Error updating account:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: 'No se pudo conectar al servidor para actualizar la cuenta',
        confirmButtonColor: '#ec4899',
      });
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!account) return;

    const nextItems = (account.items ?? []).filter((item) => item.id !== itemId);
    const totalAmount = nextItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const totalProducts = nextItems.reduce((sum, item) => sum + item.quantity, 0);

    const remainingAmount = Math.max(0, totalAmount - account.totalPaid);
    const nextPaymentDate = remainingAmount > 0 ? account.nextPaymentDate : getNearestUpcomingPaymentDate();
    const status = computeStatus(remainingAmount, nextPaymentDate);

    await persistAccount({
      ...account,
      items: nextItems,
      totalAmount,
      totalProducts,
      remainingAmount,
      nextPaymentDate,
      status,
    });
  };

  const handleSaveBiweekly = async () => {
    if (!account) return;
    const amt = Number(state.biweeklyAmount);
    if (!Number.isFinite(amt) || amt <= 0) return;

    await persistAccount({ ...account, biweeklyAmount: amt });
  };

  const handleEditPayment = (payment: AccountPaymentResult) => {
    setEditingPaymentId(payment.id);
    setEditPaymentAmount(String(payment.amount));
    setEditPaymentDate(payment.date);
  };

  const handleCancelEditPayment = () => {
    setEditingPaymentId(null);
    setEditPaymentAmount('');
    setEditPaymentDate('');
  };

  const handleSaveEditPayment = async (paymentId: string) => {
    if (!account) return;

    const amount = Number(editPaymentAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      await Swal.fire({
        icon: 'error',
        title: 'Monto inválido',
        text: 'El monto debe ser mayor a 0',
        confirmButtonColor: '#ec4899',
      });
      return;
    }

    try {
      const response = await fetch('/api/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId,
          amount,
          paymentDate: editPaymentDate,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result?.ok) {
        await Swal.fire({
          icon: 'error',
          title: 'Error al actualizar',
          text: result?.error || 'No se pudo actualizar el pago',
          confirmButtonColor: '#ec4899',
        });
        return;
      }

      // Actualizar el pago en el estado local
      const updatedPayments = account.payments.map((p) =>
        p.id === paymentId ? { ...p, amount, date: editPaymentDate } : p
      );

      // Recalcular totales
      const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
      const remainingAmount = Math.max(0, account.totalAmount - totalPaid);
      const nextPaymentDate = remainingAmount > 0 ? account.nextPaymentDate : editPaymentDate;
      const status = computeStatus(remainingAmount, nextPaymentDate);

      dispatch({
        type: 'SET_ACCOUNT',
        payload: {
          ...account,
          payments: updatedPayments,
          totalPaid,
          remainingAmount,
          nextPaymentDate,
          status,
        },
      });

      setEditingPaymentId(null);
      setEditPaymentAmount('');
      setEditPaymentDate('');

      await Swal.fire({
        icon: 'success',
        title: 'Pago actualizado',
        text: 'El pago se actualizó correctamente',
        timer: 1800,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
      });
    } catch (error) {
      console.error('Error updating payment:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: 'No se pudo conectar al servidor',
        confirmButtonColor: '#ec4899',
      });
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!account) return;

    const confirmation = await Swal.fire({
      icon: 'warning',
      title: '¿Eliminar pago?',
      text: 'Esta acción no se puede deshacer',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
    });

    if (!confirmation.isConfirmed) return;

    try {
      const response = await fetch(`/api/payments?paymentId=${encodeURIComponent(paymentId)}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok || !result?.ok) {
        await Swal.fire({
          icon: 'error',
          title: 'Error al eliminar',
          text: result?.error || 'No se pudo eliminar el pago',
          confirmButtonColor: '#ec4899',
        });
        return;
      }

      // Actualizar el estado local
      const updatedPayments = account.payments.filter((p) => p.id !== paymentId);
      const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
      const remainingAmount = Math.max(0, account.totalAmount - totalPaid);
      const nextPaymentDate = remainingAmount > 0 ? getNearestUpcomingPaymentDate() : account.nextPaymentDate;
      const status = computeStatus(remainingAmount, nextPaymentDate);

      dispatch({
        type: 'SET_ACCOUNT',
        payload: {
          ...account,
          payments: updatedPayments,
          totalPaid,
          remainingAmount,
          nextPaymentDate,
          status,
        },
      });

      await Swal.fire({
        icon: 'success',
        title: 'Pago eliminado',
        text: 'El pago se eliminó correctamente',
        timer: 1800,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
      });
    } catch (error) {
      console.error('Error deleting payment:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: 'No se pudo conectar al servidor',
        confirmButtonColor: '#ec4899',
      });
    }
  };

  const handleEditDetail = () => {
    if (!account) return;
    setEditDetailValue(account.detail ?? '');
    setIsEditingDetail(true);
  };

  const handleCancelEditDetail = () => {
    setEditDetailValue('');
    setIsEditingDetail(false);
  };

  const handleSaveDetail = async () => {
    if (!account) return;

    await persistAccount({
      ...account,
      detail: editDetailValue.trim() || null,
    });

    setIsEditingDetail(false);
    setEditDetailValue('');

    await Swal.fire({
      icon: 'success',
      title: 'Detalle actualizado',
      text: 'El detalle de la cuenta se actualizó correctamente',
      timer: 1800,
      showConfirmButton: false,
      toast: true,
      position: 'top-end',
    });
  };

  const handleRegisterPayment = async () => {
    if (!account) return;
    if (isSavingPayment) return;

    const amount = Number(state.paymentAmount);
    const amountError = validatePaymentAmount(amount, account.remainingAmount);
    if (amountError) {
      await Swal.fire({
        icon: 'error',
        title: 'Monto invalido',
        text: amountError,
        timer: 2400,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
      });
      return;
    }

    const paymentDate = account.nextPaymentDate ?? getNearestUpcomingPaymentDate();

    const confirmation = await Swal.fire({
      icon: 'question',
      title: 'Confirmar pago',
      text: `Cliente: ${account.clientName}\nMonto: ${formatCurrency(amount)}\nFecha de pago: ${paymentDate}`,
      showCancelButton: true,
      confirmButtonText: 'Si, registrar pago',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ec4899',
      cancelButtonColor: '#6b7280',
    });

    if (!confirmation.isConfirmed) return;

    setIsSavingPayment(true);
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: account.id,
          amount,
          paymentDate,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result?.ok) {
        await Swal.fire({
          icon: 'error',
          title: 'No se pudo registrar el pago',
          text: result?.error || 'Ocurrio un error al registrar el pago',
          timer: 2400,
          showConfirmButton: false,
          toast: true,
          position: 'top-end',
        });
        return;
      }

      const nextTotalPaid = account.totalPaid + amount;
      const remainingAmount = Math.max(0, account.totalAmount - nextTotalPaid);
      const payment: AccountPaymentResult = {
        id: result?.created?.payment?.id ?? `PAY-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        date: paymentDate,
        amount,
      };
      const nextPaymentDate = remainingAmount > 0 ? getNextPaymentDateFrom(paymentDate) : paymentDate;
      const status = computeStatus(remainingAmount, nextPaymentDate);

      const next = {
        ...account,
        totalPaid: nextTotalPaid,
        remainingAmount,
        lastPaymentDate: paymentDate,
        nextPaymentDate,
        payments: [...(account.payments ?? []), payment],
        status,
      };

      await persistAccount(next);

      const nextSuggested = getSuggestedPaymentAmount(next.biweeklyAmount, next.remainingAmount);
      dispatch({ type: 'RESET_PAYMENT_FORM', payload: { amount: nextSuggested > 0 ? String(nextSuggested) : '' } });

      await Swal.fire({
        icon: 'success',
        title: 'Pago registrado',
        text: 'El pago se registro correctamente',
        timer: 1800,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
      });
    } catch (error) {
      console.error('Error registering payment:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error de conexion',
        text: 'No se pudo conectar al servidor para registrar el pago',
        timer: 2400,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
      });
    } finally {
      setIsSavingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 md:pb-8 w-full">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden p-8 text-center">
          <div className="text-sm text-gray-600">Cargando detalle de cuenta...</div>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 md:pb-8 w-full">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden p-8 text-center">
          <div className="text-lg font-bold text-gray-900">Cuenta no encontrada</div>
          {loadError && <div className="text-sm text-gray-600 mt-2">{loadError}</div>}
          <div className="mt-6 flex justify-center">
            <Button onClick={() => dashboard?.setView({ key: 'accounts' })} variant="primary">
              Volver a cuentas
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 md:pb-8 w-full">
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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{account.clientName}</h1>
              <p className="text-sm text-gray-600 mt-1">Detalle de cuenta</p>
            </div>
          </div>

        </div>
      </div>

      <div className="mb-4 rounded-xl border border-rose-100 bg-white/90 p-4">
        <div className="grid grid-cols-3 gap-2 text-xs sm:text-sm">
          {[
            { key: 1, label: 'Resumen' },
            { key: 2, label: 'Productos' },
            { key: 3, label: 'Pagos' },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setStep(item.key as DetailStep)}
              className={`rounded-lg px-3 py-2 font-medium transition-all ${
                step === item.key ? 'bg-pink-500 text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden p-6">
            <div className="text-xs uppercase tracking-wide text-gray-500">Cliente</div>
            <div className="text-lg font-semibold text-gray-900 mt-2">{account.clientName}</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden p-6">
            <div className="text-xs uppercase tracking-wide text-gray-500">Saldo Pendiente</div>
            <div className="text-xl font-bold text-gray-900 mt-2">{formatCurrency(account.remainingAmount)}</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden p-6">
            <div className="text-xs uppercase tracking-wide text-gray-500">Saldo pagado</div>
            <div className="text-xl font-bold text-gray-900 mt-2">{formatCurrency(account.totalPaid)}</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden p-6">
            <div className="text-xs uppercase tracking-wide text-gray-500">Estado</div>
            <div className="text-lg font-semibold text-gray-900 mt-2">{getStatusLabel(account.status)}</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden p-6">
            <div className="text-xs uppercase tracking-wide text-gray-500">Monto quincenal</div>
            <div className="text-lg font-semibold text-gray-900 mt-2">{formatCurrency(account.biweeklyAmount)}</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden p-6">
            <div className="text-xs uppercase tracking-wide text-gray-500">Proximo pago</div>
            <div className="text-lg font-semibold text-gray-900 mt-2">{account.nextPaymentDate || 'Sin fecha'}</div>
          </div>
          <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs uppercase tracking-wide text-gray-500">Detalle de la cuenta</div>
              {!isEditingDetail ? (
                <button
                  type="button"
                  onClick={handleEditDetail}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                  title="Editar detalle"
                >
                  <Edit2 className="w-3 h-3" />
                  Editar
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveDetail}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
                  >
                    <Save className="w-3 h-3" />
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEditDetail}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Cancelar
                  </button>
                </div>
              )}
            </div>
            {isEditingDetail ? (
              <textarea
                value={editDetailValue}
                onChange={(e) => setEditDetailValue(e.target.value)}
                placeholder="Escribe el detalle de la cuenta..."
                rows={4}
                className="w-full px-3 py-2 text-sm text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 resize-none"
              />
            ) : (
              <div className="text-sm text-gray-800 mt-2 whitespace-pre-wrap">
                {account.detail?.trim() ? account.detail : 'Sin detalle'}
              </div>
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-gray-900">Productos</h2>
              <Button onClick={() => dashboard?.setView({ key: 'accounts_detail', accountId: account.id })} variant="primary" size="sm">
                Agregar productos
              </Button>
            </div>
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
                      <th className="hidden sm:table-cell px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Subtotal</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Accion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {items.map((item) => (
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
                            onClick={() => handleRemoveItem(item.id)}
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
      )}

      {step === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Pagos</h2>
            </div>
            <div className="p-6 space-y-3">
              <div className="rounded-xl border border-pink-100 bg-pink-50 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">Saldo pendiente</div>
                <div className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(account.remainingAmount)}</div>
              </div>

              <InputField
                label="Monto quincenal"
                type="number"
                value={state.biweeklyAmount}
                onChange={(value) => dispatch({ type: 'SET_BIWEEKLY_AMOUNT', payload: value })}
              />
              <Button onClick={handleSaveBiweekly} variant="secondary">
                Guardar monto quincenal
              </Button>

              <InputField
                label="Monto a registrar"
                type="number"
                value={state.paymentAmount}
                onChange={(value) => dispatch({ type: 'SET_PAYMENT_AMOUNT', payload: value })}
              />
              <Button onClick={handleRegisterPayment} variant="primary" loading={isSavingPayment}>
                Registrar pago
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Historial</h2>
            </div>
            <div className="p-6">
              {payments.length === 0 ? (
                <div className="text-sm text-gray-600">Aun no hay pagos registrados.</div>
              ) : (
                <>
                  <div className="md:hidden space-y-3">
                    {payments
                      .slice()
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((payment) => (
                        <div key={payment.id} className="rounded-xl border border-gray-200 bg-white p-3">
                          {editingPaymentId === payment.id ? (
                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha</label>
                                <input
                                  type="date"
                                  value={editPaymentDate}
                                  onChange={(e) => setEditPaymentDate(e.target.value)}
                                  className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Monto</label>
                                <input
                                  type="number"
                                  value={editPaymentAmount}
                                  onChange={(e) => setEditPaymentAmount(e.target.value)}
                                  className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditPayment(payment.id)}
                                  className="inline-flex items-center justify-center px-3 py-2 rounded-lg text-white bg-green-600 hover:bg-green-700 text-xs font-medium"
                                >
                                  Guardar
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelEditPayment}
                                  className="inline-flex items-center justify-center px-3 py-2 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 text-xs font-medium"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">Fecha</span>
                                <span className="text-sm text-gray-800 font-medium">{payment.date}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">Monto</span>
                                <span className="text-sm text-gray-900 font-semibold">{formatCurrency(payment.amount)}</span>
                              </div>
                              <div className="flex items-center justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleEditPayment(payment)}
                                  className="inline-flex items-center justify-center p-2 rounded-xl text-blue-600 hover:text-white bg-blue-100 hover:bg-blue-600 transition-colors"
                                  title="Editar pago"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePayment(payment.id)}
                                  className="inline-flex items-center justify-center p-2 rounded-xl text-red-600 hover:text-white bg-red-100 hover:bg-red-600 transition-colors"
                                  title="Eliminar pago"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>

                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Monto</th>
                          <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {payments
                          .slice()
                          .sort((a, b) => b.date.localeCompare(a.date))
                          .map((payment) => (
                            <tr key={payment.id} className="hover:bg-pink-50/30 transition-all">
                              {editingPaymentId === payment.id ? (
                                <>
                                  <td className="px-4 py-3">
                                    <input
                                      type="date"
                                      value={editPaymentDate}
                                      onChange={(e) => setEditPaymentDate(e.target.value)}
                                      className="w-full px-2 py-1 text-sm text-gray-900 bg-white border border-gray-300 rounded"
                                    />
                                  </td>
                                  <td className="px-4 py-3">
                                    <input
                                      type="number"
                                      value={editPaymentAmount}
                                      onChange={(e) => setEditPaymentAmount(e.target.value)}
                                      className="w-full px-2 py-1 text-sm text-right text-gray-900 bg-white border border-gray-300 rounded"
                                    />
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleSaveEditPayment(payment.id)}
                                        className="inline-flex items-center justify-center px-2 py-1 rounded-lg text-white bg-green-600 hover:bg-green-700 text-xs"
                                      >
                                        Guardar
                                      </button>
                                      <button
                                        type="button"
                                        onClick={handleCancelEditPayment}
                                        className="inline-flex items-center justify-center px-2 py-1 rounded-lg text-gray-600 bg-gray-100 hover:bg-gray-200 text-xs"
                                      >
                                        Cancelar
                                      </button>
                                    </div>
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td className="px-4 py-3 text-sm text-gray-700">{payment.date}</td>
                                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">{formatCurrency(payment.amount)}</td>
                                  <td className="px-4 py-3 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleEditPayment(payment)}
                                        className="inline-flex items-center justify-center p-2 rounded-xl text-blue-600 hover:text-white bg-blue-100 hover:bg-blue-600 transition-colors"
                                        title="Editar pago"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeletePayment(payment.id)}
                                        className="inline-flex items-center justify-center p-2 rounded-xl text-red-600 hover:text-white bg-red-100 hover:bg-red-600 transition-colors"
                                        title="Eliminar pago"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </>
                              )}
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
