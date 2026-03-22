import { createPayment } from '@/repositories/paymentsRepository'
import { getAccountById } from '@/repositories/accountsRepository'
import { getErrorMessage } from '@/utils/parsers/errors'

type CreatePaymentRequestBody = {
    accountId: string
    amount: number
    paymentDate: string
}

function isValidISODate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
    const date = new Date(`${value}T00:00:00`)
    return !Number.isNaN(date.getTime())
}

/**
 * POST /api/payments
 * Registra un pago para una cuenta.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json() as CreatePaymentRequestBody

        if (!body.accountId || body.amount == null || !body.paymentDate) {
            return Response.json(
                { ok: false, error: 'accountId, amount y paymentDate son requeridos' },
                { status: 400 },
            )
        }

        if (typeof body.amount !== 'number' || body.amount <= 0) {
            return Response.json(
                { ok: false, error: 'amount debe ser un numero mayor a 0' },
                { status: 400 },
            )
        }

        if (!isValidISODate(body.paymentDate)) {
            return Response.json(
                { ok: false, error: 'paymentDate debe tener formato YYYY-MM-DD' },
                { status: 400 },
            )
        }

        const account = await getAccountById(body.accountId)

        if (body.amount > account.remainingAmount) {
            return Response.json(
                { ok: false, error: 'El monto del pago no puede ser mayor al saldo pendiente' },
                { status: 400 },
            )
        }

        const created = await createPayment({
            accountId: body.accountId,
            amount: body.amount,
            paymentDate: body.paymentDate,
        })

        if (!created) {
            return Response.json(
                { ok: false, error: 'La cuenta indicada no existe' },
                { status: 404 },
            )
        }

        return Response.json({ ok: true, created }, { status: 201 })
    } catch (error: unknown) {
        return Response.json({ ok: false, error: getErrorMessage(error) }, { status: 500 })
    }
}
