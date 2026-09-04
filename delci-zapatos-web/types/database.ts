// Tipos que reflejan las tablas de Supabase directamente (snake_case).

export type AccountStatus = 'activa' | 'pagada' | 'atrasada'

export type DbAccountInsert = {
    client_id: string
    initial_balance: number
    quincenal_amount: number
    detail?: string
    next_payment_date: string
    status?: AccountStatus
}

export type DbAccountUpdate = Partial<{
    initial_balance: number
    quincenal_amount: number
    detail: string | null
    next_payment_date: string
    status: AccountStatus
}>

export type DbAccountRow = {
    id: string
    client_id: string
    initial_balance: number
    quincenal_amount: number
    detail: string | null
    next_payment_date: string
    status: AccountStatus
    created_at: string
}

export type DbAccountPaymentRow = { id: string; account_id: string; amount: number; payment_date: string; created_at: string }
export type DbAccountPaymentInsert = { account_id: string; amount: number; payment_date: string }
export type DbAccountPaymentUpdate = Partial<{ amount: number; payment_date: string }>

export type DbAccountChargeRow = { id: string; account_id: string; description: string; amount: number; charge_date: string; created_at: string }
export type DbAccountChargeInsert = { account_id: string; description: string; amount: number; charge_date: string }
export type DbAccountChargeUpdate = Partial<{ description: string; amount: number; charge_date: string }>

export type DbClientRow = { id: string; full_name: string; phone: string; address: string; created_at: string }
export type DbClientInsert = { full_name: string; phone: string; address: string }
export type DbClientUpdate = Partial<{ full_name: string; phone: string; address: string }>
