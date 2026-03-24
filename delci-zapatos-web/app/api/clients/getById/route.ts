import { getClientById } from '@/repositories/clientsRepository'
import { getErrorMessage } from '@/utils/parsers/errors'

function isObjectRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null
}

function isClientNotFoundError(error: unknown): boolean {
	return isObjectRecord(error) && error.code === 'PGRST116'
}

/**
 * GET /api/clients/getById?id=...
 * Devuelve el detalle de un cliente por id.
 */
export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url)
		const id = searchParams.get('id')

		if (!id) {
			return Response.json({ ok: false, error: 'id es requerido' }, { status: 400 })
		}

		const client = await getClientById(id)
		return Response.json({ ok: true, client })
	} catch (error: unknown) {
		if (isClientNotFoundError(error)) {
			return Response.json({ ok: false, error: 'Cliente no encontrado' }, { status: 404 })
		}
		return Response.json({ ok: false, error: getErrorMessage(error) }, { status: 500 })
	}
}
