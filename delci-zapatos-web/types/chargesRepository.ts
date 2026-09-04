import type { DbAccountChargeInsert, DbAccountChargeRow, DbAccountChargeUpdate } from '@/types/database'

export type ChargeRow = DbAccountChargeRow
export type ChargeResult = { id: string; accountId: string; description: string; amount: number; chargeDate: string; createdAt: string }
export type CreateChargeInput = { accountId: string; description: string; amount: number; chargeDate: string }
export type CreateChargeDbInput = DbAccountChargeInsert
export type CreateChargeResult = { charge: ChargeResult }
export type PatchChargeInput = { chargeId: string; description?: string; amount?: number; chargeDate?: string }
export type PatchChargeDbInput = DbAccountChargeUpdate
export type PatchChargeResult = { ok: true; charge: ChargeResult } | { ok: false; reason: 'not_found' }
export type DeleteChargeInput = { chargeId: string }
export type DeleteChargeResult = { ok: true; chargeId: string; accountId: string } | { ok: false; reason: 'not_found' }
export type PaginatedChargesResult = { charges: ChargeResult[]; total: number }
