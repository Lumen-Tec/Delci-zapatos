import { createClient } from '@/lib/supabase/server'
import type { DbAccountInsert } from '@/types/database'
import { computeStatus, getNearestUpcomingPaymentDate, getNextPaymentDateFrom, getNoPendingPaymentDate, isNoPendingPaymentDate, todayISO } from '@/utils/accountUtils'
import type {
    AccountChargeResult,
    AccountDetailsResult,
    AccountDetailsRow,
    AccountListResult,
    AccountListQuery,
    AccountPaymentResult,
    AccountsListRow,
    ClientDetailRelation,
    ClientListRelation,
    CreateAccountInput,
    PatchAccountDbInput,
    PatchAccountInput,
    PatchAccountResult,
    PaginatedAccountsResult,
} from '@/types/accountsRepository'

const MONEY_SCALE = 100

function toMoneyCents(value: number): number {
    return Math.round((value + Number.EPSILON) * MONEY_SCALE)
}

function fromMoneyCents(value: number): number {
    return value / MONEY_SCALE
}

type AccountTotals = { totalAmount: number; totalPaid: number; remainingAmount: number; totalCharges: number }

function getClientName(clients: ClientListRelation | ClientDetailRelation): string {
    return Array.isArray(clients) ? clients[0]?.full_name ?? 'Cliente' : clients?.full_name ?? 'Cliente'
}

function getClientPhone(clients: ClientListRelation): string {
    const client = Array.isArray(clients) ? clients[0] : clients
    return client?.phone ?? ''
}

function getClientDetailData(clients: ClientDetailRelation) {
    const client = Array.isArray(clients) ? clients[0] : clients
    return { clientName: client?.full_name ?? 'Cliente', clientPhone: client?.phone ?? '', clientAddress: client?.address ?? '' }
}

function calculateAccountTotals(
    initialBalance: number,
    accountCharges: Array<{ amount: number }>,
    accountPayments: Array<{ amount: number }>,
): AccountTotals {
    const initialBalanceCents = toMoneyCents(initialBalance)
    const chargesTotalCents = accountCharges.reduce((sum, charge) => sum + toMoneyCents(charge.amount), 0)
    const totalPaidCents = accountPayments.reduce((sum, payment) => sum + toMoneyCents(payment.amount), 0)
    const totalAmountCents = initialBalanceCents + chargesTotalCents

    return {
        totalAmount: fromMoneyCents(totalAmountCents),
        totalPaid: fromMoneyCents(totalPaidCents),
        remainingAmount: fromMoneyCents(totalAmountCents - totalPaidCents),
        totalCharges: accountCharges.length,
    }
}

function mapPatchAccountToDbInput(data: PatchAccountInput): PatchAccountDbInput {
    const update: PatchAccountDbInput = {}
    if (data.initialBalance !== undefined) update.initial_balance = data.initialBalance
    if (data.quincenalAmount !== undefined) update.quincenal_amount = data.quincenalAmount
    if (data.detail !== undefined) update.detail = data.detail
    if (data.nextPaymentDate !== undefined) update.next_payment_date = data.nextPaymentDate
    if (data.status !== undefined) update.status = data.status
    return update
}

function resolvePendingNextPaymentDate(
    payments: AccountPaymentResult[],
    fallbackCurrentNextPaymentDate: string,
    options?: { advancePaymentSchedule?: boolean; resetNextPaymentToNearest?: boolean },
): string {
    const currentDate = !fallbackCurrentNextPaymentDate || isNoPendingPaymentDate(fallbackCurrentNextPaymentDate)
        ? getNearestUpcomingPaymentDate(todayISO())
        : fallbackCurrentNextPaymentDate
    if (options?.advancePaymentSchedule && payments.length > 0) return getNextPaymentDateFrom(currentDate)
    if (options?.resetNextPaymentToNearest) return getNearestUpcomingPaymentDate(todayISO())
    return currentDate
}

export async function createAccount(data: CreateAccountInput) {
    const supabase = await createClient()
    const insert: DbAccountInsert = {
        client_id: data.clientId,
        initial_balance: data.initialBalance,
        quincenal_amount: data.quincenalAmount,
        detail: data.detail,
        next_payment_date: data.nextPaymentDate,
        status: data.initialBalance > 0 ? 'activa' : 'pagada',
    }
    const { data: account, error } = await supabase.from('accounts').insert(insert).select('id').single()
    if (error) throw error
    return account
}

export async function patchAccountById(id: string, data: PatchAccountInput): Promise<PatchAccountResult> {
    const supabase = await createClient()
    const { data: baseAccount, error: baseAccountError } = await supabase
        .from('accounts')
        .select('id, initial_balance, account_charges ( amount ), account_payments ( amount )')
        .eq('id', id)
        .maybeSingle()

    if (baseAccountError) throw baseAccountError
    if (!baseAccount) return { ok: false, reason: 'not_found' }

    if (data.initialBalance !== undefined && (baseAccount.account_payments?.length ?? 0) > 0) {
        return { ok: false, reason: 'initial_balance_locked_after_payments' }
    }

    if (data.status === 'pagada') {
        const totals = calculateAccountTotals(data.initialBalance ?? baseAccount.initial_balance, baseAccount.account_charges ?? [], baseAccount.account_payments ?? [])
        if (toMoneyCents(totals.totalAmount) !== toMoneyCents(totals.totalPaid)) {
            return { ok: false, reason: 'status_requires_full_payment', totalAmount: totals.totalAmount, totalPaid: totals.totalPaid }
        }
    }

    const { data: updated, error } = await supabase.from('accounts').update(mapPatchAccountToDbInput(data)).eq('id', id).select('id').maybeSingle()
    if (error) throw error
    return updated ? { ok: true, accountId: updated.id } : { ok: false, reason: 'not_found' }
}

/** Recalcula y persiste estado y próximo vencimiento tras cualquier movimiento. */
export async function reconcileAccount(accountId: string, options?: { advancePaymentSchedule?: boolean; resetNextPaymentToNearest?: boolean }): Promise<AccountDetailsResult> {
    const snapshot = await getAccountById(accountId)
    const nextPaymentDate = snapshot.remainingAmount > 0
        ? resolvePendingNextPaymentDate(snapshot.payments, snapshot.nextPaymentDate, options)
        : getNoPendingPaymentDate()
    const status = computeStatus(snapshot.remainingAmount, nextPaymentDate)

    const supabase = await createClient()
    const { data: storedAccount, error } = await supabase.from('accounts').select('status, next_payment_date').eq('id', accountId).maybeSingle()
    if (error) throw error
    if (!storedAccount) throw new Error(`Account ${accountId} was not found during reconciliation`)

    if (storedAccount.status !== status || storedAccount.next_payment_date !== nextPaymentDate) {
        const updated = await patchAccountById(accountId, { status, nextPaymentDate })
        if (!updated.ok && updated.reason === 'status_requires_full_payment') return snapshot
    }
    return getAccountById(accountId)
}

const ACCOUNT_LIST_FIELDS = 'id, client_id, initial_balance, quincenal_amount, detail, next_payment_date, status, created_at, clients ( full_name, phone ), account_charges ( amount ), account_payments ( amount )'

function mapAccountListRow(row: AccountsListRow): AccountListResult {
    const totals = calculateAccountTotals(row.initial_balance, row.account_charges ?? [], row.account_payments ?? [])
    return {
        id: row.id, clientId: row.client_id, clientName: getClientName(row.clients), clientPhone: getClientPhone(row.clients), createdAt: row.created_at,
        ...totals, status: computeStatus(totals.remainingAmount, row.next_payment_date),
        nextPaymentDate: row.next_payment_date, biweeklyAmount: row.quincenal_amount,
    }
}

async function getClientIdsBySearch(search: string): Promise<string[]> {
    const supabase = await createClient()
    const normalizedSearch = search.trim()
    if (!normalizedSearch) return []

    const { data: nameMatches, error: nameError } = await supabase
        .from('clients')
        .select('id')
        .ilike('full_name', `%${normalizedSearch}%`)
    if (nameError) throw nameError

    const digits = normalizedSearch.replace(/\D/g, '')
    if (!digits) return (nameMatches ?? []).map((client) => client.id)

    const { data: phoneMatches, error: phoneError } = await supabase
        .from('clients')
        .select('id')
        .ilike('phone', `%${digits}%`)
    if (phoneError) throw phoneError

    return [...new Set([...(nameMatches ?? []), ...(phoneMatches ?? [])].map((client) => client.id))]
}

/** Lista una página de cuentas y el total exacto que cumple los filtros. */
export async function getAccountsPage(query: AccountListQuery): Promise<PaginatedAccountsResult> {
    const supabase = await createClient()
    const from = (query.page - 1) * query.pageSize
    const to = from + query.pageSize - 1
    const clientIds = query.clientSearch ? await getClientIdsBySearch(query.clientSearch) : undefined
    if (clientIds && clientIds.length === 0) return { accounts: [], total: 0 }

    let request = supabase
        .from('accounts')
        .select(ACCOUNT_LIST_FIELDS, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)
    if (clientIds) request = request.in('client_id', clientIds)
    if (query.status) request = request.eq('status', query.status)
    if (query.pendingFrom && query.pendingTo) request = request
        .neq('status', 'pagada')
        .gte('next_payment_date', query.pendingFrom)
        .lte('next_payment_date', query.pendingTo)

    const { data, error, count } = await request
    if (error) throw error
    return { accounts: ((data ?? []) as AccountsListRow[]).map(mapAccountListRow), total: count ?? 0 }
}

/** @deprecated Usa getAccountsPage para no cargar todas las cuentas. */
export async function getAccounts(): Promise<AccountListResult[]> {
    const result = await getAccountsPage({ page: 1, pageSize: 1_000 })
    return result.accounts
}

export async function getAccountById(id: string): Promise<AccountDetailsResult> {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('accounts')
        .select('id, client_id, initial_balance, quincenal_amount, detail, next_payment_date, status, created_at, clients ( full_name, phone, address ), account_charges ( id, description, amount, charge_date, created_at ), account_payments ( id, amount, payment_date, created_at )')
        .eq('id', id)
        .single()
    if (error) throw error

    const details = data as AccountDetailsRow
    const totals = calculateAccountTotals(details.initial_balance, details.account_charges ?? [], details.account_payments ?? [])
    const payments: AccountPaymentResult[] = (details.account_payments ?? []).map((payment) => ({ id: payment.id, date: payment.payment_date, amount: payment.amount, createdAt: payment.created_at }))
    const charges: AccountChargeResult[] = (details.account_charges ?? [])
        .map((charge) => ({ id: charge.id, description: charge.description, amount: charge.amount, date: charge.charge_date, createdAt: charge.created_at }))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const lastPaymentDate = payments.reduce<string | undefined>((latest, payment) => !latest || payment.date > latest ? payment.date : latest, undefined)
    const client = getClientDetailData(details.clients)

    return {
        id: details.id, clientId: details.client_id, ...client, createdAt: details.created_at, ...totals,
        status: computeStatus(totals.remainingAmount, details.next_payment_date),
        nextPaymentDate: details.next_payment_date, biweeklyAmount: details.quincenal_amount,
        detail: details.detail, lastPaymentDate, charges, payments,
    }
}
