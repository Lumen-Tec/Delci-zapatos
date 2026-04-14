'use client';

import React, { useEffect, useMemo, useReducer, useState } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import Swal from 'sweetalert2';
import { ChevronLeft } from 'lucide-react';
import { useDashboardOptional } from '@/app/dashboard/DashboardContext';
import { Button } from '@/app/components/commons/Button';
import { InputField } from '@/app/components/commons/InputField';
import { Modal } from '@/app/components/shared/Modal';
import { AccountDetailSummaryTab } from '@/app/components/accounts/AccountDetailSummaryTab';
import { AccountDetailPaymentsTab } from '@/app/components/accounts/AccountDetailPaymentsTab';
import {
  formatAmountWithSpaces,
  formatCurrency,
  normalizeAmountInput,
  parseAmountInput,
  getNearestUpcomingPaymentDate,
} from '@/utils/accountUtils';
import { validatePaymentAmount } from '@/utils/paymentUtil';
import {
  normalizePhoneForStorage,
  validateAddress,
  validateFullName,
  validatePhone,
} from '@/utils/clientUtils';
import type { AccountDetailsResult, AccountPaymentResult } from '@/types/accountsRepository';

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

  const [isLoading, setIsLoading] = useState(false);
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [isNotifyingClient, setIsNotifyingClient] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editPaymentAmount, setEditPaymentAmount] = useState<string>('');
  const [editPaymentDate, setEditPaymentDate] = useState<string>('');
  const [isEditingDetail, setIsEditingDetail] = useState(false);
  const [editDetailValue, setEditDetailValue] = useState<string>('');
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [editClientFullName, setEditClientFullName] = useState('');
  const [editClientPhone, setEditClientPhone] = useState('');
  const [editClientAddress, setEditClientAddress] = useState('');
  const [isSavingClient, setIsSavingClient] = useState(false);
  const [initialBalanceDraft, setInitialBalanceDraft] = useState('');
  const [isSavingBalances, setIsSavingBalances] = useState(false);
  const [isSavingBiweekly, setIsSavingBiweekly] = useState(false);
  const [isInitialBalanceModalOpen, setIsInitialBalanceModalOpen] = useState(false);
  const [isBiweeklyModalOpen, setIsBiweeklyModalOpen] = useState(false);
  const [isRegisterPaymentModalOpen, setIsRegisterPaymentModalOpen] = useState(false);

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
  }, [accountId]);

  const persistAccount = async (next: AccountDetailsResult): Promise<boolean> => {
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
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating account:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: 'No se pudo conectar al servidor para actualizar la cuenta',
        confirmButtonColor: '#ec4899',
      });

      return false;
    }
  };

  const handleSaveInitialBalance = async (): Promise<boolean> => {
    if (!account) return false;

    const nextInitialBalance = parseAmountInput(initialBalanceDraft);
    if (!Number.isFinite(nextInitialBalance) || nextInitialBalance < 0) {
      await Swal.fire({
        icon: 'error',
        title: 'Saldo inicial invalido',
        text: 'El saldo inicial debe ser un numero mayor o igual a 0',
        confirmButtonColor: '#ec4899',
      });
      return false;
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
        return false;
      }

      dispatch({ type: 'SET_ACCOUNT', payload: result.account as AccountDetailsResult });
      await Swal.fire({
        icon: 'success',
        title: 'Saldo inicial actualizado',
        confirmButtonColor: '#ec4899',
        confirmButtonText: 'Aceptar',
      });

      return true;
    } catch (error) {
      console.error('Error updating initial balance:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error de conexion',
        text: 'No se pudo conectar al servidor',
        confirmButtonColor: '#ec4899',
      });

      return false;
    } finally {
      setIsSavingBalances(false);
    }
  };

  const handleSaveBiweekly = async (): Promise<boolean> => {
    if (!account) return false;
    if (isSavingBiweekly) return false;

    const amt = parseAmountInput(state.biweeklyAmount);
    if (!Number.isFinite(amt) || amt <= 0) {
      await Swal.fire({
        icon: 'error',
        title: 'Monto invalido',
        text: 'El monto quincenal debe ser mayor a 0',
        confirmButtonColor: '#ec4899',
      });
      return false;
    }

    setIsSavingBiweekly(true);
    try {
      const wasSaved = await persistAccount({ ...account, biweeklyAmount: amt });
      if (!wasSaved) return false;

      await Swal.fire({
        icon: 'success',
        title: 'Monto quincenal actualizado',
        confirmButtonColor: '#ec4899',
        confirmButtonText: 'Aceptar',
      });

      return true;
    } finally {
      setIsSavingBiweekly(false);
    }
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
        confirmButtonColor: '#ec4899',
        confirmButtonText: 'Aceptar',
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
        confirmButtonColor: '#ec4899',
        confirmButtonText: 'Aceptar',
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

    const wasSaved = await persistAccount({
      ...account,
      detail: editDetailValue.trim() || null,
    });

    if (!wasSaved) return;

    setIsEditingDetail(false);
    setEditDetailValue('');

    await Swal.fire({
      icon: 'success',
      title: 'Detalle actualizado',
      text: 'El detalle de la cuenta se actualizó correctamente',
      confirmButtonColor: '#ec4899',
      confirmButtonText: 'Aceptar',
    });
  };

  const handleEditClient = () => {
    if (!account) return;

    setEditClientFullName(account.clientName);
    setEditClientPhone(account.clientPhone);
    setEditClientAddress(account.clientAddress);
    setIsEditingClient(true);
  };

  const handleCancelEditClient = () => {
    setEditClientFullName('');
    setEditClientPhone('');
    setEditClientAddress('');
    setIsEditingClient(false);
  };

  const handleSaveClient = async () => {
    if (!account) return;
    if (isSavingClient) return;

    const nextFullName = editClientFullName.trim();
    const nextPhoneInput = editClientPhone.trim();
    const nextAddress = editClientAddress.trim();

    const fullNameError = validateFullName(nextFullName);
    if (fullNameError) {
      await Swal.fire({
        icon: 'error',
        title: 'Nombre invalido',
        text: fullNameError.message,
        confirmButtonColor: '#ec4899',
      });
      return;
    }

    const normalizedPhone = normalizePhoneForStorage(nextPhoneInput);
    const phoneError = validatePhone(normalizedPhone || nextPhoneInput);
    if (phoneError) {
      await Swal.fire({
        icon: 'error',
        title: 'Telefono invalido',
        text: phoneError.message,
        confirmButtonColor: '#ec4899',
      });
      return;
    }

    const addressError = validateAddress(nextAddress);
    if (addressError) {
      await Swal.fire({
        icon: 'error',
        title: 'Direccion invalida',
        text: addressError.message,
        confirmButtonColor: '#ec4899',
      });
      return;
    }

    setIsSavingClient(true);
    try {
      const response = await fetch('/api/clients', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: account.clientId,
          fullName: nextFullName,
          phone: normalizedPhone,
          address: nextAddress,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result?.ok || !result?.updated) {
        const fallbackError = Array.isArray(result?.errors)
          ? result.errors.find((err: { message?: string }) => typeof err?.message === 'string')?.message
          : undefined;

        await Swal.fire({
          icon: 'error',
          title: 'No se pudo actualizar cliente',
          text: fallbackError || result?.error || 'Ocurrio un error al actualizar cliente',
          confirmButtonColor: '#ec4899',
        });
        return;
      }

      const updated = result.updated as { fullName: string; phone: string; address: string };
      dispatch({
        type: 'SET_ACCOUNT',
        payload: {
          ...account,
          clientName: updated.fullName,
          clientPhone: updated.phone,
          clientAddress: updated.address,
        },
      });

      setIsEditingClient(false);
      setEditClientFullName('');
      setEditClientPhone('');
      setEditClientAddress('');

      await Swal.fire({
        icon: 'success',
        title: 'Cliente actualizado',
        text: 'Los datos del cliente se actualizaron correctamente',
        confirmButtonColor: '#ec4899',
      });
    } catch (error) {
      console.error('Error updating client:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error de conexion',
        text: 'No se pudo conectar al servidor para actualizar el cliente',
        confirmButtonColor: '#ec4899',
      });
    } finally {
      setIsSavingClient(false);
    }
  };

  const handleRegisterPayment = async (): Promise<boolean> => {
    if (!account) return false;
    if (isSavingPayment) return false;

    const amount = parseAmountInput(state.paymentAmount);
    const amountError = validatePaymentAmount(amount, account.remainingAmount);
    if (amountError) {
      await Swal.fire({
        icon: 'error',
        title: 'Monto invalido',
        text: amountError,
        confirmButtonColor: '#ec4899',
        confirmButtonText: 'Aceptar',
      });
      return false;
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

    if (!confirmation.isConfirmed) return false;

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
          confirmButtonColor: '#ec4899',
          confirmButtonText: 'Aceptar',
        });
        return false;
      }

      const reconciledAccount = (result?.account as AccountDetailsResult | undefined) ?? account;
      dispatch({ type: 'SET_ACCOUNT', payload: reconciledAccount });

      dispatch({ type: 'RESET_PAYMENT_FORM', payload: { amount: '' } });

      await Swal.fire({
        icon: 'success',
        title: 'Pago registrado',
        text: 'El pago se registro correctamente',
        confirmButtonColor: '#ec4899',
        confirmButtonText: 'Aceptar',
      });

      return true;
    } catch (error) {
      console.error('Error registering payment:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error de conexion',
        text: 'No se pudo conectar al servidor para registrar el pago',
        confirmButtonColor: '#ec4899',
        confirmButtonText: 'Aceptar',
      });

      return false;
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

  const handleSaveInitialBalanceModal = async () => {
    const wasSaved = await handleSaveInitialBalance();
    if (!wasSaved) return;
    setIsInitialBalanceModalOpen(false);
  };

  const handleSaveBiweeklyModal = async () => {
    const wasSaved = await handleSaveBiweekly();
    if (!wasSaved) return;
    setIsBiweeklyModalOpen(false);
  };

  const handleRegisterPaymentModal = async () => {
    const wasSaved = await handleRegisterPayment();
    if (!wasSaved) return;
    setIsRegisterPaymentModalOpen(false);
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
            <Button onClick={() => dashboard?.setView({ key: 'home' })} variant="primary">
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
              onClick={() => dashboard?.setView({ key: 'home' })}
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

      <div className="space-y-4 pb-6">
        <AccountDetailSummaryTab
          account={account}
          initialBalanceDraft={initialBalanceDraft}
          onInitialBalanceDraftChange={setInitialBalanceDraft}
          onSaveInitialBalance={handleSaveInitialBalance}
          isSavingBalances={isSavingBalances}
          showBalanceAdjustSection={false}
          isEditingClient={isEditingClient}
          clientFullNameDraft={editClientFullName}
          clientPhoneDraft={editClientPhone}
          clientAddressDraft={editClientAddress}
          onClientFullNameChange={setEditClientFullName}
          onClientPhoneChange={setEditClientPhone}
          onClientAddressChange={setEditClientAddress}
          onEditClient={handleEditClient}
          onSaveClient={handleSaveClient}
          onCancelEditClient={handleCancelEditClient}
          isSavingClient={isSavingClient}
          isEditingDetail={isEditingDetail}
          editDetailValue={editDetailValue}
          onEditDetailValueChange={setEditDetailValue}
          onEditDetail={handleEditDetail}
          onSaveDetail={handleSaveDetail}
          onCancelEditDetail={handleCancelEditDetail}
          getStatusLabel={getStatusLabel}
        />

        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
          <div className="px-4 sm:px-6 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Acciones de cuenta</h2>
          </div>
          <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <Button
              variant="secondary"
              className="w-full border border-rose-200 bg-rose-100 text-rose-700 hover:bg-rose-200 focus:ring-rose-300"
              onClick={() => setIsInitialBalanceModalOpen(true)}
            >
              Cambiar saldo inicial
            </Button>
            <Button
              variant="secondary"
              className="w-full border border-fuchsia-200 bg-fuchsia-100 text-fuchsia-700 hover:bg-fuchsia-200 focus:ring-fuchsia-300"
              onClick={() => setIsBiweeklyModalOpen(true)}
            >
              Cambiar monto quincenal
            </Button>
            <Button
              variant="primary"
              className="w-full bg-pink-600 hover:bg-pink-700 focus:ring-pink-600"
              onClick={() => setIsRegisterPaymentModalOpen(true)}
            >
              Registrar pago
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleNotifyClient}
              loading={isNotifyingClient}
            >
              Notificar por WhatsApp
            </Button>
          </div>
        </div>

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
      </div>

      <Modal
        isOpen={isInitialBalanceModalOpen}
        onClose={() => setIsInitialBalanceModalOpen(false)}
        title="Cambiar saldo inicial"
      >
        <div className="space-y-4">
          <InputField
            label="Nuevo saldo inicial"
            type="text"
            value={formatAmountWithSpaces(initialBalanceDraft)}
            onChange={(value) => setInitialBalanceDraft(normalizeAmountInput(value))}
            placeholder="Ej: 120000"
          />
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsInitialBalanceModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveInitialBalanceModal} loading={isSavingBalances}>
              Guardar cambio
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isBiweeklyModalOpen}
        onClose={() => setIsBiweeklyModalOpen(false)}
        title="Cambiar monto quincenal"
      >
        <div className="space-y-4">
          <InputField
            label="Nuevo monto quincenal"
            type="text"
            value={formatAmountWithSpaces(state.biweeklyAmount)}
            onChange={(value) => dispatch({ type: 'SET_BIWEEKLY_AMOUNT', payload: normalizeAmountInput(value) })}
            placeholder="Ej: 45000"
          />
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsBiweeklyModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveBiweeklyModal} loading={isSavingBiweekly}>
              Guardar cambio
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isRegisterPaymentModalOpen}
        onClose={() => setIsRegisterPaymentModalOpen(false)}
        title="Registrar pago"
      >
        <div className="space-y-4">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Saldo pendiente</div>
          <div className="text-lg font-semibold text-gray-900 -mt-3">{formatCurrency(account.remainingAmount)}</div>
          <InputField
            label="Monto a registrar"
            type="text"
            value={formatAmountWithSpaces(state.paymentAmount)}
            onChange={(value) => dispatch({ type: 'SET_PAYMENT_AMOUNT', payload: normalizeAmountInput(value) })}
            placeholder="Ej: 30000"
          />
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsRegisterPaymentModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRegisterPaymentModal} loading={isSavingPayment}>
              Registrar pago
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
