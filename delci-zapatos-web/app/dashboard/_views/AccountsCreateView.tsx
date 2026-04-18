'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft } from 'lucide-react';
import Swal from 'sweetalert2';
import { useDashboard } from '@/app/dashboard/DashboardContext';
import { AccountCreateFormCard } from '@/app/components/accounts/AccountCreateFormCard';
import type { CuentaClienteErroresFormulario, CuentaClienteFormulario } from '@/models/account_creation';
import {
  create_empty_cuenta_cliente_form,
  map_form_to_payload,
  normalize_amount_input_for_form,
  normalize_phone_input,
  validate_cuenta_cliente_form,
} from '@/utils/account_create_utils';
import { todayISO } from '@/utils/accountUtils';

export default function AccountsCreateView() {
  const { setView } = useDashboard();

  const [form_data, set_form_data] = useState<CuentaClienteFormulario>(create_empty_cuenta_cliente_form);
  const [form_errors, set_form_errors] = useState<CuentaClienteErroresFormulario>({});
  const [is_creating_account, set_is_creating_account] = useState(false);

  const format_currency = (amount: number) =>
    new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 2,
    }).format(amount);

  const clear_field_error = (field: keyof CuentaClienteFormulario) => {
    set_form_errors((current_errors) => ({
      ...current_errors,
      [field]: undefined,
      general: undefined,
    }));
  };

  const handle_change_field = (field: keyof CuentaClienteFormulario, value: string) => {
    set_form_data((current_form_data) => {
      if (field === 'telefono') {
        return { ...current_form_data, telefono: normalize_phone_input(value) };
      }

      if (field === 'monto_quincenal' || field === 'saldo_inicial' || field === 'abono_inicial') {
        return {
          ...current_form_data,
          [field]: normalize_amount_input_for_form(value),
        };
      }

      return { ...current_form_data, [field]: value };
    });

    if (form_errors[field] || form_errors.general) {
      clear_field_error(field);
    }
  };

  const handle_reset_form = () => {
    set_form_data(create_empty_cuenta_cliente_form());
    set_form_errors({});
  };

  const map_api_validation_errors = (errors: Array<{ field: string; message: string }>): CuentaClienteErroresFormulario => {
    const next_errors: CuentaClienteErroresFormulario = {};

    for (const current_error of errors) {
      if (current_error.field === 'fullName') next_errors.nombre_completo = current_error.message;
      if (current_error.field === 'phone') next_errors.telefono = current_error.message;
      if (current_error.field === 'address') next_errors.direccion = current_error.message;
    }

    return next_errors;
  };

  const handle_create_account = async () => {
    const validation_errors = validate_cuenta_cliente_form(form_data);
    if (Object.keys(validation_errors).length > 0) {
      set_form_errors(validation_errors);
      await Swal.fire({
        icon: 'error',
        title: 'Datos incompletos',
        text: 'Revisa los campos marcados para continuar.',
        confirmButtonColor: '#ec4899',
      });
      return;
    }

    const payload = map_form_to_payload(form_data);
    const initial_balance_text = format_currency(payload.initial_balance);
    const initial_payment_text = payload.initial_payment_amount > 0
      ? format_currency(payload.initial_payment_amount)
      : 'Sin abono inicial';

    const confirmation = await Swal.fire({
      icon: 'question',
      title: 'Confirmar creacion',
      text: `Se creara el cliente y su cuenta.\nCliente: ${payload.full_name}\nTelefono: ${payload.phone}\nMonto quincenal: ${format_currency(payload.quincenal_amount)}\nSaldo inicial: ${initial_balance_text}\nAbono inicial: ${initial_payment_text}`,
      showCancelButton: true,
      confirmButtonText: 'Si, crear cuenta',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ec4899',
      cancelButtonColor: '#6b7280',
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    set_is_creating_account(true);
    set_form_errors({});

    try {
      const create_client_response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: payload.full_name,
          phone: payload.phone,
          address: payload.address,
        }),
      });

      const create_client_data = await create_client_response.json();

      if (!create_client_response.ok || !create_client_data?.ok) {
        if (create_client_response.status === 409 || create_client_data?.code === 'duplicate_phone') {
          set_form_errors({
            telefono: 'Este telefono ya existe en el sistema.',
          });
          await Swal.fire({
            icon: 'error',
            title: 'Telefono duplicado',
            text: 'No se puede crear una cuenta repetida con el mismo telefono.',
            confirmButtonColor: '#ec4899',
          });
          return;
        }

        if (Array.isArray(create_client_data?.errors)) {
          set_form_errors({
            ...map_api_validation_errors(create_client_data.errors as Array<{ field: string; message: string }>),
          });
          await Swal.fire({
            icon: 'error',
            title: 'Error de validacion',
            text: 'Hay campos del cliente con datos no validos.',
            confirmButtonColor: '#ec4899',
          });
          return;
        }

        set_form_errors({
          general: create_client_data?.error || 'No se pudo crear el cliente para la cuenta.',
        });
        await Swal.fire({
          icon: 'error',
          title: 'Error al crear cliente',
          text: create_client_data?.error || 'No se pudo crear el cliente para la cuenta.',
          confirmButtonColor: '#ec4899',
        });
        return;
      }

      const client_id = create_client_data?.created?.id as string | undefined;
      if (!client_id) {
        set_form_errors({ general: 'No se pudo obtener el identificador del cliente creado.' });
        await Swal.fire({
          icon: 'error',
          title: 'Error de integridad',
          text: 'No se pudo obtener el identificador del cliente creado.',
          confirmButtonColor: '#ec4899',
        });
        return;
      }

      const create_account_response = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: client_id,
          initialBalance: payload.initial_balance,
          quincenalAmount: payload.quincenal_amount,
          detail: payload.detail,
        }),
      });

      const create_account_data = await create_account_response.json();

      if (!create_account_response.ok || !create_account_data?.ok) {
        set_form_errors({ general: create_account_data?.error || 'No se pudo crear la cuenta.' });
        await Swal.fire({
          icon: 'error',
          title: 'Error al crear cuenta',
          text: create_account_data?.error || 'No se pudo crear la cuenta.',
          confirmButtonColor: '#ec4899',
        });
        return;
      }

      const account_id = create_account_data?.created?.id as string | undefined;
      if (!account_id) {
        set_form_errors({ general: 'No se pudo obtener el identificador de la cuenta creada.' });
        await Swal.fire({
          icon: 'error',
          title: 'Error de integridad',
          text: 'No se pudo obtener el identificador de la cuenta creada.',
          confirmButtonColor: '#ec4899',
        });
        return;
      }

      if (payload.initial_payment_amount > 0) {
        try {
          const create_payment_response = await fetch('/api/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              accountId: account_id,
              amount: payload.initial_payment_amount,
              paymentDate: todayISO(),
            }),
          });

          const create_payment_data = await create_payment_response.json();

          if (!create_payment_response.ok || !create_payment_data?.ok) {
            await Swal.fire({
              icon: 'warning',
              title: 'Cuenta creada con observaciones',
              text: create_payment_data?.error || 'La cuenta se creo, pero no se pudo registrar el abono inicial.',
              confirmButtonColor: '#ec4899',
            });
            setView({ key: 'home' });
            return;
          }
        } catch (payment_error) {
          console.error('Error creating initial payment:', payment_error);
          await Swal.fire({
            icon: 'warning',
            title: 'Cuenta creada con observaciones',
            text: 'La cuenta se creo, pero no se pudo registrar el abono inicial por un error de conexion.',
            confirmButtonColor: '#ec4899',
          });
          setView({ key: 'home' });
          return;
        }
      }

      await Swal.fire({
        icon: 'success',
        title: payload.initial_payment_amount > 0 ? 'Cuenta y abono creados' : 'Cuenta creada',
        text: payload.initial_payment_amount > 0
          ? 'La cuenta y el abono inicial se registraron correctamente.'
          : 'La cuenta se creo correctamente.',
        confirmButtonColor: '#ec4899',
        confirmButtonText: 'Aceptar',
      });

      setView({ key: 'home' });
    } catch (error) {
      console.error('Error creating account from separate view:', error);
      set_form_errors({ general: 'Error de conexion al crear la cuenta.' });
      await Swal.fire({
        icon: 'error',
        title: 'Error de conexion',
        text: 'No se pudo conectar al servidor para crear la cuenta.',
        confirmButtonColor: '#ec4899',
      });
    } finally {
      set_is_creating_account(false);
    }
  };

  return (
    <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-8 w-full">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setView({ key: 'home' })}
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/80 border border-rose-200 text-rose-700 shadow-sm hover:bg-white transition-all"
            title="Volver"
            aria-label="Volver al listado de cuentas"
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Crear cuenta</h1>
            <p className="text-sm text-gray-600 mt-1">Formulario en vista aparte para facilitar el proceso.</p>
          </div>
        </div>
      </div>

      <AccountCreateFormCard
        form_data={form_data}
        form_errors={form_errors}
        is_submitting={is_creating_account}
        on_change_field={handle_change_field}
        on_submit={handle_create_account}
        on_reset={handle_reset_form}
      />
    </div>
  );
}
