import { createAccount, getAccountById, getAccounts, patchAccountById } from '@/repositories/accountsRepository'
import type { FrontendAccountStatus } from '@/types/database'
import { getNearestUpcomingPaymentDate, todayISO } from '@/utils/accountUtils'
import { getErrorMessage } from '@/utils/parsers/errors'

type CreateAccountRequestBody = {
    clientId: string
    initialBalance?: number
    quincenalAmount: number
    detail?: string
}

type PatchAccountRequestBody = {
    id: string
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
        const rawBody: unknown = await request.json()

        if (!isObjectRecord(rawBody)) {
            return Response.json({ ok: false, error: 'Body invalido' }, { status: 400 })
        }

        const body = rawBody as CreateAccountRequestBody

        const validationError = validateCreateAccountBody(body)
        if (validationError) {
            return Response.json({ ok: false, error: validationError }, { status: 400 })
        }

        const account = await createAccount({
            clientId: body.clientId.trim(),
            initialBalance: body.initialBalance ?? 0,
            quincenalAmount: body.quincenalAmount,
            detail: body.detail?.trim() || undefined,
            nextPaymentDate: getNearestUpcomingPaymentDate(todayISO()),
        })
        return Response.json({ ok: true, created: account }, { status: 201 })
    } catch (error: unknown) {
        return Response.json({ ok: false, error: getErrorMessage(error) }, { status: 500 })
    }
}

function validateCreateAccountBody(body: CreateAccountRequestBody): string | null {
    if (typeof body.clientId !== 'string' || !body.clientId.trim()) {
        return 'clientId es requerido'
    }
    if (typeof body.quincenalAmount !== 'number' || body.quincenalAmount <= 0) {
        return 'quincenalAmount debe ser un numero mayor a 0'
    }
    if (body.initialBalance !== undefined && (typeof body.initialBalance !== 'number' || body.initialBalance < 0)) {
        return 'initialBalance debe ser un numero mayor o igual a 0'
    }
    if (body.detail !== undefined && typeof body.detail !== 'string') {
        return 'detail debe ser string'
    }
    return null
}

/**
 * PATCH /api/accounts
 * Actualiza parcialmente una cuenta usando id en body.
 */
export async function PATCH(request: Request) {
    try {
        const rawBody: unknown = await request.json()

        if (!isObjectRecord(rawBody)) {
            return Response.json({ ok: false, error: 'Body invalido' }, { status: 400 })
        }

        const validationError = validatePatchAccountBody(rawBody)
        if (validationError) {
            return Response.json({ ok: false, error: validationError }, { status: 400 })
        }

        const hasInitialBalance = Object.prototype.hasOwnProperty.call(rawBody, 'initialBalance')
        const hasQuincenalAmount = Object.prototype.hasOwnProperty.call(rawBody, 'quincenalAmount')
        const hasDetail = Object.prototype.hasOwnProperty.call(rawBody, 'detail')
        const hasStatus = Object.prototype.hasOwnProperty.call(rawBody, 'status')

        const body = rawBody as PatchAccountRequestBody

        const updated = await patchAccountById(body.id, {
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

        const account = await getAccountById(body.id)
        return Response.json({ ok: true, account })
    } catch (error: unknown) {
        if (isAccountNotFoundError(error)) {
            return Response.json({ ok: false, error: 'Cuenta no encontrada' }, { status: 404 })
        }
        return Response.json({ ok: false, error: getErrorMessage(error) }, { status: 500 })
    }
}

function validatePatchAccountBody(rawBody: Record<string, unknown>): string | null {
    const hasId = Object.prototype.hasOwnProperty.call(rawBody, 'id')
    const hasInitialBalance = Object.prototype.hasOwnProperty.call(rawBody, 'initialBalance')
    const hasQuincenalAmount = Object.prototype.hasOwnProperty.call(rawBody, 'quincenalAmount')
    const hasDetail = Object.prototype.hasOwnProperty.call(rawBody, 'detail')
    const hasStatus = Object.prototype.hasOwnProperty.call(rawBody, 'status')

    if (!hasId || typeof rawBody.id !== 'string' || !rawBody.id) {
        return 'id es requerido'
    }

    if (!hasInitialBalance && !hasQuincenalAmount && !hasDetail && !hasStatus) {
        return 'Debe enviar al menos un campo para actualizar'
    }

    if (hasInitialBalance && (typeof rawBody.initialBalance !== 'number' || rawBody.initialBalance < 0)) {
        return 'initialBalance debe ser un numero mayor o igual a 0'
    }

    if (hasQuincenalAmount && (typeof rawBody.quincenalAmount !== 'number' || rawBody.quincenalAmount < 0)) {
        return 'quincenalAmount debe ser un numero mayor o igual a 0'
    }

    if (hasDetail && rawBody.detail !== null && typeof rawBody.detail !== 'string') {
        return 'detail debe ser string o null'
    }

    if (hasStatus && (typeof rawBody.status !== 'string' || !VALID_STATUS.includes(rawBody.status as FrontendAccountStatus))) {
        return 'status debe ser activa, pagada o atrasada'
    }

    return null
}
