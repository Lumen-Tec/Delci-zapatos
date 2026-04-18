export interface CuentaClienteFormulario {
  nombre_completo: string;
  telefono: string;
  direccion: string;
  monto_quincenal: string;
  saldo_inicial: string;
  abono_inicial: string;
  detalle_cuenta: string;
}

export interface CuentaClienteErroresFormulario {
  nombre_completo?: string;
  telefono?: string;
  direccion?: string;
  monto_quincenal?: string;
  saldo_inicial?: string;
  abono_inicial?: string;
  detalle_cuenta?: string;
  general?: string;
}

export interface CuentaClientePayload {
  full_name: string;
  phone: string;
  address: string;
  quincenal_amount: number;
  initial_balance: number;
  initial_payment_amount: number;
  detail?: string;
}
