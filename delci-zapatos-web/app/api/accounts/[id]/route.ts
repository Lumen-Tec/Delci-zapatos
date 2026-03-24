import { getAccountById, patchAccountById } from '@/repositories/accountsRepository'
import type { FrontendAccountStatus } from '@/types/database'
import { getErrorMessage } from '@/utils/parsers/errors'

type RouteContext = {
    params: Promise<{ id: string }>
}

type PatchAccountRequestBody = {
    initialBalance?: number
    quincenalAmount?: number
    detail?: string | null
    status?: FrontendAccountStatus
}

const VALID_STATUS: FrontendAccountStatus[] = ['activa', 'pagada', 'atrasada']

function isObjectRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null
}

function isAccountNotFoundError(error: unknown): boolean {
    return isObjectRecord(error) && error.code === 'PGRST116'
}

/**
 * GET /api/accounts/[id]
 * Devuelve el detalle completo de una cuenta específica.
 */
export async function GET(_request: Request, context: RouteContext) {
    try {
        const { id } = await context.params

        if (!id) {
            return Response.json({ ok: false, error: 'id es requerido' }, { status: 400 })
        }

        const account = await getAccountById(id)
        return Response.json({ ok: true, account })
    } catch (error: unknown) {
        if (isAccountNotFoundError(error)) {
            return Response.json({ ok: false, error: 'Cuenta no encontrada' }, { status: 404 })
        }
        return Response.json({ ok: false, error: getErrorMessage(error) }, { status: 500 })
    }
}

/**
 * PATCH /api/accounts/[id]
 * Actualiza parcialmente una cuenta; solo modifica los campos enviados.
 */
export async function PATCH(request: Request, context: RouteContext) {
    try {
        const { id } = await context.params

        if (!id) {
            return Response.json({ ok: false, error: 'id es requerido' }, { status: 400 })
        }

        const rawBody: unknown = await request.json()

        if (!isObjectRecord(rawBody)) {
            return Response.json({ ok: false, error: 'Body invalido' }, { status: 400 })
        }

        const hasInitialBalance = Object.prototype.hasOwnProperty.call(rawBody, 'initialBalance')
        const hasQuincenalAmount = Object.prototype.hasOwnProperty.call(rawBody, 'quincenalAmount')
        const hasDetail = Object.prototype.hasOwnProperty.call(rawBody, 'detail')
        const hasStatus = Object.prototype.hasOwnProperty.call(rawBody, 'status')

        if (!hasInitialBalance && !hasQuincenalAmount && !hasDetail && !hasStatus) {
            return Response.json(
                { ok: false, error: 'Debe enviar al menos un campo para actualizar' },
                { status: 400 },
            )
        }

        const body = rawBody as PatchAccountRequestBody

        if (hasInitialBalance && (typeof body.initialBalance !== 'number' || body.initialBalance < 0)) {
            return Response.json(
                { ok: false, error: 'initialBalance debe ser un numero mayor o igual a 0' },
                { status: 400 },
            )
        }

        if (hasQuincenalAmount && (typeof body.quincenalAmount !== 'number' || body.quincenalAmount < 0)) {
            return Response.json(
                { ok: false, error: 'quincenalAmount debe ser un numero mayor o igual a 0' },
                { status: 400 },
            )
        }

        if (hasDetail && body.detail !== null && typeof body.detail !== 'string') {
            return Response.json(
                { ok: false, error: 'detail debe ser string o null' },
                { status: 400 },
            )
        }

        if (hasStatus && (typeof body.status !== 'string' || !VALID_STATUS.includes(body.status))) {
            return Response.json(
                { ok: false, error: 'status debe ser activa, pagada o atrasada' },
                { status: 400 },
            )
        }

        const updated = await patchAccountById(id, {
            ...(hasInitialBalance ? { initialBalance: body.initialBalance } : {}),
            ...(hasQuincenalAmount ? { quincenalAmount: body.quincenalAmount } : {}),
            ...(hasDetail ? { detail: body.detail ?? null } : {}),
            ...(hasStatus ? { status: body.status } : {}),
        })

        if (!updated.ok && updated.reason === 'not_found') {
            return Response.json({ ok: false, error: 'Cuenta no encontrada' }, { status: 404 })
        }

        if (!updated.ok && updated.reason === 'status_requires_full_payment') {
            return Response.json(
                {
                    ok: false,
                    error: 'No se puede marcar como pagada: el total de la cuenta no coincide con el total pagado',
                    totalAmount: updated.totalAmount,
                    totalPaid: updated.totalPaid,
                },
                { status: 409 },
            )
        }

        const account = await getAccountById(id)
        return Response.json({ ok: true, account })
    } catch (error: unknown) {
        if (isAccountNotFoundError(error)) {
            return Response.json({ ok: false, error: 'Cuenta no encontrada' }, { status: 404 })
        }
        return Response.json({ ok: false, error: getErrorMessage(error) }, { status: 500 })
    }
}
