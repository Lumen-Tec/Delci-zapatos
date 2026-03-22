import type { DbAccountPaymentInsert, DbAccountPaymentRow } from '@/types/database'

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
