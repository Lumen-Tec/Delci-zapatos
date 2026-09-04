import { getAccountById } from '@/repositories/accountsRepository'
import { createCharge, deleteCharge, getChargesPageByAccountId, patchCharge } from '@/repositories/chargesRepository'
import { todayISO } from '@/utils/accountUtils'
import { getErrorMessage } from '@/utils/parsers/errors'

type CreateChargeRequestBody = { accountId: string; description: string; amount: number; chargeDate?: string }
type PatchChargeRequestBody = { chargeId: string; description?: string; amount?: number; chargeDate?: string }

function isObjectRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null
}

function isValidISODate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
    const [year, month, day] = value.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

/** GET /api/charges?accountId=...&page=1&pageSize=10 */
export async function GET(request: Request) {
    try {
        const searchParams = new URL(request.url).searchParams
        const accountId = searchParams.get('accountId')?.trim()
        if (!accountId) return Response.json({ ok: false, error: 'accountId es requerido' }, { status: 400 })

        const page = getPositiveInt(searchParams.get('page'), 1)
        const pageSize = Math.min(getPositiveInt(searchParams.get('pageSize'), 10), 100)
        const result = await getChargesPageByAccountId(accountId, page, pageSize)
        return Response.json({ ok: true, charges: result.charges, total: result.total, page, pageSize, totalPages: Math.ceil(result.total / pageSize) })
    } catch (error: unknown) {
        return Response.json({ ok: false, error: getErrorMessage(error) }, { status: 500 })
    }
}

function getPositiveInt(value: string | null, fallback: number): number {
    const parsed = Number(value)
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback
}

/** POST /api/charges */
export async function POST(request: Request) {
    try {
        const rawBody: unknown = await request.json()
        if (!isObjectRecord(rawBody)) return Response.json({ ok: false, error: 'Body invalido' }, { status: 400 })
        const body = rawBody as CreateChargeRequestBody
        const chargeDate = body.chargeDate ?? todayISO()

        if (typeof body.accountId !== 'string' || !body.accountId.trim()) {
            return Response.json({ ok: false, error: 'accountId es requerido' }, { status: 400 })
        }
        if (typeof body.description !== 'string' || !body.description.trim()) {
            return Response.json({ ok: false, error: 'description es requerido' }, { status: 400 })
        }
        if (typeof body.amount !== 'number' || !Number.isFinite(body.amount) || body.amount <= 0) {
            return Response.json({ ok: false, error: 'amount debe ser un numero mayor a 0' }, { status: 400 })
        }
        if (typeof chargeDate !== 'string' || !isValidISODate(chargeDate)) {
            return Response.json({ ok: false, error: 'chargeDate debe tener formato YYYY-MM-DD' }, { status: 400 })
        }

        const created = await createCharge({ accountId: body.accountId.trim(), description: body.description.trim(), amount: body.amount, chargeDate })
        if (!created) return Response.json({ ok: false, error: 'Cuenta no encontrada' }, { status: 404 })

        const account = await getAccountById(created.charge.accountId)
        return Response.json({ ok: true, created, account }, { status: 201 })
    } catch (error: unknown) {
        return Response.json({ ok: false, error: getErrorMessage(error) }, { status: 500 })
    }
}

/** PATCH /api/charges */
export async function PATCH(request: Request) {
    try {
        const rawBody: unknown = await request.json()
        if (!isObjectRecord(rawBody)) return Response.json({ ok: false, error: 'Body invalido' }, { status: 400 })
        const body = rawBody as PatchChargeRequestBody
        const hasDescription = Object.prototype.hasOwnProperty.call(rawBody, 'description')
        const hasAmount = Object.prototype.hasOwnProperty.call(rawBody, 'amount')
        const hasChargeDate = Object.prototype.hasOwnProperty.call(rawBody, 'chargeDate')

        if (typeof body.chargeId !== 'string' || !body.chargeId.trim()) {
            return Response.json({ ok: false, error: 'chargeId es requerido' }, { status: 400 })
        }
        if (!hasDescription && !hasAmount && !hasChargeDate) {
            return Response.json({ ok: false, error: 'Debe enviar description, amount o chargeDate para actualizar' }, { status: 400 })
        }
        if (hasDescription && (typeof body.description !== 'string' || !body.description.trim())) {
            return Response.json({ ok: false, error: 'description debe ser un texto no vacio' }, { status: 400 })
        }
        if (hasAmount && (typeof body.amount !== 'number' || !Number.isFinite(body.amount) || body.amount <= 0)) {
            return Response.json({ ok: false, error: 'amount debe ser un numero mayor a 0' }, { status: 400 })
        }
        if (hasChargeDate && (typeof body.chargeDate !== 'string' || !isValidISODate(body.chargeDate))) {
            return Response.json({ ok: false, error: 'chargeDate debe tener formato YYYY-MM-DD' }, { status: 400 })
        }

        const updated = await patchCharge({
            chargeId: body.chargeId.trim(),
            ...(hasDescription ? { description: body.description!.trim() } : {}),
            ...(hasAmount ? { amount: body.amount } : {}),
            ...(hasChargeDate ? { chargeDate: body.chargeDate } : {}),
        })
        if (!updated.ok) return Response.json({ ok: false, error: 'Cargo no encontrado' }, { status: 404 })

        const account = await getAccountById(updated.charge.accountId)
        return Response.json({ ok: true, updated: updated.charge, account })
    } catch (error: unknown) {
        return Response.json({ ok: false, error: getErrorMessage(error) }, { status: 500 })
    }
}

/** DELETE /api/charges?chargeId=... */
export async function DELETE(request: Request) {
    try {
        const chargeId = new URL(request.url).searchParams.get('chargeId')?.trim()
        if (!chargeId) return Response.json({ ok: false, error: 'chargeId es requerido' }, { status: 400 })

        const deleted = await deleteCharge({ chargeId })
        if (!deleted.ok) return Response.json({ ok: false, error: 'Cargo no encontrado' }, { status: 404 })

        const account = await getAccountById(deleted.accountId)
        return Response.json({ ok: true, deleted, account })
    } catch (error: unknown) {
        return Response.json({ ok: false, error: getErrorMessage(error) }, { status: 500 })
    }
}
