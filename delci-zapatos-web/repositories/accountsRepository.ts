import { createClient } from '@/lib/supabase/server'
import type {
    DbAccountStatus,
    DbAccountInsert,
} from '@/types/database'
import { computeStatus, getNearestUpcomingPaymentDate, getNextPaymentDateFrom, todayISO } from '@/utils/accountUtils'
import type {
    AccountDetailsItemResult,
    AccountDetailsResult,
    AccountDetailsRow,
    AccountListResult,
    AccountPaymentResult,
    AccountsListRow,
    ClientRelation,
    CreateAccountInput,
    PatchAccountDbInput,
    PatchAccountInput,
    PatchAccountResult,
} from '@/types/accountsRepository'
import { STATUS_DB_TO_FRONTEND, STATUS_FRONTEND_TO_DB } from '@/types/database'

const MONEY_SCALE = 100

function toMoneyCents(value: number): number {
    return Math.round((value + Number.EPSILON) * MONEY_SCALE)
}

function fromMoneyCents(value: number): number {
    return value / MONEY_SCALE
}

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
    const initialBalanceCents = toMoneyCents(initialBalance)
    const itemsTotalCents = accountItems.reduce((sum, item) => {
        return sum + item.quantity * toMoneyCents(item.unit_price)
    }, 0)
    const totalPaidCents = accountPayments.reduce((sum, payment) => {
        return sum + toMoneyCents(payment.amount)
    }, 0)

    const totalAmountCents = initialBalanceCents + itemsTotalCents
    const remainingAmountCents = totalAmountCents - totalPaidCents

    const totalAmount = fromMoneyCents(totalAmountCents)
    const totalPaid = fromMoneyCents(totalPaidCents)
    const totalProducts = accountItems.reduce((sum, item) => sum + item.quantity, 0)

    return {
        totalAmount,
        totalPaid,
        remainingAmount: fromMoneyCents(remainingAmountCents),
        totalProducts,
    }
}

function mapPatchAccountToDbInput(data: PatchAccountInput): PatchAccountDbInput {
    const update: PatchAccountDbInput = {}

    if (data.initialBalance !== undefined) update.initial_balance = data.initialBalance
    if (data.quincenalAmount !== undefined) update.quincenal_amount = data.quincenalAmount
    if (data.detail !== undefined) update.detail = data.detail
    if (data.nextPaymentDate !== undefined) update.next_payment_date = data.nextPaymentDate
    if (data.status !== undefined) update.status = STATUS_FRONTEND_TO_DB[data.status]

    return update
}

function resolvePendingNextPaymentDate(
    payments: AccountPaymentResult[],
    fallbackCurrentNextPaymentDate: string,
    deletedPaymentDateHint?: string,
): string {
    if (payments.length > 0) {
        const latestPaymentDate = payments.reduce((latest, payment) => {
            return payment.date > latest ? payment.date : latest
        }, payments[0].date)

        return getNextPaymentDateFrom(latestPaymentDate)
    }

    if (deletedPaymentDateHint) {
        return deletedPaymentDateHint
    }

    const today = todayISO()
    if (!fallbackCurrentNextPaymentDate || fallbackCurrentNextPaymentDate < today) {
        return getNearestUpcomingPaymentDate(today)
    }

    return fallbackCurrentNextPaymentDate
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
 * Actualiza parcialmente una cuenta.
 * Solo persiste los campos enviados y retorna null si la cuenta no existe.
 */
export async function patchAccountById(id: string, data: PatchAccountInput): Promise<PatchAccountResult> {
    const supabase = await createClient()

    const { data: baseAccount, error: baseAccountError } = await supabase
        .from('accounts')
        .select(`
            id,
            initial_balance,
            account_items ( quantity, unit_price ),
            account_payments ( amount )
        `)
        .eq('id', id)
        .maybeSingle()

    if (baseAccountError) throw baseAccountError
    if (!baseAccount) return { ok: false, reason: 'not_found' }

    if (data.status === 'pagada') {
        const totals = calculateAccountTotals(
            data.initialBalance ?? baseAccount.initial_balance,
            baseAccount.account_items ?? [],
            baseAccount.account_payments ?? [],
        )

        if (toMoneyCents(totals.totalAmount) !== toMoneyCents(totals.totalPaid)) {
            return {
                ok: false,
                reason: 'status_requires_full_payment',
                totalAmount: totals.totalAmount,
                totalPaid: totals.totalPaid,
            }
        }
    }

    const update = mapPatchAccountToDbInput(data)

    const { data: updated, error } = await supabase
        .from('accounts')
        .update(update)
        .eq('id', id)
        .select('id')
        .maybeSingle()

    if (error) throw error
    if (!updated) return { ok: false, reason: 'not_found' }

    return { ok: true, accountId: updated.id }
}

/**
 * Recalcula y persiste estado/fecha de la cuenta tras operaciones de pago.
 */
export async function reconcileAccountAfterPayment(
    accountId: string,
    options?: { deletedPaymentDateHint?: string },
): Promise<AccountDetailsResult> {
    const snapshot = await getAccountById(accountId)

    const nextPaymentDate = snapshot.remainingAmount > 0
        ? resolvePendingNextPaymentDate(
            snapshot.payments,
            snapshot.nextPaymentDate,
            options?.deletedPaymentDateHint,
        )
        : (snapshot.lastPaymentDate ?? snapshot.nextPaymentDate)

    const status = computeStatus(snapshot.remainingAmount, nextPaymentDate)
    const needsUpdate = snapshot.status !== status || snapshot.nextPaymentDate !== nextPaymentDate

    if (!needsUpdate) {
        return snapshot
    }

    const updated = await patchAccountById(accountId, { status, nextPaymentDate })

    if (!updated.ok && updated.reason === 'status_requires_full_payment') {
        return snapshot
    }

    return getAccountById(accountId)
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
            status: STATUS_DB_TO_FRONTEND[row.status as DbAccountStatus],
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
        createdAt: p.created_at,
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
        status: STATUS_DB_TO_FRONTEND[details.status as DbAccountStatus],
        nextPaymentDate: details.next_payment_date,
        biweeklyAmount: details.quincenal_amount,
        detail: details.detail,
        lastPaymentDate: lastPayment,
        items,
        payments,
    }
}
