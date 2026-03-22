import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import type { DbAccountPaymentInsert } from '@/types/database'
import type { CreatePaymentInput, CreatePaymentResult, PaymentResult, PaymentRow } from '@/types/paymentsRepository'

function mapPaymentRowToResult(row: PaymentRow): PaymentResult {
    return {
        id: row.id,
        accountId: row.account_id,
        amount: row.amount,
        paymentDate: row.payment_date,
        createdAt: row.created_at,
    }
}

/**
 * Registra un pago para una cuenta existente.
 * Retorna null cuando la cuenta no existe.
 */
export async function createPayment(data: CreatePaymentInput): Promise<CreatePaymentResult | null> {
    const supabase = await createSupabaseClient()

    const { data: accountExists, error: accountError } = await supabase
        .from('accounts')
        .select('id')
        .eq('id', data.accountId)
        .maybeSingle()

    if (accountError) throw accountError
    if (!accountExists) return null

    const insert: DbAccountPaymentInsert = {
        account_id: data.accountId,
        amount: data.amount,
        payment_date: data.paymentDate,
    }

    const { data: payment, error } = await supabase
        .from('account_payments')
        .insert(insert)
        .select('id, account_id, amount, payment_date, created_at')
        .single()

    if (error) throw error

    return { payment: mapPaymentRowToResult(payment as PaymentRow) }
}
