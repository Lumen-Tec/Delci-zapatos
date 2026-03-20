
import { createClient, getClients } from '@/repositories/clientsRepository'
import { getErrorMessage } from '@/utils/parsers/errors'

type CreateClientRequestBody = {
	fullName: string
	phone: string
	address: string
}

/**
 * GET /api/clients
 * Devuelve el listado completo de clientes.
 */
export async function GET() {
	try {
		const clients = await getClients()
		return Response.json({ ok: true, count: clients.length, clients })
	} catch (error: unknown) {
		return Response.json({ ok: false, error: getErrorMessage(error) }, { status: 500 })
	}
}

/**
 * POST /api/clients
 * Crea un cliente nuevo.
 */
export async function POST(request: Request) {
	try {
		const body = await request.json() as CreateClientRequestBody

		if (!body.fullName || !body.phone || !body.address) {
			return Response.json(
				{ ok: false, error: 'fullName, phone y address son requeridos' },
				{ status: 400 },
			)
		}

		const created = await createClient({
			fullName: body.fullName,
			phone: body.phone,
			address: body.address,
		})

		return Response.json({ ok: true, created }, { status: 201 })
	} catch (error: unknown) {
		return Response.json({ ok: false, error: getErrorMessage(error) }, { status: 500 })
	}
}
