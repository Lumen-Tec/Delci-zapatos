import type { DbClientInsert, DbClientRow } from '@/types/database'

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
