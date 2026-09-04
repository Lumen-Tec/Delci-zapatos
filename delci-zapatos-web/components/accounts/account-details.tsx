'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeft, CircleAlert, Phone, UserRound } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AccountManagement } from '@/components/accounts/account-management'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { AccountStatus } from '@/types/database'

type Account = {
    id: string; clientId: string; clientName: string; clientPhone: string; clientAddress: string; detail: string | null; initialBalance: number
    remainingAmount: number; totalAmount: number; totalPaid: number; status: AccountStatus; nextPaymentDate: string | null; biweeklyAmount: number
}
type Charge = { id: string; description: string; amount: number; chargeDate: string }
type Payment = { id: string; amount: number; paymentDate: string }
type AccountResponse = { ok: boolean; account?: Account; error?: string }
type ChargesResponse = { ok: boolean; charges?: Charge[]; total?: number; totalPages?: number; error?: string }
type PaymentsResponse = { ok: boolean; payments?: Payment[]; total?: number; totalPages?: number; error?: string }

const MOVEMENTS_PAGE_SIZE = 5
const statusLabel: Record<AccountStatus, string> = { activa: 'Activa', pagada: 'Pagada', atrasada: 'Atrasada' }
const statusVariant: Record<AccountStatus, 'success' | 'neutral' | 'warning'> = { activa: 'success', pagada: 'neutral', atrasada: 'warning' }

function formatMoney(value: number): string {
    return new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(value)
}

function formatPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '').replace(/^506/, '').slice(0, 8)
    return digits.length === 8 ? `+506 ${digits.slice(0, 4)}-${digits.slice(4)}` : phone
}

function formatDate(date: string | null): string {
    if (!date) return 'Sin pago pendiente'
    return new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium' }).format(new Date(`${date}T00:00:00`))
}

export function AccountDetails() {
    const [account, setAccount] = useState<Account | null>(null)
    const [charges, setCharges] = useState<Charge[]>([])
    const [payments, setPayments] = useState<Payment[]>([])
    const [chargesPage, setChargesPage] = useState(1)
    const [paymentsPage, setPaymentsPage] = useState(1)
    const [chargesPages, setChargesPages] = useState(1)
    const [paymentsPages, setPaymentsPages] = useState(1)
    const [paymentsTotal, setPaymentsTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [reloadNonce, setReloadNonce] = useState(0)

    useEffect(() => {
        async function loadAccount() {
            try {
                const response = await fetch('/api/accounts/selected')
                const body = await response.json() as AccountResponse
                if (!response.ok || !body.ok || !body.account) throw new Error(body.error ?? 'No se pudo cargar la cuenta.')
                setAccount(body.account)
            } catch (caught) {
                setError(caught instanceof Error ? caught.message : 'No se pudo cargar la cuenta.')
            } finally {
                setLoading(false)
            }
        }
        void loadAccount()
    }, [reloadNonce])

    useEffect(() => {
        if (!account) return
        async function loadMovements() {
            try {
                const [chargesResponse, paymentsResponse] = await Promise.all([
                    fetch(`/api/accounts/selected/charges?page=${chargesPage}&pageSize=${MOVEMENTS_PAGE_SIZE}`),
                    fetch(`/api/accounts/selected/payments?page=${paymentsPage}&pageSize=${MOVEMENTS_PAGE_SIZE}`),
                ])
                const chargesBody = await chargesResponse.json() as ChargesResponse
                const paymentsBody = await paymentsResponse.json() as PaymentsResponse
                if (!chargesResponse.ok || !chargesBody.ok) throw new Error(chargesBody.error ?? 'No se pudieron cargar los cargos.')
                if (!paymentsResponse.ok || !paymentsBody.ok) throw new Error(paymentsBody.error ?? 'No se pudieron cargar los pagos.')
                setCharges(chargesBody.charges ?? [])
                setChargesPages(Math.max(1, chargesBody.totalPages ?? 1))
                setPayments(paymentsBody.payments ?? [])
                setPaymentsTotal(paymentsBody.total ?? 0)
                setPaymentsPages(Math.max(1, paymentsBody.totalPages ?? 1))
            } catch (caught) {
                setError(caught instanceof Error ? caught.message : 'No se pudieron cargar los movimientos.')
            }
        }
        void loadMovements()
    }, [account, chargesPage, paymentsPage])

    if (loading) return <main className="min-h-screen bg-gradient-to-br from-pink-100 via-pink-50 to-rose-100 p-4 sm:p-6"><div className="mx-auto max-w-5xl space-y-4"><div className="h-9 w-40 animate-pulse rounded bg-pink-200" /><div className="h-56 animate-pulse rounded-xl bg-card" /></div></main>

    if (error || !account) return <main className="min-h-screen bg-gradient-to-br from-pink-100 via-pink-50 to-rose-100 p-4 sm:p-6"><div className="mx-auto max-w-xl"><Link href="/" className={cn(buttonVariants({ variant: 'outline' }), 'mb-5')}><ArrowLeft data-icon="inline-start" /> Volver a cuentas</Link><Alert variant="destructive"><CircleAlert className="size-4" /><AlertTitle>No se pudo mostrar la cuenta</AlertTitle><AlertDescription>{error ?? 'Selecciona una cuenta desde el dashboard.'}</AlertDescription></Alert></div></main>

    return <main className="min-h-screen bg-gradient-to-br from-pink-100 via-pink-50 to-rose-100 px-4 py-6 pb-10 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-5xl">
            <header className="mb-6 sm:mb-8"><Link href="/" className={cn(buttonVariants({ variant: 'outline' }), 'mb-4')}><ArrowLeft data-icon="inline-start" /> Volver a cuentas</Link><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Detalle de cuenta</h1><p className="mt-1 text-sm text-muted-foreground">Resumen y movimientos registrados.</p></header>

            <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><UserRound className="size-5 text-primary" /><h2 className="text-lg font-semibold">{account.clientName}</h2><Badge variant={statusVariant[account.status]}>{statusLabel[account.status]}</Badge></div><p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><Phone className="size-4" />{formatPhone(account.clientPhone)}</p>{account.clientAddress && <p className="mt-1 text-sm text-muted-foreground">{account.clientAddress}</p>}</div><div className="rounded-lg bg-pink-50 px-3 py-2 text-sm"><p className="text-muted-foreground">Pago quincenal</p><p className="font-semibold text-foreground">{formatMoney(account.biweeklyAmount)}</p></div></div>{account.detail && <p className="mt-4 border-t pt-4 text-sm text-muted-foreground">{account.detail}</p>}</section>

            <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Saldo pendiente" value={formatMoney(account.remainingAmount)} emphasis /><Metric label="Total de cuenta" value={formatMoney(account.totalAmount)} /><Metric label="Total pagado" value={formatMoney(account.totalPaid)} /><Metric label="Próximo pago" value={account.status === 'pagada' ? 'Sin pago pendiente' : formatDate(account.nextPaymentDate)} /></section>

            <AccountManagement account={account} charges={charges} payments={payments} hasPayments={paymentsTotal > 0} chargesPage={chargesPage} chargesPages={chargesPages} paymentsPage={paymentsPage} paymentsPages={paymentsPages} onChargesPageChange={setChargesPage} onPaymentsPageChange={setPaymentsPage} onChanged={() => setReloadNonce((value) => value + 1)} />
        </div>
    </main>
}

function Metric({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
    return <article className="rounded-xl border bg-card p-4 shadow-sm"><p className="text-sm text-muted-foreground">{label}</p><p className={cn('mt-2 text-xl font-semibold tabular-nums', emphasis && 'text-primary')}>{value}</p></article>
}
