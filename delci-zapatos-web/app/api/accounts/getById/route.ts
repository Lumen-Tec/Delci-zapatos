import { getAccountById } from '@/repositories/accountsRepository'
import { getErrorMessage } from '@/utils/parsers/errors'

function isObjectRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null
}

function isAccountNotFoundError(error: unknown): boolean {
    return isObjectRecord(error) && error.code === 'PGRST116'
}

/**
 * GET /api/accounts/getById?id=...
 * Devuelve el detalle completo de una cuenta por id.
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

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
