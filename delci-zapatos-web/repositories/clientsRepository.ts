import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import type { ClientDetailsResult, ClientListResult, ClientRow, CreateClientDbInput, CreateClientInput, CreateClientResult } from '@/types/clientsRepository'

function mapClientRowToResult(row: ClientRow): ClientListResult {
	return {
		id: row.id,
		fullName: row.full_name,
		phone: row.phone,
		address: row.address,
		createdAt: row.created_at,
	}
}

/**
 * Obtiene todos los clientes ordenados por fecha de creación descendente.
 */
export async function getClients(): Promise<ClientListResult[]> {
	const supabase = await createSupabaseClient()

	const { data, error } = await supabase
		.from('clients')
		.select('id, full_name, phone, address, created_at')
		.order('created_at', { ascending: false })

	if (error) throw error

	const rows = (data ?? []) as ClientRow[]
	return rows.map(mapClientRowToResult)
}

/**
 * Obtiene un cliente por id.
 */
export async function getClientById(id: string): Promise<ClientDetailsResult> {
	const supabase = await createSupabaseClient()

	const { data, error } = await supabase
		.from('clients')
		.select('id, full_name, phone, address, created_at')
		.eq('id', id)
		.single()

	if (error) throw error

	return mapClientRowToResult(data as ClientRow)
}

/**
 * Crea un nuevo cliente.
 */
export async function createClient(data: CreateClientInput): Promise<CreateClientResult> {
	const supabase = await createSupabaseClient()

	const insert: CreateClientDbInput = {
		full_name: data.fullName,
		phone: data.phone,
		address: data.address,
	}

	const { data: client, error } = await supabase
		.from('clients')
		.insert(insert)
		.select('id')
		.single()

	if (error) throw error

	return { id: client.id }
}