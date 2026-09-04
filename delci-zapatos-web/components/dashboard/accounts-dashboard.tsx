'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, CircleAlert, Eye, Filter, LoaderCircle, Plus, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pagination, PaginationButton, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import type { AccountStatus } from '@/types/database'

type DashboardAccount = {
    id: string
    clientName: string
    clientPhone: string
    remainingAmount: number
    totalAmount: number
    totalPaid: number
    status: AccountStatus
    nextPaymentDate: string | null
}

type AccountsResponse = { ok: boolean; accounts?: DashboardAccount[]; total?: number; totalPages?: number; error?: string }
type StatusFilter = 'todos' | AccountStatus

const PAGE_SIZE = 8
const statusLabel: Record<AccountStatus, string> = { activa: 'Activa', pagada: 'Pagada', atrasada: 'Atrasada' }
const statusVariant: Record<AccountStatus, 'success' | 'neutral' | 'warning'> = { activa: 'success', pagada: 'neutral', atrasada: 'warning' }

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(value)
}

function formatPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '').replace(/^506/, '').slice(0, 8)
    return digits.length === 8 ? `+506 ${digits.slice(0, 4)}-${digits.slice(4)}` : phone
}

export function AccountsDashboard() {
    const router = useRouter()
    const [accounts, setAccounts] = useState<DashboardAccount[]>([])
    const [totalAccounts, setTotalAccounts] = useState(0)
    const [totalPages, setTotalPages] = useState(1)
    const [query, setQuery] = useState('')
    const [status, setStatus] = useState<StatusFilter>('todos')
    const [onlyPendingPayments, setOnlyPendingPayments] = useState(false)
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [openingAccountId, setOpeningAccountId] = useState<string | null>(null)

    async function openAccountDetails(accountId: string) {
        setOpeningAccountId(accountId)
        try {
            const response = await fetch('/api/accounts/selected', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accountId }) })
            const body = await response.json() as { ok: boolean; error?: string }
            if (!response.ok || !body.ok) throw new Error(body.error ?? 'No se pudo abrir la cuenta.')
            router.push('/cuentas/detalle')
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : 'No se pudo abrir la cuenta.')
        } finally {
            setOpeningAccountId(null)
        }
    }

    useEffect(() => {
        async function loadAccounts() {
            setLoading(true)
            setError(null)
            try {
                const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) })
                if (query.trim()) params.set('search', query.trim())
                if (status !== 'todos') params.set('status', status)
                if (onlyPendingPayments) params.set('pending', 'true')
                const response = await fetch(`/api/accounts?${params}`)
                const body = await response.json() as AccountsResponse
                if (!response.ok || !body.ok) throw new Error(body.error ?? 'No se pudieron cargar las cuentas')
                setAccounts(body.accounts ?? [])
                setTotalAccounts(body.total ?? 0)
                setTotalPages(Math.max(1, body.totalPages ?? 1))
            } catch (caughtError) {
                setError(caughtError instanceof Error ? caughtError.message : 'No se pudieron cargar las cuentas')
            } finally {
                setLoading(false)
            }
        }
        void loadAccounts()
    }, [onlyPendingPayments, page, query, status])

    const currentPage = Math.min(page, totalPages)
    const pageAccounts = accounts

    return (
        <main className="relative min-h-screen bg-gradient-to-br from-pink-100 via-pink-50 to-rose-100 px-4 py-6 pb-24 sm:px-6 sm:py-8 sm:pb-8">
            <div className="mx-auto max-w-7xl">
                <header className="mb-6 flex items-center justify-between sm:mb-8">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">¡Hola, Delci!</h1>
                        <p className="mt-1 text-sm text-muted-foreground sm:text-base">Bienvenida. Aquí tienes el resumen de hoy.</p>
                    </div>
                    <Link href="/cuentas/nueva" className={cn(buttonVariants({ size: 'lg' }), 'hidden sm:inline-flex')}>
                        <Plus data-icon="inline-start" /> Crear cuenta
                    </Link>
                </header>

                <section className="overflow-visible rounded-xl border bg-card shadow-sm">
                    <div className="flex flex-col gap-3 border-b p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="relative w-full lg:max-w-md">
                            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} className="pl-9" placeholder="Cliente o teléfono" aria-label="Buscar cuentas" />
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <StatusFilter status={status} onChange={(nextStatus) => { setStatus(nextStatus); setPage(1) }} />
                            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm text-muted-foreground sm:border-0 sm:px-0 sm:py-0">
                                Próximos pagos pendientes
                                <Switch checked={onlyPendingPayments} onCheckedChange={(checked) => { setOnlyPendingPayments(checked); setPage(1) }} />
                            </label>
                        </div>
                    </div>

                    {error ? <ErrorState message={error} /> : <>
                        <div className="md:hidden">
                            {loading ? <MobileLoading /> : pageAccounts.map((account) => <AccountCard key={account.id} account={account} opening={openingAccountId === account.id} onOpen={() => openAccountDetails(account.id)} />)}
                            {!loading && pageAccounts.length === 0 && <EmptyState />}
                        </div>
                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full min-w-[45rem] text-left text-sm">
                                <thead className="bg-muted/50 text-xs font-medium tracking-wide text-muted-foreground uppercase"><tr>
                                    <th className="px-5 py-3">Cliente</th><th className="px-5 py-3 text-right">Saldo pendiente</th><th className="px-5 py-3 text-right">Total</th><th className="px-5 py-3 text-right">Pagado</th><th className="px-5 py-3">Estado</th><th className="px-5 py-3 text-right">Acciones</th>
                                </tr></thead>
                                <tbody className="divide-y">
                                    {loading ? <TableLoading /> : pageAccounts.map((account) => <AccountRow key={account.id} account={account} opening={openingAccountId === account.id} onOpen={() => openAccountDetails(account.id)} />)}
                                    {!loading && pageAccounts.length === 0 && <EmptyRow />}
                                </tbody>
                            </table>
                        </div>
                        {!loading && <footer className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                            <span className="text-center text-sm text-muted-foreground sm:text-left">{totalAccounts} {totalAccounts === 1 ? 'cuenta encontrada' : 'cuentas encontradas'}</span>
                            <DashboardPagination currentPage={currentPage} totalPages={totalPages} onChange={setPage} />
                        </footer>}
                    </>}
                </section>
            </div>
            <Link href="/cuentas/nueva" aria-label="Crear cuenta" className={cn(buttonVariants({ size: 'icon-lg' }), 'fixed right-5 bottom-10 z-20 size-12 rounded-full shadow-lg sm:hidden')}><Plus className="size-5" /></Link>
        </main>
    )
}

function StatusFilter({ status, onChange }: { status: StatusFilter; onChange: (status: StatusFilter) => void }) {
    const [open, setOpen] = useState(false)
    const label = status === 'todos' ? 'Todos los estados' : statusLabel[status]
    const options: StatusFilter[] = ['todos', 'activa', 'pagada', 'atrasada']
    return <div className="relative">
        <Button variant="outline" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="w-full justify-between sm:w-[12rem]">
            <span className="flex items-center gap-2"><Filter /> {label}</span><ChevronDown className={cn('shrink-0 transition-transform', open && 'rotate-180')} />
        </Button>
        {open && <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border bg-popover p-1 shadow-lg">
            {options.map((option) => <button key={option} type="button" onClick={() => { onChange(option); setOpen(false) }} className={cn('flex w-full items-center rounded-md px-3 py-2 text-left text-sm hover:bg-muted', option === status && 'bg-muted font-medium')}>
                {option === 'todos' ? 'Todos los estados' : statusLabel[option]}
            </button>)}
        </div>}
    </div>
}

function AccountCard({ account, opening, onOpen }: { account: DashboardAccount; opening: boolean; onOpen: () => void }) {
    return <article className="border-b p-4 last:border-b-0">
        <div className="flex items-start justify-between gap-3"><div><p className="font-medium text-foreground">{account.clientName}</p><p className="mt-0.5 text-xs text-muted-foreground">{formatPhone(account.clientPhone)}</p></div><Badge variant={statusVariant[account.status]}>{statusLabel[account.status]}</Badge></div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center"><MoneyMetric label="Pendiente" value={account.remainingAmount} emphasis /><MoneyMetric label="Total" value={account.totalAmount} /><MoneyMetric label="Pagado" value={account.totalPaid} /></div>
        <Button type="button" size="sm" className="mt-4 w-full shadow-sm hover:shadow-md" onClick={onOpen} disabled={opening}>{opening ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : <Eye data-icon="inline-start" />}{opening ? 'Abriendo...' : 'Ver detalle'}</Button>
    </article>
}

function MoneyMetric({ label, value, emphasis = false }: { label: string; value: number; emphasis?: boolean }) {
    return <div><p className="text-[11px] text-muted-foreground">{label}</p><p className={cn('mt-1 text-xs tabular-nums text-muted-foreground', emphasis && 'font-semibold text-foreground')}>{formatCurrency(value)}</p></div>
}

function AccountRow({ account, opening, onOpen }: { account: DashboardAccount; opening: boolean; onOpen: () => void }) {
    return <tr className="transition-colors hover:bg-muted/30"><td className="px-5 py-4"><p className="font-medium text-foreground">{account.clientName}</p><p className="mt-0.5 text-xs text-muted-foreground">{formatPhone(account.clientPhone)}</p></td><td className="px-5 py-4 text-right font-medium tabular-nums">{formatCurrency(account.remainingAmount)}</td><td className="px-5 py-4 text-right tabular-nums text-muted-foreground">{formatCurrency(account.totalAmount)}</td><td className="px-5 py-4 text-right tabular-nums text-muted-foreground">{formatCurrency(account.totalPaid)}</td><td className="px-5 py-4"><Badge variant={statusVariant[account.status]}>{statusLabel[account.status]}</Badge></td><td className="px-5 py-4 text-right"><Button type="button" size="sm" className="shadow-sm hover:shadow-md" onClick={onOpen} disabled={opening}>{opening ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : <Eye data-icon="inline-start" />}{opening ? 'Abriendo...' : 'Ver detalle'}</Button></td></tr>
}

function DashboardPagination({ currentPage, totalPages, onChange }: { currentPage: number; totalPages: number; onChange: (page: number) => void }) {
    if (totalPages <= 1) return null
    const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
    return <Pagination className="mx-0 w-auto"><PaginationContent><PaginationItem><PaginationPrevious disabled={currentPage === 1} onClick={() => onChange(currentPage - 1)} /></PaginationItem><span className="px-1 text-xs text-muted-foreground sm:hidden">{currentPage} de {totalPages}</span><div className="hidden items-center sm:flex">{pages.map((page, index) => <span key={page} className="flex items-center">{index > 0 && page - pages[index - 1] > 1 && <span className="px-1 text-muted-foreground">…</span>}<PaginationItem><PaginationButton isActive={page === currentPage} onClick={() => onChange(page)}>{page}</PaginationButton></PaginationItem></span>)}</div><PaginationItem><PaginationNext disabled={currentPage === totalPages} onClick={() => onChange(currentPage + 1)} /></PaginationItem></PaginationContent></Pagination>
}

function ErrorState({ message }: { message: string }) { return <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-6 text-center"><CircleAlert className="size-7 text-destructive" /><p className="text-sm text-muted-foreground">{message}</p></div> }
function TableLoading() { return <>{Array.from({ length: 5 }, (_, index) => <tr key={index}><td colSpan={6} className="px-5 py-5"><div className="h-4 animate-pulse rounded bg-muted" /></td></tr>)}</> }
function MobileLoading() { return <>{Array.from({ length: 4 }, (_, index) => <div key={index} className="border-b p-4"><div className="h-16 animate-pulse rounded bg-muted" /></div>)}</> }
function EmptyRow() { return <tr><td colSpan={6}><EmptyState /></td></tr> }
function EmptyState() { return <div className="px-5 py-16 text-center text-sm text-muted-foreground">No hay cuentas que coincidan con los filtros.</div> }
