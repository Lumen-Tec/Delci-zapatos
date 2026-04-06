
import { createClient, getClientByPhone, getClients, updateClientById } from '@/repositories/clientsRepository'
import { getErrorMessage } from '@/utils/parsers/errors'
import { normalizePhoneForStorage, validateAddress, validateClient, validateFullName, validatePhone } from '@/utils/clientUtils'

type CreateClientRequestBody = {
	fullName: string
	phone: string
	address?: string
}

type UpdateClientRequestBody = {
	id: string
	fullName?: string
	phone?: string
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
		const normalizedPhone = normalizePhoneForStorage(body.phone)

		// Validar datos del cliente usando las utilidades de validación
		const validation = validateClient({
			...body,
			phone: normalizedPhone || body.phone,
		})
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

		const existingClient = await getClientByPhone(normalizedPhone)
		if (existingClient) {
			return Response.json(
				{
					ok: false,
					error: 'Ya existe un cliente con este telefono',
					code: 'duplicate_phone',
					clientId: existingClient.id,
				},
				{ status: 409 },
			)
		}

		const created = await createClient({
			fullName: body.fullName,
			phone: normalizedPhone,
			address: body.address || '', // Address is optional
		})

		return Response.json({ ok: true, created }, { status: 201 })
	} catch (error: unknown) {
		return Response.json({ ok: false, error: getErrorMessage(error) }, { status: 500 })
	}
}

/**
 * PATCH /api/clients
 * Actualiza un cliente por id usando body-id.
 */
export async function PATCH(request: Request) {
	try {
		const body = await request.json() as UpdateClientRequestBody

		if (!body.id) {
			return Response.json({ ok: false, error: 'id es requerido' }, { status: 400 })
		}

		const hasFullName = Object.prototype.hasOwnProperty.call(body, 'fullName')
		const hasPhone = Object.prototype.hasOwnProperty.call(body, 'phone')
		const hasAddress = Object.prototype.hasOwnProperty.call(body, 'address')
		const normalizedPhone = hasPhone && typeof body.phone === 'string'
			? normalizePhoneForStorage(body.phone)
			: undefined

		if (!hasFullName && !hasPhone && !hasAddress) {
			return Response.json(
				{ ok: false, error: 'Debe enviar al menos un campo para actualizar' },
				{ status: 400 },
			)
		}

		const fieldErrors: Array<{ field: string; message: string }> = []
		if (hasFullName) {
			if (typeof body.fullName !== 'string') {
				fieldErrors.push({ field: 'fullName', message: 'fullName debe ser string' })
			} else {
				const error = validateFullName(body.fullName)
				if (error) fieldErrors.push(error)
			}
		}
		if (hasPhone) {
			if (typeof body.phone !== 'string') {
				fieldErrors.push({ field: 'phone', message: 'phone debe ser string' })
			} else {
				const error = validatePhone(normalizedPhone || body.phone)
				if (error) fieldErrors.push(error)
			}
		}
		if (hasAddress) {
			if (typeof body.address !== 'string') {
				fieldErrors.push({ field: 'address', message: 'address debe ser string' })
			} else {
				const error = validateAddress(body.address)
				if (error) fieldErrors.push(error)
			}
		}

		if (fieldErrors.length > 0) {
			return Response.json(
				{ ok: false, error: 'Datos de cliente inválidos', errors: fieldErrors },
				{ status: 400 },
			)
		}

		if (hasPhone && normalizedPhone) {
			const existingClient = await getClientByPhone(normalizedPhone)
			if (existingClient && existingClient.id !== body.id) {
				return Response.json(
					{
						ok: false,
						error: 'Ya existe un cliente con este telefono',
						code: 'duplicate_phone',
						clientId: existingClient.id,
					},
					{ status: 409 },
				)
			}
		}

		const updated = await updateClientById({
			id: body.id,
			...(hasFullName ? { fullName: body.fullName } : {}),
			...(hasPhone && normalizedPhone ? { phone: normalizedPhone } : {}),
			...(hasAddress ? { address: body.address } : {}),
		})

		if (!updated.ok && updated.reason === 'not_found') {
			return Response.json({ ok: false, error: 'Cliente no encontrado' }, { status: 404 })
		}

		if (!updated.ok) {
			return Response.json({ ok: false, error: 'No se pudo actualizar el cliente' }, { status: 500 })
		}

		return Response.json({ ok: true, updated: updated.client })
	} catch (error: unknown) {
		return Response.json({ ok: false, error: getErrorMessage(error) }, { status: 500 })
	}
}
