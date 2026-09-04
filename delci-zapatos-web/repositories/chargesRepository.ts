import { reconcileAccount } from '@/repositories/accountsRepository'
import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import type {
    ChargeResult,
    ChargeRow,
    CreateChargeDbInput,
    CreateChargeInput,
    CreateChargeResult,
    DeleteChargeInput,
    DeleteChargeResult,
    PatchChargeDbInput,
    PatchChargeInput,
    PatchChargeResult,
    PaginatedChargesResult,
} from '@/types/chargesRepository'

const CHARGE_FIELDS = 'id, account_id, description, amount, charge_date, created_at'

function mapChargeRowToResult(row: ChargeRow): ChargeResult {
    return {
        id: row.id,
        accountId: row.account_id,
        description: row.description,
        amount: row.amount,
        chargeDate: row.charge_date,
        createdAt: row.created_at,
    }
}

/** Registra un cargo para una cuenta existente. */
export async function createCharge(data: CreateChargeInput): Promise<CreateChargeResult | null> {
    const supabase = await createSupabaseClient()
    const { data: account, error: accountError } = await supabase.from('accounts').select('id').eq('id', data.accountId).maybeSingle()
    if (accountError) throw accountError
    if (!account) return null

    const insert: CreateChargeDbInput = {
        account_id: data.accountId,
        description: data.description,
        amount: data.amount,
        charge_date: data.chargeDate,
    }
    const { data: charge, error } = await supabase.from('account_charges').insert(insert).select(CHARGE_FIELDS).single()
    if (error) throw error

    await reconcileAccount(data.accountId)
    return { charge: mapChargeRowToResult(charge as ChargeRow) }
}

/** Actualiza parcialmente la descripción, monto o fecha de un cargo. */
export async function patchCharge(data: PatchChargeInput): Promise<PatchChargeResult> {
    const supabase = await createSupabaseClient()
    const { data: existing, error: existingError } = await supabase.from('account_charges').select(CHARGE_FIELDS).eq('id', data.chargeId).maybeSingle()
    if (existingError) throw existingError
    if (!existing) return { ok: false, reason: 'not_found' }

    const update: PatchChargeDbInput = {}
    if (data.description !== undefined) update.description = data.description
    if (data.amount !== undefined) update.amount = data.amount
    if (data.chargeDate !== undefined) update.charge_date = data.chargeDate

    const { data: charge, error } = await supabase.from('account_charges').update(update).eq('id', data.chargeId).select(CHARGE_FIELDS).maybeSingle()
    if (error) throw error
    if (!charge) return { ok: false, reason: 'not_found' }

    await reconcileAccount(existing.account_id)
    return { ok: true, charge: mapChargeRowToResult(charge as ChargeRow) }
}

/** Elimina un cargo sin restricciones de orden. */
export async function deleteCharge(data: DeleteChargeInput): Promise<DeleteChargeResult> {
    const supabase = await createSupabaseClient()
    const { data: charge, error } = await supabase.from('account_charges').delete().eq('id', data.chargeId).select('id, account_id').maybeSingle()
    if (error) throw error
    if (!charge) return { ok: false, reason: 'not_found' }

    await reconcileAccount(charge.account_id)
    return { ok: true, chargeId: charge.id, accountId: charge.account_id }
}

/** Obtiene todos los cargos, con el último registrado en la primera posición. */
export async function getChargesByAccountId(accountId: string): Promise<ChargeResult[]> {
    const result = await getChargesPageByAccountId(accountId, 1, 1_000)
    return result.charges
}

/** Obtiene una página de cargos de una cuenta y su total exacto. */
export async function getChargesPageByAccountId(accountId: string, page: number, pageSize: number): Promise<PaginatedChargesResult> {
    const supabase = await createSupabaseClient()
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    const { data, error, count } = await supabase
        .from('account_charges')
        .select(CHARGE_FIELDS, { count: 'exact' })
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })
        .range(from, to)
    if (error) throw error
    return { charges: ((data ?? []) as ChargeRow[]).map(mapChargeRowToResult), total: count ?? 0 }
}
