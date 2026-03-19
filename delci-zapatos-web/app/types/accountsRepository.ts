import type {
    DbAccountItemRow,
    DbAccountPaymentRow,
    DbAccountRow,
    DbClientRow,
    FrontendAccountStatus,
} from '@/app/types/database'

export type CreateAccountInput = {
    clientId: string
    initialBalance: number
    quincenalAmount: number
    detail?: string
    nextPaymentDate: string
}

export type ClientRelation =
    | Pick<DbClientRow, 'full_name'>
    | Array<Pick<DbClientRow, 'full_name'>>
    | null

export type AccountsListRow = DbAccountRow & {
    clients: ClientRelation
    account_items: Array<Pick<DbAccountItemRow, 'quantity' | 'unit_price'>> | null
    account_payments: Array<Pick<DbAccountPaymentRow, 'amount'>> | null
}

export type AccountDetailsRow = DbAccountRow & {
    clients: ClientRelation
    account_items: DbAccountItemRow[] | null
    account_payments: DbAccountPaymentRow[] | null
}

export type AccountListResult = {
    id: string
    clientId: string
    clientName: string
    createdAt: string
    totalAmount: number
    totalPaid: number
    remainingAmount: number
    totalProducts: number
    status: FrontendAccountStatus
    nextPaymentDate: string
    biweeklyAmount: number
}

export type AccountDetailsItemResult = {
    id: string
    productId: string | null
    name: string
    category: string
    color?: string
    size?: string
    quantity: number
    unitPrice: number
    originalPrice: number | null
    discountPercentage: number | null
}

export type AccountPaymentResult = {
    id: string
    date: string
    amount: number
}

export type AccountDetailsResult = {
    id: string
    clientId: string
    clientName: string
    createdAt: string
    totalAmount: number
    totalPaid: number
    remainingAmount: number
    totalProducts: number
    status: FrontendAccountStatus
    nextPaymentDate: string
    biweeklyAmount: number
    detail: string | null
    lastPaymentDate?: string
    items: AccountDetailsItemResult[]
    payments: AccountPaymentResult[]
}
