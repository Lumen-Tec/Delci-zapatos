import { getAccountById } from '@/repositories/accountsRepository'

type RouteContext = {
    params: Promise<{ id: string }>
}
// TODO: Refactorizar en /utils para evitar duplicación con test-db y más
function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Error interno del servidor'
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
        return Response.json({ ok: false, error: getErrorMessage(error) }, { status: 500 })
    }
}
