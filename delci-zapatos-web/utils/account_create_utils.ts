import type {
  CuentaClienteErroresFormulario,
  CuentaClienteFormulario,
  CuentaClientePayload,
} from '@/models/account_creation';
import { normalizeAmountInput, parseAmountInput } from '@/utils/accountUtils';

export const create_empty_cuenta_cliente_form = (): CuentaClienteFormulario => ({
  nombre_completo: '',
  telefono: '',
  direccion: '',
  monto_quincenal: '',
  saldo_inicial: '',
  detalle_cuenta: '',
});

export const normalize_full_name_input = (value: string): string => {
  return value.replace(/\s+/g, ' ').trim();
};

export const normalize_phone_input = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 8);
};

export const normalize_phone_for_api = (value: string): string => {
  const digits_only = value.replace(/\D/g, '');

  if (digits_only.length === 8) {
    return `+506${digits_only}`;
  }

  if (digits_only.length === 11 && digits_only.startsWith('506')) {
    return `+${digits_only}`;
  }

  if (digits_only.startsWith('506') && digits_only.length > 11) {
    return `+${digits_only.slice(0, 11)}`;
  }

  if (digits_only.length > 0) {
    return `+506${digits_only.slice(0, 8)}`;
  }

  return '';
};

export const normalize_amount_input_for_form = (value: string): string => {
  const sanitizedValue = value.replace(/,/g, '').replace(/\s+/g, '');
  return normalizeAmountInput(sanitizedValue);
};

export const format_amount_input_for_display = (value: string): string => {
  const normalizedValue = normalize_amount_input_for_form(value);
  if (!normalizedValue) return '';

  const [integerPart, decimalPart] = normalizedValue.split('.');
  const formattedIntegerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  if (decimalPart === undefined) {
    return formattedIntegerPart;
  }

  return `${formattedIntegerPart}.${decimalPart}`;
};

export const validate_cuenta_cliente_form = (
  form_data: CuentaClienteFormulario,
): CuentaClienteErroresFormulario => {
  const errores: CuentaClienteErroresFormulario = {};

  const nombre_limpio = normalize_full_name_input(form_data.nombre_completo);
  if (!nombre_limpio) {
    errores.nombre_completo = 'El nombre completo es obligatorio.';
  } else if (nombre_limpio.length < 3) {
    errores.nombre_completo = 'El nombre debe tener al menos 3 caracteres.';
  }

  const telefono_limpio = normalize_phone_input(form_data.telefono);
  if (telefono_limpio.length !== 8) {
    errores.telefono = 'El telefono debe tener 8 digitos.';
  }

  const direccion_limpia = form_data.direccion.trim();
  if (direccion_limpia.length > 0 && direccion_limpia.length < 5) {
    errores.direccion = 'La direccion debe tener al menos 5 caracteres.';
  }

  const monto_quincenal = parseAmountInput(form_data.monto_quincenal);
  if (!Number.isFinite(monto_quincenal) || monto_quincenal <= 0) {
    errores.monto_quincenal = 'El monto quincenal debe ser mayor a 0.';
  }

  if (form_data.saldo_inicial.trim().length > 0) {
    const saldo_inicial = parseAmountInput(form_data.saldo_inicial);
    if (!Number.isFinite(saldo_inicial) || saldo_inicial < 0) {
      errores.saldo_inicial = 'El saldo inicial debe ser 0 o mayor.';
    }
  }

  return errores;
};

export const map_form_to_payload = (form_data: CuentaClienteFormulario): CuentaClientePayload => {
  const monto_quincenal = parseAmountInput(form_data.monto_quincenal);
  const saldo_inicial = form_data.saldo_inicial.trim().length > 0
    ? parseAmountInput(form_data.saldo_inicial)
    : 0;

  return {
    full_name: normalize_full_name_input(form_data.nombre_completo),
    phone: normalize_phone_for_api(form_data.telefono),
    address: form_data.direccion.trim(),
    quincenal_amount: Number.isFinite(monto_quincenal) ? monto_quincenal : 0,
    initial_balance: Number.isFinite(saldo_inicial) ? saldo_inicial : 0,
    detail: form_data.detalle_cuenta.trim() || undefined,
  };
};
