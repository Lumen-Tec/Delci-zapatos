import type { DbAccountPaymentInsert, DbAccountPaymentRow, DbAccountPaymentUpdate } from '@/types/database'

export type PaymentRow = DbAccountPaymentRow

export type CreatePaymentInput = {
    accountId: string
    amount: number
    paymentDate: string
}

export type CreatePaymentDbInput = DbAccountPaymentInsert

export type PaymentResult = {
    id: string
    accountId: string
    amount: number
    paymentDate: string
    createdAt: string
}

export type CreatePaymentResult = {
    payment: PaymentResult
}

export type PatchPaymentInput = {
    paymentId: string
    amount?: number
    paymentDate?: string
}

export type PatchPaymentDbInput = DbAccountPaymentUpdate

export type PatchPaymentResult =
    | {
        ok: true
        payment: PaymentResult
    }
    | {
        ok: false
        reason: 'not_found'
    }
    | {
        ok: false
        reason: 'would_exceed_remaining'
        maxAllowedAmount: number
        remainingAmount: number
        currentAmount: number
    }

export type DeletePaymentInput = {
    paymentId: string
}

export type DeletePaymentResult =
    | {
        ok: true
        paymentId: string
        accountId: string
        paymentDate: string
    }
    | {
        ok: false
        reason: 'not_found'
    }
