import { cookies } from 'next/headers'
import { getPaymentsPageByAccountId } from '@/repositories/paymentsRepository'
import { getErrorMessage } from '@/utils/parsers/errors'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function GET(request: Request) {
    try {
        const accountId = (await cookies()).get('delci_selected_account')?.value
        if (!accountId || !UUID_PATTERN.test(accountId)) return Response.json({ ok: false, error: 'Selecciona una cuenta desde el dashboard.' }, { status: 404 })
        const { searchParams } = new URL(request.url)
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
