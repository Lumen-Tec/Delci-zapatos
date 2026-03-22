// Tipos que reflejan las tablas de Supabase directamente (snake_case)

// ── Status ──────────────────────────────────────────────
export type DbAccountStatus = 'activa' | 'pagada' | 'atrasada'
export type FrontendAccountStatus = 'active' | 'paid' | 'overdue'

export const STATUS_DB_TO_FRONTEND = {
    activa: 'active',
    pagada: 'paid',
    atrasada: 'overdue',
} as const satisfies Record<DbAccountStatus, FrontendAccountStatus>

export const STATUS_FRONTEND_TO_DB = {
    active: 'activa',
    paid: 'pagada',
    overdue: 'atrasada',
} as const satisfies Record<FrontendAccountStatus, DbAccountStatus>

// ── Accounts ────────────────────────────────────────────
export type DbAccountInsert = {
    client_id: string
    initial_balance: number
    quincenal_amount: number
    detail?: string
    next_payment_date: string
    status?: DbAccountStatus
}

export type DbAccountRow = {
    id: string
    client_id: string
    initial_balance: number
    quincenal_amount: number
    detail: string | null
    next_payment_date: string
    status: DbAccountStatus
    created_at: string
}

// ── Account Items ───────────────────────────────────────
export type DbAccountItemRow = {
    id: string
    account_id: string
    product_id: string | null
    product_size_id: string | null
    product_name: string
    category: string
    color: string | null
    size: string | null
    quantity: number
    unit_price: number
    original_price: number | null
    discount_pct: number | null
}

// ── Account Payments ────────────────────────────────────
export type DbAccountPaymentRow = {
    id: string
    account_id: string
    amount: number
    payment_date: string
    created_at: string
}

export type DbAccountPaymentInsert = {
    account_id: string
    amount: number
    payment_date: string
}

// ── Clients ─────────────────────────────────────────────
export type DbClientRow = {
    id: string
    full_name: string
    phone: string
    address: string
    created_at: string
}

export type DbClientInsert = {
    full_name: string
    phone: string
    address: string
}

// ── Products ────────────────────────────────────────────
export type DbProductRow = {
    id: string
    name: string
    sku: string | null
    category: 'zapatos' | 'bolsos'
    base_price: number
    color: string | null
    discount_pct: number | null
    discount_days: number | null
    discount_start: string | null
    stock: number
    is_active: boolean
    created_at: string
}

// ── Product Sizes ───────────────────────────────────────
export type DbProductSizeRow = {
    id: string
    product_id: string
    size: string
    price: number | null
    stock: number
    discount_pct: number | null
    discount_days: number | null
    discount_start: string | null
}
