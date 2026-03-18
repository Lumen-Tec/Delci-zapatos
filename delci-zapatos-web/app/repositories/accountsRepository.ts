import { createClient } from '@/app/lib/supabase/server'
import type { DbAccountInsert, DbAccountStatus } from '@/app/types/database'
import { STATUS_DB_TO_FRONTEND } from '@/app/types/database'

export async function createAccount(data: {
    clientId: string
    initialBalance: number
    quincenalAmount: number
    detail?: string
    nextPaymentDate: string
}) {
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

export async function getAccounts() {
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

    return (data ?? []).map((row: any) => {
        const itemsTotal = (row.account_items ?? []).reduce(
            (sum: number, i: any) => sum + i.quantity * i.unit_price, 0
        )
        const totalAmount = row.initial_balance + itemsTotal
        const totalPaid = (row.account_payments ?? []).reduce(
            (sum: number, p: any) => sum + p.amount, 0
        )
        const totalProducts = (row.account_items ?? []).reduce(
            (sum: number, i: any) => sum + i.quantity, 0
        )

        return {
            id: row.id,
            clientId: row.client_id,
            clientName: row.clients?.full_name ?? 'Cliente',
            createdAt: row.created_at,
            totalAmount,
            totalPaid,
            remainingAmount: totalAmount - totalPaid,
            totalProducts,
            status: STATUS_DB_TO_FRONTEND[row.status as DbAccountStatus] ?? 'active',
            nextPaymentDate: row.next_payment_date,
            biweeklyAmount: row.quincenal_amount,
        }
    })
}

export async function getAccountById(id: string) {
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

    const itemsTotal = (data.account_items ?? []).reduce(
        (sum: number, i: any) => sum + i.quantity * i.unit_price, 0
    )
    const totalAmount = data.initial_balance + itemsTotal
    const totalPaid = (data.account_payments ?? []).reduce(
        (sum: number, p: any) => sum + p.amount, 0
    )
    const totalProducts = (data.account_items ?? []).reduce(
        (sum: number, i: any) => sum + i.quantity, 0
    )

    const payments = (data.account_payments ?? []).map((p: any) => ({
        id: p.id,
        date: p.payment_date,
        amount: p.amount,
    }))

    const lastPayment = payments.length > 0
        ? payments.sort((a: any, b: any) => b.date.localeCompare(a.date))[0].date
        : undefined

    const items = (data.account_items ?? []).map((i: any) => ({
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
        id: data.id,
        clientId: data.client_id,
        clientName: data.clients?.full_name ?? 'Cliente',
        createdAt: data.created_at,
        totalAmount,
        totalPaid,
        remainingAmount: totalAmount - totalPaid,
        totalProducts,
        status: STATUS_MAP[data.status as keyof typeof STATUS_MAP] ?? 'active',
        nextPaymentDate: data.next_payment_date,
        biweeklyAmount: data.quincenal_amount,
        detail: data.detail,
        lastPaymentDate: lastPayment,
        items,
        payments,
    }
}
