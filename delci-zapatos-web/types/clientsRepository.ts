import type { DbClientInsert, DbClientRow, DbClientUpdate } from '@/types/database'

export type ClientRow = DbClientRow

export type CreateClientInput = {
	fullName: string
	phone: string
	address: string
}

export type ClientListResult = {
	id: string
	fullName: string
	phone: string
	address: string
	createdAt: string
}

export type ClientDetailsResult = ClientListResult

export type CreateClientDbInput = DbClientInsert

export type CreateClientResult = {
	id: string
}

export type UpdateClientInput = {
	id: string
	fullName?: string
	phone?: string
	address?: string
}

export type UpdateClientDbInput = DbClientUpdate

export type UpdateClientResult =
	| {
		ok: true
		client: ClientDetailsResult
	}
	| {
		ok: false
		reason: 'not_found'
	}
