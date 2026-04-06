'use client';

import type { CuentaClienteErroresFormulario, CuentaClienteFormulario } from '@/models/account_creation';
import { Button } from '@/app/components/commons/Button';
import { InputField } from '@/app/components/commons/InputField';
import { format_amount_input_for_display } from '@/utils/account_create_utils';

interface AccountCreateFormCardProps {
  form_data: CuentaClienteFormulario;
  form_errors: CuentaClienteErroresFormulario;
  is_submitting: boolean;
  on_change_field: (field: keyof CuentaClienteFormulario, value: string) => void;
  on_submit: () => void;
  on_reset: () => void;
}

export function AccountCreateFormCard({
  form_data,
  form_errors,
  is_submitting,
  on_change_field,
  on_submit,
  on_reset,
}: AccountCreateFormCardProps) {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Nueva cuenta</h2>
        <p className="mt-1 text-xs sm:text-sm text-gray-600">
          Ingrese los datos del cliente y de la cuenta en un solo formulario.
        </p>
      </div>

      <div className="p-4 sm:p-6 space-y-5">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Datos del cliente</h3>
            <p className="text-xs text-gray-500 mt-1">Nombre, telefono y direccion del cliente.</p>
          </div>

          <InputField
            label="Nombre completo"
            value={form_data.nombre_completo}
            onChange={(value) => on_change_field('nombre_completo', value)}
            placeholder="Ej: Maria Fernanda"
            error={form_errors.nombre_completo}
            required
          />

          <InputField
            label="Telefono (+506)"
            type="tel"
            value={form_data.telefono}
            onChange={(value) => on_change_field('telefono', value)}
            placeholder="Ej: 88887777"
            error={form_errors.telefono}
            required
          />

          <InputField
            label="Direccion (opcional)"
            value={form_data.direccion}
            onChange={(value) => on_change_field('direccion', value)}
            placeholder="Ej: San Jose, Desamparados"
            error={form_errors.direccion}
          />
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Datos de la cuenta</h3>
            <p className="text-xs text-gray-500 mt-1">Defina el monto quincenal y opcionalmente saldo inicial.</p>
          </div>

          <InputField
            label="Monto quincenal"
            value={format_amount_input_for_display(form_data.monto_quincenal)}
            onChange={(value) => on_change_field('monto_quincenal', value)}
            placeholder="Ej: 10,000"
            error={form_errors.monto_quincenal}
            required
          />

          <InputField
            label="Saldo inicial (opcional)"
            value={format_amount_input_for_display(form_data.saldo_inicial)}
            onChange={(value) => on_change_field('saldo_inicial', value)}
            placeholder="Ej: 100,000"
            error={form_errors.saldo_inicial}
          />

          <div>
            <label htmlFor="detalle_cuenta" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Detalle de la cuenta (opcional)
            </label>
            <textarea
              id="detalle_cuenta"
              rows={3}
              value={form_data.detalle_cuenta}
              onChange={(event) => on_change_field('detalle_cuenta', event.target.value)}
              placeholder="Ej: Cuenta creada por compra de calzado escolar"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-all duration-200 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
        </div>

        {form_errors.general && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {form_errors.general}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Button type="button" variant="primary" loading={is_submitting} onClick={on_submit} className="w-full">
            Crear cuenta
          </Button>
          <Button type="button" variant="secondary" onClick={on_reset} disabled={is_submitting} className="w-full">
            Limpiar formulario
          </Button>
        </div>
      </div>
    </section>
  );
}
