import { getAccounts, createAccount } from '@/app/repositories/accountsRepository'
import { getNearestUpcomingPaymentDate, todayISO } from '@/app/lib/accountUtils'

export async function GET() {
    try {
        const accounts = await getAccounts()
        return Response.json({ ok: true, count: accounts.length, accounts })
    } catch (error: any) {
        return Response.json({ ok: false, error: error.message }, { status: 500 })
    }
}

// POST para probar creación:
// curl -X POST http://localhost:3000/api/test-db -H "Content-Type: application/json" -d '{"clientId":"uuid-aqui","initialBalance":15000,"quincenalAmount":5000}'
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
