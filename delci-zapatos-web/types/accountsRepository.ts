import type { AccountStatus, DbAccountChargeRow, DbAccountPaymentRow, DbAccountRow, DbAccountUpdate, DbClientRow } from '@/types/database'

export type CreateAccountInput = { clientId: string; initialBalance: number; quincenalAmount: number; detail?: string; nextPaymentDate: string }
export type PatchAccountInput = { initialBalance?: number; quincenalAmount?: number; detail?: string | null; nextPaymentDate?: string; status?: AccountStatus }
export type PatchAccountDbInput = DbAccountUpdate
export type PatchAccountResult =
    | { ok: true; accountId: string }
    | { ok: false; reason: 'not_found' }
    | { ok: false; reason: 'initial_balance_locked_after_payments' }
    | { ok: false; reason: 'status_requires_full_payment'; totalAmount: number; totalPaid: number }

export type ClientListRelation = Pick<DbClientRow, 'full_name' | 'phone'> | Array<Pick<DbClientRow, 'full_name' | 'phone'>> | null
export type ClientDetailRelation = Pick<DbClientRow, 'full_name' | 'phone' | 'address'> | Array<Pick<DbClientRow, 'full_name' | 'phone' | 'address'>> | null
export type AccountsListRow = DbAccountRow & { clients: ClientListRelation; account_charges: Array<Pick<DbAccountChargeRow, 'amount'>> | null; account_payments: Array<Pick<DbAccountPaymentRow, 'amount'>> | null }
export type AccountDetailsRow = DbAccountRow & { clients: ClientDetailRelation; account_charges: DbAccountChargeRow[] | null; account_payments: DbAccountPaymentRow[] | null }

export type AccountPaymentResult = { id: string; date: string; amount: number; createdAt: string }
export type AccountChargeResult = { id: string; description: string; amount: number; date: string; createdAt: string }
export type AccountListResult = {
    id: string; clientId: string; clientName: string; clientPhone: string; createdAt: string
    totalAmount: number; totalPaid: number; remainingAmount: number; totalCharges: number
    status: AccountStatus; nextPaymentDate: string; biweeklyAmount: number
}
export type AccountListQuery = {
    page: number
    pageSize: number
    status?: AccountStatus
    clientSearch?: string
    pendingFrom?: string
    pendingTo?: string
}
export type PaginatedAccountsResult = { accounts: AccountListResult[]; total: number }
export type AccountDetailsResult = AccountListResult & {
    clientPhone: string; clientAddress: string; detail: string | null; lastPaymentDate?: string
    charges: AccountChargeResult[]; payments: AccountPaymentResult[]
}
