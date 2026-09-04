import { createPayment, deletePayment, getPaymentsPageByAccountId, patchPayment } from '@/repositories/paymentsRepository'
import { getAccountById } from '@/repositories/accountsRepository'
import { getErrorMessage } from '@/utils/parsers/errors'

type CreatePaymentRequestBody = {
    accountId: string
    amount: number
    paymentDate: string
}

type PatchPaymentRequestBody = {
    paymentId: string
    amount?: number
    paymentDate?: string
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null
}

function isAccountNotFoundError(error: unknown): boolean {
    return isObjectRecord(error) && error.code === 'PGRST116'
}

function isValidISODate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
    const date = new Date(`${value}T00:00:00`)
    return !Number.isNaN(date.getTime())
}

/** GET /api/payments?accountId=...&page=1&pageSize=10 */
export async function GET(request: Request) {
    try {
        const searchParams = new URL(request.url).searchParams
        const accountId = searchParams.get('accountId')?.trim()
        if (!accountId) return Response.json({ ok: false, error: 'accountId es requerido' }, { status: 400 })

        const page = getPositiveInt(searchParams.get('page'), 1)
        const pageSize = Math.min(getPositiveInt(searchParams.get('pageSize'), 10), 100)
        const result = await getPaymentsPageByAccountId(accountId, page, pageSize)
        return Response.json({ ok: true, payments: result.payments, total: result.total, page, pageSize, totalPages: Math.ceil(result.total / pageSize) })
    } catch (error: unknown) {
        return Response.json({ ok: false, error: getErrorMessage(error) }, { status: 500 })
    }
}

function getPositiveInt(value: string | null, fallback: number): number {
    const parsed = Number(value)
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback
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

        const reconciledAccount = await getAccountById(body.accountId)

        return Response.json({ ok: true, created, account: reconciledAccount }, { status: 201 })
    } catch (error: unknown) {
        if (isAccountNotFoundError(error)) {
            return Response.json({ ok: false, error: 'Cuenta no encontrada' }, { status: 404 })
        }
        return Response.json({ ok: false, error: getErrorMessage(error) }, { status: 500 })
    }
}

/**
 * PATCH /api/payments
 * Corrige monto y/o fecha de un pago existente.
 */
export async function PATCH(request: Request) {
    try {
        const body = await request.json() as PatchPaymentRequestBody

        if (!body.paymentId) {
            return Response.json(
                { ok: false, error: 'paymentId es requerido' },
                { status: 400 },
            )
        }

        const hasAmount = Object.prototype.hasOwnProperty.call(body, 'amount')
        const hasPaymentDate = Object.prototype.hasOwnProperty.call(body, 'paymentDate')

        if (!hasAmount && !hasPaymentDate) {
            return Response.json(
                { ok: false, error: 'Debe enviar amount o paymentDate para actualizar' },
                { status: 400 },
            )
        }

        if (hasAmount && (typeof body.amount !== 'number' || body.amount <= 0)) {
            return Response.json(
                { ok: false, error: 'amount debe ser un numero mayor a 0' },
                { status: 400 },
            )
        }

        if (hasPaymentDate && (typeof body.paymentDate !== 'string' || !isValidISODate(body.paymentDate))) {
            return Response.json(
                { ok: false, error: 'paymentDate debe tener formato YYYY-MM-DD' },
                { status: 400 },
            )
        }

        const updated = await patchPayment({
            paymentId: body.paymentId,
            ...(hasAmount ? { amount: body.amount } : {}),
            ...(hasPaymentDate ? { paymentDate: body.paymentDate } : {}),
        })

        if (!updated.ok && updated.reason === 'not_found') {
            return Response.json({ ok: false, error: 'Pago no encontrado' }, { status: 404 })
        }

        if (!updated.ok && updated.reason === 'would_exceed_remaining') {
            return Response.json(
                {
                    ok: false,
                    error: 'El monto corregido excede el saldo pendiente de la cuenta',
                    maxAllowedAmount: updated.maxAllowedAmount,
                    remainingAmount: updated.remainingAmount,
                    currentAmount: updated.currentAmount,
                },
                { status: 409 },
            )
        }

        const reconciledAccount = await getAccountById(updated.payment.accountId)

        return Response.json({ ok: true, updated: updated.payment, account: reconciledAccount })
    } catch (error: unknown) {
        if (isAccountNotFoundError(error)) {
            return Response.json({ ok: false, error: 'Cuenta no encontrada' }, { status: 404 })
        }
        return Response.json({ ok: false, error: getErrorMessage(error) }, { status: 500 })
    }
}

/**
 * DELETE /api/payments?paymentId=...
 * Elimina un pago registrado.
 */
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const paymentId = searchParams.get('paymentId')

        if (!paymentId) {
            return Response.json(
                { ok: false, error: 'paymentId es requerido' },
                { status: 400 },
            )
        }

        const deleted = await deletePayment({ paymentId })

        if (!deleted.ok && deleted.reason === 'not_found') {
            return Response.json({ ok: false, error: 'Pago no encontrado' }, { status: 404 })
        }

        if (!deleted.ok && deleted.reason === 'only_latest_payment_can_be_deleted') {
            return Response.json(
                {
                    ok: false,
                    error: 'Solo se puede eliminar el ultimo pago registrado para mantener la fecha de pago correcta',
                    latestPaymentId: deleted.latestPaymentId,
                    latestPaymentDate: deleted.latestPaymentDate,
                },
                { status: 409 },
            )
        }

        const reconciledAccount = await getAccountById(deleted.accountId)

        return Response.json({ ok: true, deleted, account: reconciledAccount })
    } catch (error: unknown) {
        if (isAccountNotFoundError(error)) {
            return Response.json({ ok: false, error: 'Cuenta no encontrada' }, { status: 404 })
        }
        return Response.json({ ok: false, error: getErrorMessage(error) }, { status: 500 })
    }
}
