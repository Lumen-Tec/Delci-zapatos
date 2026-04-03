'use client';

import React, { useEffect, useMemo, useReducer, useState } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import Swal from 'sweetalert2';
import { ChevronLeft } from 'lucide-react';
import { useDashboardOptional } from '@/app/dashboard/DashboardContext';
import { Button } from '@/app/components/commons/Button';
import { InputField } from '@/app/components/commons/InputField';
import { AccountDetailTabs } from '@/app/components/accounts/AccountDetailTabs';
import { AccountDetailSummaryTab } from '@/app/components/accounts/AccountDetailSummaryTab';
import { AccountDetailProductsTab } from '@/app/components/accounts/AccountDetailProductsTab';
import { AccountDetailPaymentsTab } from '@/app/components/accounts/AccountDetailPaymentsTab';
import {
  formatAmountWithSpaces,
  formatCurrency,
  normalizeAmountInput,
  parseAmountInput,
  computeStatus,
  getNearestUpcomingPaymentDate,
} from '@/lib/accountUtils';
import { validatePaymentAmount } from '@/lib/paymentUtil';
import type { AccountDetailsResult, AccountPaymentResult } from '@/types/accountsRepository';

type DetailStep = 1 | 2 | 3;
type MobileAction = 'products' | 'balance' | 'biweekly' | 'history' | 'register';

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
  const [isNotifyingClient, setIsNotifyingClient] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editPaymentAmount, setEditPaymentAmount] = useState<string>('');
  const [editPaymentDate, setEditPaymentDate] = useState<string>('');
  const [isEditingDetail, setIsEditingDetail] = useState(false);
  const [editDetailValue, setEditDetailValue] = useState<string>('');
  const [initialBalanceDraft, setInitialBalanceDraft] = useState('');
  const [isSavingBalances, setIsSavingBalances] = useState(false);
  const [mobileAction, setMobileAction] = useState<MobileAction | null>(null);

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
  const itemsTotalAmount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    [items],
  );
  const estimatedInitialBalance = useMemo(
    () => Math.max(0, (account?.totalAmount ?? 0) - itemsTotalAmount),
    [account?.totalAmount, itemsTotalAmount],
  );
  const biweeklyAmountForSuggestion = account?.biweeklyAmount;

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
    if (!account?.id) return;
    setInitialBalanceDraft(String(estimatedInitialBalance));
  }, [account?.id, estimatedInitialBalance]);

  useEffect(() => {
    if (biweeklyAmountForSuggestion == null) {
      dispatch({ type: 'SET_BIWEEKLY_AMOUNT', payload: '' });
      return;
    }

    dispatch({ type: 'SET_BIWEEKLY_AMOUNT', payload: String(biweeklyAmountForSuggestion) });
  }, [account?.id, biweeklyAmountForSuggestion]);

  useEffect(() => {
    dispatch({ type: 'SET_PAYMENT_AMOUNT', payload: '' });
    setMobileAction(null);
  }, [accountId]);

  const persistAccount = async (next: AccountDetailsResult) => {
    dispatch({ type: 'SET_ACCOUNT', payload: next });

    try {
      const response = await fetch('/api/accounts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: next.id,
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

  const handleSaveInitialBalance = async () => {
    if (!account) return;

    const nextInitialBalance = parseAmountInput(initialBalanceDraft);
    if (!Number.isFinite(nextInitialBalance) || nextInitialBalance < 0) {
      await Swal.fire({
        icon: 'error',
        title: 'Saldo inicial invalido',
        text: 'El saldo inicial debe ser un numero mayor o igual a 0',
        confirmButtonColor: '#ec4899',
      });
      return;
    }

    setIsSavingBalances(true);
    try {
      const response = await fetch('/api/accounts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: account.id,
          initialBalance: nextInitialBalance,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result?.ok || !result?.account) {
        await Swal.fire({
          icon: 'error',
          title: 'No se pudo actualizar',
          text: result?.error || 'No se pudo actualizar el saldo inicial',
          confirmButtonColor: '#ec4899',
        });
        return;
      }

      dispatch({ type: 'SET_ACCOUNT', payload: result.account as AccountDetailsResult });
      await Swal.fire({
        icon: 'success',
        title: 'Saldo inicial actualizado',
        timer: 1600,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
      });
    } catch (error) {
      console.error('Error updating initial balance:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error de conexion',
        text: 'No se pudo conectar al servidor',
        confirmButtonColor: '#ec4899',
      });
    } finally {
      setIsSavingBalances(false);
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
    const amt = parseAmountInput(state.biweeklyAmount);
    if (!Number.isFinite(amt) || amt <= 0) return;

    await persistAccount({ ...account, biweeklyAmount: amt });
  };

  const handleEditPayment = (payment: AccountPaymentResult) => {
    setEditingPaymentId(payment.id);
    setEditPaymentAmount(normalizeAmountInput(String(payment.amount)));
    setEditPaymentDate(payment.date);
  };

  const handleCancelEditPayment = () => {
    setEditingPaymentId(null);
    setEditPaymentAmount('');
    setEditPaymentDate('');
  };

  const handleSaveEditPayment = async (paymentId: string) => {
    if (!account) return;

    const amount = parseAmountInput(editPaymentAmount);
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

      if (result?.account) {
        dispatch({ type: 'SET_ACCOUNT', payload: result.account as AccountDetailsResult });
      }

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

      if (result?.account) {
        dispatch({ type: 'SET_ACCOUNT', payload: result.account as AccountDetailsResult });
      }

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

    const amount = parseAmountInput(state.paymentAmount);
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

      const reconciledAccount = (result?.account as AccountDetailsResult | undefined) ?? account;
      dispatch({ type: 'SET_ACCOUNT', payload: reconciledAccount });

      dispatch({ type: 'RESET_PAYMENT_FORM', payload: { amount: '' } });

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

  const handleNotifyClient = async () => {
    if (!account) return;
    if (isNotifyingClient) return;

    setIsNotifyingClient(true);
    try {
      const response = await fetch('/api/payments/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: account.id }),
      });

      const result = await response.json();
      if (!response.ok || !result?.ok || !result?.waUrl) {
        await Swal.fire({
          icon: 'error',
          title: 'No se pudo preparar la notificación',
          text: result?.error || 'Ocurrio un error al generar el enlace de WhatsApp',
          confirmButtonColor: '#ec4899',
        });
        return;
      }

      const opened = window.open(result.waUrl as string, '_blank', 'noopener,noreferrer');
      if (!opened) {
        await Swal.fire({
          icon: 'warning',
          title: 'Bloqueo de ventana detectado',
          text: 'Permite ventanas emergentes para abrir WhatsApp.',
          confirmButtonColor: '#ec4899',
        });
      }
    } catch (error) {
      console.error('Error creating WhatsApp notification link:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error de conexion',
        text: 'No se pudo conectar al servidor para notificar al cliente',
        confirmButtonColor: '#ec4899',
      });
    } finally {
      setIsNotifyingClient(false);
    }
  };

  const handleOpenProductsPanel = () => {
    setStep(2);
    setMobileAction('products');
  };

  const handleToggleMobileAction = (action: MobileAction) => {
    setMobileAction((current) => (current === action ? null : action));
  };

  const getMobileActionButtonClass = (isActive: boolean) =>
    `rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition-all ${
      isActive
        ? 'border-pink-300 bg-pink-50 text-pink-700'
        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
    }`;

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

      <div className="hidden md:block">
        <AccountDetailTabs step={step} onChange={setStep} />

        {step === 1 && (
          <AccountDetailSummaryTab
            account={account}
            initialBalanceDraft={initialBalanceDraft}
            onInitialBalanceDraftChange={setInitialBalanceDraft}
            onSaveInitialBalance={handleSaveInitialBalance}
            isSavingBalances={isSavingBalances}
            isEditingDetail={isEditingDetail}
            editDetailValue={editDetailValue}
            onEditDetailValueChange={setEditDetailValue}
            onEditDetail={handleEditDetail}
            onSaveDetail={handleSaveDetail}
            onCancelEditDetail={handleCancelEditDetail}
            getStatusLabel={getStatusLabel}
          />
        )}

        {step === 2 && (
          <AccountDetailProductsTab
            items={items}
            onRemoveItem={handleRemoveItem}
            onAddProducts={handleOpenProductsPanel}
          />
        )}

        {step === 3 && (
          <AccountDetailPaymentsTab
            account={account}
            payments={payments}
            biweeklyAmount={state.biweeklyAmount}
            paymentAmount={state.paymentAmount}
            onBiweeklyAmountChange={(value) => dispatch({ type: 'SET_BIWEEKLY_AMOUNT', payload: value })}
            onPaymentAmountChange={(value) => dispatch({ type: 'SET_PAYMENT_AMOUNT', payload: value })}
            onSaveBiweekly={handleSaveBiweekly}
            onRegisterPayment={handleRegisterPayment}
            isSavingPayment={isSavingPayment}
            onNotifyClient={handleNotifyClient}
            isNotifyingClient={isNotifyingClient}
            editingPaymentId={editingPaymentId}
            editPaymentAmount={editPaymentAmount}
            editPaymentDate={editPaymentDate}
            onEditPayment={handleEditPayment}
            onCancelEditPayment={handleCancelEditPayment}
            onSaveEditPayment={handleSaveEditPayment}
            onDeletePayment={handleDeletePayment}
            onEditPaymentAmountChange={setEditPaymentAmount}
            onEditPaymentDateChange={setEditPaymentDate}
          />
        )}
      </div>

      <div className="md:hidden space-y-3 pb-6">
        <AccountDetailSummaryTab
          account={account}
          initialBalanceDraft={initialBalanceDraft}
          onInitialBalanceDraftChange={setInitialBalanceDraft}
          onSaveInitialBalance={handleSaveInitialBalance}
          isSavingBalances={isSavingBalances}
          showBalanceAdjustSection={false}
          isEditingDetail={isEditingDetail}
          editDetailValue={editDetailValue}
          onEditDetailValueChange={setEditDetailValue}
          onEditDetail={handleEditDetail}
          onSaveDetail={handleSaveDetail}
          onCancelEditDetail={handleCancelEditDetail}
          getStatusLabel={getStatusLabel}
        />

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">Acciones</h2>
            <p className="text-xs text-gray-500 mt-1">Selecciona una accion para continuar.</p>
          </div>

          <div className="grid grid-cols-2 gap-2 p-3">
            <button
              type="button"
              onClick={handleOpenProductsPanel}
              className={getMobileActionButtonClass(mobileAction === 'products')}
            >
              1. Ver productos
            </button>

            <button
              type="button"
              onClick={handleOpenProductsPanel}
              className={getMobileActionButtonClass(mobileAction === 'products')}
            >
              2. Agregar productos
            </button>

            <button
              type="button"
              onClick={() => handleToggleMobileAction('balance')}
              className={getMobileActionButtonClass(mobileAction === 'balance')}
            >
              3. Cambiar saldo
            </button>

            <button
              type="button"
              onClick={() => handleToggleMobileAction('biweekly')}
              className={getMobileActionButtonClass(mobileAction === 'biweekly')}
            >
              4. Cambiar monto quincenal
            </button>

            <button
              type="button"
              onClick={() => handleToggleMobileAction('history')}
              className={getMobileActionButtonClass(mobileAction === 'history')}
            >
              5. Historial de pagos
            </button>

            <button
              type="button"
              onClick={() => handleToggleMobileAction('register')}
              className={getMobileActionButtonClass(mobileAction === 'register')}
            >
              6. Registrar pago
            </button>

            <button
              type="button"
              onClick={handleNotifyClient}
              disabled={isNotifyingClient}
              className="col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-left text-xs font-semibold text-emerald-700 transition-all hover:bg-emerald-100 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isNotifyingClient ? 'Notificando saldo...' : '7. Notificar saldo'}
            </button>
          </div>
        </div>

        {mobileAction === 'products' && (
          <AccountDetailProductsTab
            items={items}
            onRemoveItem={handleRemoveItem}
            onAddProducts={handleOpenProductsPanel}
            showAddProductsButton={false}
          />
        )}

        {mobileAction === 'balance' && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Cambiar saldo</h2>
            </div>
            <div className="p-4 space-y-3">
              <InputField
                label="Saldo inicial"
                type="text"
                size="sm"
                value={formatAmountWithSpaces(initialBalanceDraft)}
                onChange={(value) => setInitialBalanceDraft(normalizeAmountInput(value))}
              />
              <Button onClick={handleSaveInitialBalance} variant="secondary" loading={isSavingBalances} className="w-full">
                Guardar saldo inicial
              </Button>
              <div className="text-xs text-gray-500">
                El saldo pendiente se ajusta unicamente mediante el registro de pagos.
              </div>
            </div>
          </div>
        )}

        {mobileAction === 'biweekly' && (
          <AccountDetailPaymentsTab
            account={account}
            payments={payments}
            biweeklyAmount={state.biweeklyAmount}
            paymentAmount={state.paymentAmount}
            onBiweeklyAmountChange={(value) => dispatch({ type: 'SET_BIWEEKLY_AMOUNT', payload: value })}
            onPaymentAmountChange={(value) => dispatch({ type: 'SET_PAYMENT_AMOUNT', payload: value })}
            onSaveBiweekly={handleSaveBiweekly}
            onRegisterPayment={handleRegisterPayment}
            isSavingPayment={isSavingPayment}
            onNotifyClient={handleNotifyClient}
            isNotifyingClient={isNotifyingClient}
            editingPaymentId={editingPaymentId}
            editPaymentAmount={editPaymentAmount}
            editPaymentDate={editPaymentDate}
            onEditPayment={handleEditPayment}
            onCancelEditPayment={handleCancelEditPayment}
            onSaveEditPayment={handleSaveEditPayment}
            onDeletePayment={handleDeletePayment}
            onEditPaymentAmountChange={setEditPaymentAmount}
            onEditPaymentDateChange={setEditPaymentDate}
            mode="biweekly"
            showNotifyButton={false}
          />
        )}

        {mobileAction === 'history' && (
          <AccountDetailPaymentsTab
            account={account}
            payments={payments}
            biweeklyAmount={state.biweeklyAmount}
            paymentAmount={state.paymentAmount}
            onBiweeklyAmountChange={(value) => dispatch({ type: 'SET_BIWEEKLY_AMOUNT', payload: value })}
            onPaymentAmountChange={(value) => dispatch({ type: 'SET_PAYMENT_AMOUNT', payload: value })}
            onSaveBiweekly={handleSaveBiweekly}
            onRegisterPayment={handleRegisterPayment}
            isSavingPayment={isSavingPayment}
            onNotifyClient={handleNotifyClient}
            isNotifyingClient={isNotifyingClient}
            editingPaymentId={editingPaymentId}
            editPaymentAmount={editPaymentAmount}
            editPaymentDate={editPaymentDate}
            onEditPayment={handleEditPayment}
            onCancelEditPayment={handleCancelEditPayment}
            onSaveEditPayment={handleSaveEditPayment}
            onDeletePayment={handleDeletePayment}
            onEditPaymentAmountChange={setEditPaymentAmount}
            onEditPaymentDateChange={setEditPaymentDate}
            mode="history"
            showNotifyButton={false}
          />
        )}

        {mobileAction === 'register' && (
          <AccountDetailPaymentsTab
            account={account}
            payments={payments}
            biweeklyAmount={state.biweeklyAmount}
            paymentAmount={state.paymentAmount}
            onBiweeklyAmountChange={(value) => dispatch({ type: 'SET_BIWEEKLY_AMOUNT', payload: value })}
            onPaymentAmountChange={(value) => dispatch({ type: 'SET_PAYMENT_AMOUNT', payload: value })}
            onSaveBiweekly={handleSaveBiweekly}
            onRegisterPayment={handleRegisterPayment}
            isSavingPayment={isSavingPayment}
            onNotifyClient={handleNotifyClient}
            isNotifyingClient={isNotifyingClient}
            editingPaymentId={editingPaymentId}
            editPaymentAmount={editPaymentAmount}
            editPaymentDate={editPaymentDate}
            onEditPayment={handleEditPayment}
            onCancelEditPayment={handleCancelEditPayment}
            onSaveEditPayment={handleSaveEditPayment}
            onDeletePayment={handleDeletePayment}
            onEditPaymentAmountChange={setEditPaymentAmount}
            onEditPaymentDateChange={setEditPaymentDate}
            mode="register"
            showNotifyButton={false}
          />
        )}
      </div>
    </div>
  );
}
