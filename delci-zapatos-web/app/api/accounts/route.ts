import { getAccounts, createAccount } from '@/app/repositories/accountsRepository'
import { getNearestUpcomingPaymentDate, todayISO } from '@/app/lib/accountUtils'

// GET para obtener cuentas (con info de cliente, items y pagos)
// No posee filstrados, es para usar en el dashboard admin, donde se muestran todas las cuentas.
export async function GET() {
    try {
        const accounts = await getAccounts()
        return Response.json({ ok: true, count: accounts.length, accounts })
    } catch (error: any) {
        return Response.json({ ok: false, error: error.message }, { status: 500 })
    }
}

// POST para creación:
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const account = await createAccount({
            clientId: body.clientId,
            initialBalance: body.initialBalance ?? 0,
            quincenalAmount: body.quincenalAmount,
            detail: body.detail,
            nextPaymentDate: getNearestUpcomingPaymentDate(todayISO()),
        })
        return Response.json({ ok: true, created: account })
    } catch (error: any) {
        return Response.json({ ok: false, error: error.message }, { status: 500 })
    }
}
