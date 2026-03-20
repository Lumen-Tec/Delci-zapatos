import { getAccounts, createAccount } from '@/repositories/accountsRepository'
import { getNearestUpcomingPaymentDate, todayISO } from '@/lib/accountUtils'
import { getErrorMessage } from '@/utils/parsers/errors'

type CreateAccountRequestBody = {
    clientId: string
    initialBalance?: number
    quincenalAmount: number
    detail?: string
}

/**
 * GET /api/accounts
 * Devuelve todas las cuentas con métricas agregadas para dashboard admin.
 */
export async function GET() {
    try {
        const accounts = await getAccounts()
        return Response.json({ ok: true, count: accounts.length, accounts })
    } catch (error: unknown) {
        return Response.json({ ok: false, error: getErrorMessage(error) }, { status: 500 })
    }
}

/**
 * POST /api/accounts
 * Crea una cuenta nueva. La fecha de próximo pago se calcula en backend.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json() as CreateAccountRequestBody
        const account = await createAccount({
            clientId: body.clientId,
            initialBalance: body.initialBalance ?? 0,
            quincenalAmount: body.quincenalAmount,
            detail: body.detail,
            nextPaymentDate: getNearestUpcomingPaymentDate(todayISO()),
        })
        return Response.json({ ok: true, created: account })
    } catch (error: unknown) {
        return Response.json({ ok: false, error: getErrorMessage(error) }, { status: 500 })
    }
}
