import { getClientById } from '@/repositories/clientsRepository'
import { getErrorMessage } from '@/utils/parsers/errors'

type RouteContext = {
    params: Promise<{ id: string }>
}

/**
 * GET /api/clients/[id]
 * Devuelve el detalle de un cliente específico.
 */
export async function GET(_request: Request, context: RouteContext) {
    try {
        const { id } = await context.params

        if (!id) {
            return Response.json({ ok: false, error: 'id es requerido' }, { status: 400 })
        }

        const client = await getClientById(id)
        return Response.json({ ok: true, client })
    } catch (error: unknown) {
        return Response.json({ ok: false, error: getErrorMessage(error) }, { status: 500 })
    }
}
