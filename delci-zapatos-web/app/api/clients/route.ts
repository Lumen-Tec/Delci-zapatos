
import { createClient, getClients } from '@/repositories/clientsRepository'
import { getErrorMessage } from '@/utils/parsers/errors'
import { validateClient } from '@/lib/clientUtils'

type CreateClientRequestBody = {
	fullName: string
	phone: string
	address?: string
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

		// Validar datos del cliente usando las utilidades de validación
		const validation = validateClient(body)
		if (!validation.isValid) {
			return Response.json(
				{ 
					ok: false, 
					error: 'Datos de cliente inválidos', 
					errors: validation.errors 
				},
				{ status: 400 },
			)
		}

		const created = await createClient({
			fullName: body.fullName,
			phone: body.phone,
			address: body.address || '', // Address is optional
		})

		return Response.json({ ok: true, created }, { status: 201 })
	} catch (error: unknown) {
		return Response.json({ ok: false, error: getErrorMessage(error) }, { status: 500 })
	}
}
