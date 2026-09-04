'use client'

import { useState, type ReactNode } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { CreditCard, LoaderCircle, MessageCircle, PackagePlus, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { cn } from '@/lib/utils'
import { showError, showSuccess } from '@/lib/sweet-alert'

type Account = { id: string; clientId: string; clientName: string; clientPhone: string; clientAddress: string; detail: string | null; initialBalance: number }
type Charge = { id: string; description: string; amount: number; chargeDate: string }
type Payment = { id: string; amount: number; paymentDate: string }
type Editor = { kind: 'client' | 'account' | 'charge' | 'payment'; item?: Charge | Payment } | null

function money(value: number) { return new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(value) }
function today() { return new Date().toISOString().slice(0, 10) }

export function AccountManagement({ account, charges, payments, hasPayments, chargesPage, chargesPages, paymentsPage, paymentsPages, onChargesPageChange, onPaymentsPageChange, onChanged }: { account: Account; charges: Charge[]; payments: Payment[]; hasPayments: boolean; chargesPage: number; chargesPages: number; paymentsPage: number; paymentsPages: number; onChargesPageChange: (page: number) => void; onPaymentsPageChange: (page: number) => void; onChanged: () => void }) {
    const [editor, setEditor] = useState<Editor>(null)
    const [deleting, setDeleting] = useState<{ kind: 'charge' | 'payment'; id: string } | null>(null)
    const [busy, setBusy] = useState(false)
    const [notifying, setNotifying] = useState(false)
    const [client, setClient] = useState({ fullName: account.clientName, phone: account.clientPhone, address: account.clientAddress })
    const [accountForm, setAccountForm] = useState({ detail: account.detail ?? '', initialBalance: String(account.initialBalance) })
    const [charge, setCharge] = useState({ description: '', amount: '', date: today() })
    const [payment, setPayment] = useState({ amount: '', date: today() })

    function open(kind: NonNullable<Editor>['kind'], item?: Charge | Payment) {
        if (kind === 'client') setClient({ fullName: account.clientName, phone: account.clientPhone, address: account.clientAddress })
        if (kind === 'account') setAccountForm({ detail: account.detail ?? '', initialBalance: String(account.initialBalance) })
        if (kind === 'charge') setCharge(item ? { description: (item as Charge).description, amount: String(item.amount), date: (item as Charge).chargeDate } : { description: '', amount: '', date: today() })
        if (kind === 'payment') setPayment(item ? { amount: String((item as Payment).amount), date: (item as Payment).paymentDate } : { amount: '', date: today() })
        setEditor({ kind, item })
    }

    async function send(url: string, method: 'POST' | 'PATCH' | 'DELETE', body?: object) {
        const response = await fetch(url, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined })
        const result = await response.json() as { ok: boolean; error?: string }
        if (!response.ok || !result.ok) throw new Error(result.error ?? 'No se pudo guardar el cambio.')
    }

    async function save() {
        if (!editor) return
        setBusy(true)
        try {
            if (editor.kind === 'client') await send('/api/clients', 'PATCH', { id: account.clientId, fullName: client.fullName.trim(), phone: client.phone, address: client.address.trim() })
            if (editor.kind === 'account') await send('/api/accounts', 'PATCH', { id: account.id, detail: accountForm.detail.trim() || null, ...(!hasPayments ? { initialBalance: Number(accountForm.initialBalance || 0) } : {}) })
            if (editor.kind === 'charge') {
                const item = editor.item as Charge | undefined
                const body = { description: charge.description.trim(), amount: Number(charge.amount), chargeDate: charge.date }
                await send('/api/charges', item ? 'PATCH' : 'POST', item ? { chargeId: item.id, ...body } : { accountId: account.id, ...body })
            }
            if (editor.kind === 'payment') {
                const item = editor.item as Payment | undefined
                const body = { amount: Number(payment.amount), paymentDate: payment.date }
                await send('/api/payments', item ? 'PATCH' : 'POST', item ? { paymentId: item.id, ...body } : { accountId: account.id, ...body })
            }
            setEditor(null)
            const successMessage = editor.kind === 'client'
                ? 'La información del cliente fue actualizada.'
                : editor.kind === 'account'
                    ? 'El detalle y saldo de la cuenta fueron actualizados.'
                    : editor.kind === 'charge'
                        ? editor.item ? 'El cargo fue actualizado.' : 'El cargo fue registrado.'
                        : editor.item ? 'El pago fue actualizado.' : 'El pago fue registrado.'
            void showSuccess(successMessage)
            onChanged()
        } catch (error) { void showError(error instanceof Error ? error.message : 'No se pudo guardar el cambio.') } finally { setBusy(false) }
    }

    async function remove() {
        if (!deleting) return
        setBusy(true)
        try {
            const url = deleting.kind === 'charge' ? `/api/charges?chargeId=${deleting.id}` : `/api/payments?paymentId=${deleting.id}`
            await send(url, 'DELETE')
            setDeleting(null)
            void showSuccess(deleting.kind === 'charge' ? 'El cargo fue eliminado y el saldo fue actualizado.' : 'El pago fue eliminado y el saldo fue actualizado.')
            onChanged()
        } catch (error) { void showError(error instanceof Error ? error.message : 'No se pudo eliminar el movimiento.') } finally { setBusy(false) }
    }

    async function notifyLatestPayment() {
        setNotifying(true)
        try {
            const response = await fetch('/api/payments/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accountId: account.id }) })
            const result = await response.json() as { ok: boolean; error?: string; waUrl?: string }
            if (!response.ok || !result.ok || !result.waUrl) throw new Error(result.error ?? 'No se pudo preparar la notificación.')
            window.open(result.waUrl, '_blank', 'noopener,noreferrer')
            void showSuccess('La notificación se abrió en WhatsApp.')
        } catch (error) { void showError(error instanceof Error ? error.message : 'No se pudo enviar la notificación.') } finally { setNotifying(false) }
    }

    return <section className="mt-5 space-y-5">
        <article className="rounded-xl border bg-card p-4 shadow-sm"><h2 className="font-semibold">Administrar cuenta</h2><div className="mt-3 grid gap-2 sm:grid-cols-2"><Button variant="outline" onClick={() => open('client')}><Pencil data-icon="inline-start" /> Editar cliente</Button><Button variant="outline" onClick={() => open('account')}><Pencil data-icon="inline-start" /> Editar detalle y saldo</Button></div></article>
        <div className="grid gap-5 lg:grid-cols-2"><MovementList title="Cargos" icon={<PackagePlus className="size-5 text-primary" />} empty="No hay cargos en esta página." items={charges.map((item) => ({ ...item, title: item.description, date: item.chargeDate }))} page={chargesPage} totalPages={chargesPages} onPageChange={onChargesPageChange} onAdd={() => open('charge')} onEdit={(item) => open('charge', { id: item.id, description: item.title, amount: item.amount, chargeDate: item.date })} onDelete={(id) => setDeleting({ kind: 'charge', id })} positive /><MovementList title="Pagos" icon={<CreditCard className="size-5 text-primary" />} empty="No hay pagos en esta página." items={payments.map((item) => ({ ...item, title: 'Abono registrado', date: item.paymentDate }))} page={paymentsPage} totalPages={paymentsPages} onPageChange={onPaymentsPageChange} onAdd={() => open('payment')} onEdit={(item) => open('payment', { id: item.id, amount: item.amount, paymentDate: item.date })} onDelete={(id) => setDeleting({ kind: 'payment', id })} onNotify={notifyLatestPayment} notifying={notifying} /></div>

        <Dialog.Root open={Boolean(editor)} onOpenChange={(openValue) => { if (!openValue && !busy) setEditor(null) }}><Dialog.Portal><Dialog.Backdrop className="fixed inset-0 z-40 bg-black/45" /><Dialog.Viewport className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"><Dialog.Popup className="w-full max-w-md rounded-t-2xl bg-card p-5 shadow-xl outline-none sm:rounded-2xl sm:p-6"><Dialog.Title className="text-lg font-semibold">{editor?.kind === 'client' ? 'Editar cliente' : editor?.kind === 'account' ? 'Editar cuenta' : editor?.kind === 'charge' ? editor.item ? 'Editar cargo' : 'Registrar cargo' : editor?.item ? 'Editar pago' : 'Registrar pago'}</Dialog.Title><div className="mt-5 grid gap-4">{editor?.kind === 'client' && <><Field label="Nombre completo"><Input value={client.fullName} onChange={(event) => setClient({ ...client, fullName: event.target.value })} /></Field><Field label="Teléfono"><Input value={client.phone} onChange={(event) => setClient({ ...client, phone: event.target.value })} /></Field><Field label="Dirección"><Textarea value={client.address} onChange={(event) => setClient({ ...client, address: event.target.value })} /></Field></>}{editor?.kind === 'account' && <><Field label="Detalle de la cuenta"><Textarea value={accountForm.detail} onChange={(event) => setAccountForm({ ...accountForm, detail: event.target.value })} /></Field><Field label="Saldo inicial"><Input type="number" min="0" step="0.01" disabled={hasPayments} value={accountForm.initialBalance} onChange={(event) => setAccountForm({ ...accountForm, initialBalance: event.target.value })} />{hasPayments && <p className="text-xs text-muted-foreground">Hay pagos registrados. Para reducir el total, elimina o corrige un cargo.</p>}</Field></>}{editor?.kind === 'charge' && <><Field label="Descripción"><Input value={charge.description} onChange={(event) => setCharge({ ...charge, description: event.target.value })} /></Field><Field label="Monto"><Input type="number" min="0.01" step="0.01" value={charge.amount} onChange={(event) => setCharge({ ...charge, amount: event.target.value })} /></Field><Field label="Fecha"><Input type="date" value={charge.date} onChange={(event) => setCharge({ ...charge, date: event.target.value })} /></Field></>}{editor?.kind === 'payment' && <><Field label="Monto"><Input type="number" min="0.01" step="0.01" value={payment.amount} onChange={(event) => setPayment({ ...payment, amount: event.target.value })} /></Field><Field label="Fecha"><Input type="date" value={payment.date} onChange={(event) => setPayment({ ...payment, date: event.target.value })} /></Field></>}</div><div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Dialog.Close className={cn(buttonVariants({ variant: 'outline' }), 'border-pink-400 bg-background text-foreground hover:bg-pink-50')} disabled={busy}>Cancelar</Dialog.Close><Button onClick={save} disabled={busy}>{busy && <LoaderCircle className="animate-spin" data-icon="inline-start" />}Guardar</Button></div></Dialog.Popup></Dialog.Viewport></Dialog.Portal></Dialog.Root>
        <Dialog.Root open={Boolean(deleting)} onOpenChange={(openValue) => { if (!openValue && !busy) setDeleting(null) }}><Dialog.Portal><Dialog.Backdrop className="fixed inset-0 z-40 bg-black/45" /><Dialog.Viewport className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"><Dialog.Popup className="w-full max-w-md rounded-t-2xl bg-card p-5 shadow-xl outline-none sm:rounded-2xl sm:p-6"><Dialog.Title className="text-lg font-semibold">Eliminar movimiento</Dialog.Title><Dialog.Description className="mt-2 text-sm text-muted-foreground">Esta acción eliminará el movimiento y recalculará el saldo de la cuenta.</Dialog.Description><div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Dialog.Close className={buttonVariants({ variant: 'outline' })} disabled={busy}>Cancelar</Dialog.Close><Button variant="destructive" onClick={remove} disabled={busy}><Trash2 data-icon="inline-start" /> Eliminar</Button></div></Dialog.Popup></Dialog.Viewport></Dialog.Portal></Dialog.Root>
    </section>
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="grid gap-1.5 text-sm font-medium">{label}{children}</label> }
function MovementList({ title, icon, empty, items, page, totalPages, onPageChange, onAdd, onEdit, onDelete, onNotify, notifying = false, positive = false }: { title: string; icon: ReactNode; empty: string; items: Array<{ id: string; title: string; date: string; amount: number }>; page: number; totalPages: number; onPageChange: (page: number) => void; onAdd: () => void; onEdit: (item: { id: string; title: string; date: string; amount: number }) => void; onDelete: (id: string) => void; onNotify?: () => void; notifying?: boolean; positive?: boolean }) { return <article className="rounded-xl border bg-card shadow-sm"><header className="flex flex-wrap items-center justify-between gap-2 border-b p-4"><div className="flex items-center gap-2">{icon}<h2 className="font-semibold">{title}</h2></div><div className="flex gap-2">{onNotify && <Button size="sm" variant="outline" onClick={onNotify} disabled={notifying || items.length === 0}>{notifying ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : <MessageCircle data-icon="inline-start" />}Notificar</Button>}<Button size="sm" onClick={onAdd}><Plus data-icon="inline-start" /> Agregar</Button></div></header><div className="divide-y">{items.length === 0 ? <p className="p-5 text-center text-sm text-muted-foreground">{empty}</p> : items.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 p-4"><div><p className="font-medium">{item.title}</p><p className="mt-0.5 text-xs text-muted-foreground">{item.date}</p><p className={cn('mt-1 text-sm font-semibold tabular-nums', positive ? 'text-foreground' : 'text-primary')}>{positive ? '+' : '-'}{money(item.amount)}</p></div><div className="flex gap-1"><Button size="icon-sm" variant="outline" aria-label="Editar" onClick={() => onEdit(item)}><Pencil /></Button><Button size="icon-sm" variant="destructive" aria-label="Eliminar" onClick={() => onDelete(item.id)}><Trash2 /></Button></div></div>)}</div>{totalPages > 1 && <div className="border-t px-4 py-2"><Pagination className="w-auto"><PaginationContent><PaginationItem><PaginationPrevious disabled={page === 1} onClick={() => onPageChange(page - 1)} /></PaginationItem><span className="px-2 text-xs text-muted-foreground">{page} de {totalPages}</span><PaginationItem><PaginationNext disabled={page === totalPages} onClick={() => onPageChange(page + 1)} /></PaginationItem></PaginationContent></Pagination></div>}</article> }
