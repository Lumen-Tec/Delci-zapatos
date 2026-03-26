import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import { getAccountById } from '@/repositories/accountsRepository'
import type { DbAccountPaymentInsert } from '@/types/database'
import type {
    CreatePaymentInput,
    CreatePaymentResult,
    DeletePaymentInput,
    DeletePaymentResult,
    PatchPaymentDbInput,
    PatchPaymentInput,
    PatchPaymentResult,
    PaymentResult,
    PaymentRow,
} from '@/types/paymentsRepository'

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

/**
 * Actualiza parcialmente un pago.
 * Permite corregir monto y/o fecha de pago.
 */
export async function patchPayment(data: PatchPaymentInput): Promise<PatchPaymentResult> {
    const supabase = await createSupabaseClient()

    const { data: existingPayment, error: existingPaymentError } = await supabase
        .from('account_payments')
        .select('id, account_id, amount, payment_date, created_at')
        .eq('id', data.paymentId)
        .maybeSingle()

    if (existingPaymentError) throw existingPaymentError
    if (!existingPayment) return { ok: false, reason: 'not_found' }

    if (data.amount !== undefined) {
        const account = await getAccountById(existingPayment.account_id)
        const maxAllowedAmount = existingPayment.amount + account.remainingAmount

        if (data.amount > maxAllowedAmount) {
            return {
                ok: false,
                reason: 'would_exceed_remaining',
                maxAllowedAmount,
                remainingAmount: account.remainingAmount,
                currentAmount: existingPayment.amount,
            }
        }
    }

    const update: PatchPaymentDbInput = {}
    if (data.amount !== undefined) update.amount = data.amount
    if (data.paymentDate !== undefined) update.payment_date = data.paymentDate

    const { data: updatedPayment, error: updateError } = await supabase
        .from('account_payments')
        .update(update)
        .eq('id', data.paymentId)
        .select('id, account_id, amount, payment_date, created_at')
        .maybeSingle()

    if (updateError) throw updateError
    if (!updatedPayment) return { ok: false, reason: 'not_found' }

    return {
        ok: true,
        payment: mapPaymentRowToResult(updatedPayment as PaymentRow),
    }
}

/**
 * Elimina un pago registrado.
 */
export async function deletePayment(data: DeletePaymentInput): Promise<DeletePaymentResult> {
    const supabase = await createSupabaseClient()

    const { data: targetPayment, error: targetPaymentError } = await supabase
        .from('account_payments')
        .select('id, account_id, payment_date, created_at')
        .eq('id', data.paymentId)
        .maybeSingle()

    if (targetPaymentError) throw targetPaymentError
    if (!targetPayment) return { ok: false, reason: 'not_found' }

    const { data: latestPayment, error: latestPaymentError } = await supabase
        .from('account_payments')
        .select('id, payment_date')
        .eq('account_id', targetPayment.account_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (latestPaymentError) throw latestPaymentError
    if (!latestPayment) return { ok: false, reason: 'not_found' }

    if (latestPayment.id !== targetPayment.id) {
        return {
            ok: false,
            reason: 'only_latest_payment_can_be_deleted',
            latestPaymentId: latestPayment.id,
            latestPaymentDate: latestPayment.payment_date,
        }
    }

    const { data: deletedPayment, error } = await supabase
        .from('account_payments')
        .delete()
        .eq('id', data.paymentId)
        .select('id, account_id, payment_date')
        .maybeSingle()

    if (error) throw error
    if (!deletedPayment) return { ok: false, reason: 'not_found' }

    return {
        ok: true,
        paymentId: deletedPayment.id,
        accountId: deletedPayment.account_id,
        paymentDate: deletedPayment.payment_date,
    }
}

/**
 * Obtiene el ultimo pago registrado de una cuenta por created_at desc.
 */
export async function getLatestPaymentByAccountId(accountId: string): Promise<PaymentResult | null> {
    const supabase = await createSupabaseClient()

    const { data, error } = await supabase
        .from('account_payments')
        .select('id, account_id, amount, payment_date, created_at')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (error) throw error
    if (!data) return null

    return mapPaymentRowToResult(data as PaymentRow)
}
