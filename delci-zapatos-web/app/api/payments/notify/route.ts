import { getAccountById } from '@/repositories/accountsRepository'
import { getClientById } from '@/repositories/clientsRepository'
import { getLatestPaymentByAccountId } from '@/repositories/paymentsRepository'
import { formatCurrency } from '@/utils/accountUtils'
import { getErrorMessage } from '@/utils/parsers/errors'

type NotifyPaymentRequestBody = {
    accountId: string
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null
}

function isAccountNotFoundError(error: unknown): boolean {
    return isObjectRecord(error) && error.code === 'PGRST116'
}

function sanitizeWhatsAppPhone(phone: string): string {
    return phone.replace(/\D/g, '')
}

/**
 * POST /api/payments/notify
 * Construye el enlace de WhatsApp con resumen del ultimo pago de la cuenta.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json() as NotifyPaymentRequestBody

        if (!body.accountId) {
            return Response.json(
                { ok: false, error: 'accountId es requerido' },
                { status: 400 },
            )
        }

        const account = await getAccountById(body.accountId)
        const latestPayment = await getLatestPaymentByAccountId(body.accountId)

        if (!latestPayment) {
            return Response.json(
                { ok: false, error: 'No hay pagos registrados para notificar' },
                { status: 409 },
            )
        }

        const client = await getClientById(account.clientId)
        const whatsappPhone = sanitizeWhatsAppPhone(client.phone)

        if (!whatsappPhone || whatsappPhone.length < 8) {
            return Response.json(
                { ok: false, error: 'El cliente no tiene un numero de WhatsApp valido' },
                { status: 400 },
            )
        }

        const newBalance = account.remainingAmount
        const previousBalance = Math.max(0, newBalance + latestPayment.amount)

        const message = [
            `Hola ${account.clientName},`,
            'Te compartimos el resumen de tu ultimo pago:',
            `Saldo anterior: ${formatCurrency(previousBalance)}`,
            `Monto del ultimo pago: ${formatCurrency(latestPayment.amount)}`,
            `Nuevo saldo: ${formatCurrency(newBalance)}`,
            'Gracias por estar al día con tus abonos.',
        ].join('\n')

        const waUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`

        return Response.json({
            ok: true,
            waUrl,
            phone: whatsappPhone,
            summary: {
                previousBalance,
                lastPaymentAmount: latestPayment.amount,
                newBalance,
            },
        })
    } catch (error: unknown) {
        if (isAccountNotFoundError(error)) {
            return Response.json({ ok: false, error: 'Cuenta o cliente no encontrado' }, { status: 404 })
        }
        return Response.json({ ok: false, error: getErrorMessage(error) }, { status: 500 })
    }
}
