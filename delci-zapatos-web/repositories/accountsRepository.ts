import { createClient } from '@/lib/supabase/server'
import type {
    DbAccountInsert,
} from '@/types/database'
import type {
    AccountDetailsItemResult,
    AccountDetailsResult,
    AccountDetailsRow,
    AccountListResult,
    AccountPaymentResult,
    AccountsListRow,
    ClientRelation,
    CreateAccountInput,
} from '@/types/accountsRepository'
import { STATUS_DB_TO_FRONTEND } from '@/types/database'

type AccountTotals = {
    totalAmount: number
    totalPaid: number
    remainingAmount: number
    totalProducts: number
}

/**
 * Normaliza el nombre de cliente para relaciones de Supabase.
 * Dependiendo del join inferido puede venir como objeto, arreglo o null.
 */
function getClientName(clients: ClientRelation): string {
    if (Array.isArray(clients)) return clients[0]?.full_name ?? 'Cliente'
    return clients?.full_name ?? 'Cliente'
}

/**
 * Centraliza el cálculo de totales para evitar duplicación entre listados y detalle.
 */
function calculateAccountTotals(
    initialBalance: number,
    accountItems: Array<{ quantity: number; unit_price: number }>,
    accountPayments: Array<{ amount: number }>,
): AccountTotals {
    const itemsTotal = accountItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
    const totalPaid = accountPayments.reduce((sum, payment) => sum + payment.amount, 0)
    const totalAmount = initialBalance + itemsTotal
    const totalProducts = accountItems.reduce((sum, item) => sum + item.quantity, 0)

    return {
        totalAmount,
        totalPaid,
        remainingAmount: totalAmount - totalPaid,
        totalProducts,
    }
}

/**
 * Crea una cuenta nueva con status inicial activa.
 */
export async function createAccount(data: CreateAccountInput) {
    const supabase = await createClient()

    const insert: DbAccountInsert = {
        client_id: data.clientId,
        initial_balance: data.initialBalance,
        quincenal_amount: data.quincenalAmount,
        detail: data.detail,
        next_payment_date: data.nextPaymentDate,
        status: 'activa',
    }

    const { data: account, error } = await supabase
        .from('accounts')
        .insert(insert)
        .select('id')
        .single()

    if (error) throw error
    return account
}

/**
 * Obtiene el listado de cuentas para dashboard, incluyendo totales agregados.
 */
export async function getAccounts(): Promise<AccountListResult[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('accounts')
        .select(`
            id,
            client_id,
            initial_balance,
            quincenal_amount,
            detail,
            next_payment_date,
            status,
            created_at,
            clients ( full_name ),
            account_items ( quantity, unit_price ),
            account_payments ( amount )
        `)
        .order('created_at', { ascending: false })

    if (error) throw error

    const rows = (data ?? []) as AccountsListRow[]

    return rows.map((row) => {
        const totals = calculateAccountTotals(
            row.initial_balance,
            row.account_items ?? [],
            row.account_payments ?? [],
        )

        return {
            id: row.id,
            clientId: row.client_id,
            clientName: getClientName(row.clients),
            createdAt: row.created_at,
            totalAmount: totals.totalAmount,
            totalPaid: totals.totalPaid,
            remainingAmount: totals.remainingAmount,
            totalProducts: totals.totalProducts,
            status: STATUS_DB_TO_FRONTEND[row.status],
            nextPaymentDate: row.next_payment_date,
            biweeklyAmount: row.quincenal_amount,
        }
    })
}

/**
 * Obtiene una cuenta por id con sus items y pagos para la vista de detalle.
 */
export async function getAccountById(id: string): Promise<AccountDetailsResult> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('accounts')
        .select(`
            id,
            client_id,
            initial_balance,
            quincenal_amount,
            detail,
            next_payment_date,
            status,
            created_at,
            clients ( full_name ),
            account_items (
                id, product_id, product_size_id,
                product_name, category, color, size,
                quantity, unit_price, original_price, discount_pct
            ),
            account_payments ( id, amount, payment_date, created_at )
        `)
        .eq('id', id)
        .single()

    if (error) throw error

    const details: AccountDetailsRow = data as AccountDetailsRow

    const totals = calculateAccountTotals(
        details.initial_balance,
        details.account_items ?? [],
        details.account_payments ?? [],
    )

    const payments: AccountPaymentResult[] = (details.account_payments ?? []).map((p) => ({
        id: p.id,
        date: p.payment_date,
        amount: p.amount,
    }))

    const lastPayment = payments.length > 0
        ? payments.slice().sort((a, b) => b.date.localeCompare(a.date))[0].date
        : undefined

    const items: AccountDetailsItemResult[] = (details.account_items ?? []).map((i) => ({
        id: i.id,
        productId: i.product_id,
        name: i.product_name,
        category: i.category,
        ...(i.category === 'zapatos' ? { color: i.color ?? '', size: i.size ?? '' } : {}),
        quantity: i.quantity,
        unitPrice: i.unit_price,
        originalPrice: i.original_price,
        discountPercentage: i.discount_pct,
    }))

    return {
        id: details.id,
        clientId: details.client_id,
        clientName: getClientName(details.clients),
        createdAt: details.created_at,
        totalAmount: totals.totalAmount,
        totalPaid: totals.totalPaid,
        remainingAmount: totals.remainingAmount,
        totalProducts: totals.totalProducts,
        status: STATUS_DB_TO_FRONTEND[details.status],
        nextPaymentDate: details.next_payment_date,
        biweeklyAmount: details.quincenal_amount,
        detail: details.detail,
        lastPaymentDate: lastPayment,
        items,
        payments,
    }
}
