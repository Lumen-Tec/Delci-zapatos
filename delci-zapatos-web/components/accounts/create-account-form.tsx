'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog } from '@base-ui/react/dialog'
import { ArrowLeft, CheckCircle2, LoaderCircle } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { showError } from '@/lib/sweet-alert'

type FormData = { fullName: string; phone: string; address: string; initialBalance: string; quincenalAmount: string; initialPayment: string; detail: string; chargeDescription: string; chargeAmount: string; chargeDate: string }
type ApiResponse = { ok: boolean; error?: string; created?: { id: string } }

const INITIAL_FORM: FormData = { fullName: '', phone: '', address: '', initialBalance: '', quincenalAmount: '', initialPayment: '', detail: '', chargeDescription: '', chargeAmount: '', chargeDate: '' }

function formatPhone(value: string): string {
    let digits = value.replace(/\D/g, '')
    if (digits.startsWith('506')) digits = digits.slice(3)
    digits = digits.slice(0, 8)
    if (!digits) return ''
    return `+506 ${digits.slice(0, 4)}${digits.length > 4 ? `-${digits.slice(4)}` : ''}`
}

function amount(value: string): number {
    return Number(value || 0)
}

export function CreateAccountForm() {
    const router = useRouter()
    const [form, setForm] = useState<FormData>(INITIAL_FORM)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [createdAccountId, setCreatedAccountId] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    function update(field: keyof FormData, value: string) {
        setForm((current) => ({ ...current, [field]: value }))
    }

    function clearForm() {
        setForm(INITIAL_FORM)
    }

    function validate(): string | null {
        if (!form.fullName.trim()) return 'El nombre completo es requerido.'
        if (!/^\+506 \d{4}-\d{4}$/.test(form.phone)) return 'El teléfono debe tener el formato +506 xxxx-xxxx.'
        if (!Number.isFinite(amount(form.quincenalAmount)) || amount(form.quincenalAmount) <= 0) return 'El monto quincenal debe ser mayor a cero.'
        if (amount(form.initialBalance) < 0 || amount(form.initialPayment) < 0 || amount(form.chargeAmount) < 0) return 'Los montos no pueden ser negativos.'
        const hasCharge = Boolean(form.chargeDescription.trim() || form.chargeAmount || form.chargeDate)
        if (hasCharge && !form.chargeDescription.trim()) return 'La descripción es requerida cuando se registra un cargo.'
        if (hasCharge && amount(form.chargeAmount) <= 0) return 'El monto del cargo debe ser mayor a cero.'
        if (amount(form.initialPayment) > amount(form.initialBalance) + amount(form.chargeAmount)) return 'El abono inicial no puede ser mayor al saldo pendiente.'
        return null
    }

    function review(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const validationError = validate()
        if (validationError) return void showError(validationError)
        setConfirmOpen(true)
    }

    async function request(url: string, body: object): Promise<ApiResponse> {
        const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        const payload = await response.json() as ApiResponse
        if (!response.ok || !payload.ok) throw new Error(payload.error ?? 'No se pudo completar la operación.')
        return payload
    }

    async function createAccount() {
        setSubmitting(true)
        try {
            const phoneForStorage = form.phone.replace(/\D/g, '')
            const client = await request('/api/clients', { fullName: form.fullName.trim(), phone: `+${phoneForStorage}`, address: form.address.trim() })
            const clientId = client.created?.id
            if (!clientId) throw new Error('No se obtuvo el identificador del cliente creado.')

            const account = await request('/api/accounts', { clientId, initialBalance: amount(form.initialBalance), quincenalAmount: amount(form.quincenalAmount), detail: form.detail.trim() || undefined })
            const accountId = account.created?.id
            if (!accountId) throw new Error('No se obtuvo el identificador de la cuenta creada.')

            if (form.chargeDescription.trim()) {
                await request('/api/charges', { accountId, description: form.chargeDescription.trim(), amount: amount(form.chargeAmount), chargeDate: form.chargeDate || undefined })
            }

            if (amount(form.initialPayment) > 0) {
                await request('/api/payments', { accountId, amount: amount(form.initialPayment), paymentDate: new Date().toISOString().slice(0, 10) })
            }

            setConfirmOpen(false)
            setCreatedAccountId(accountId)
        } catch (error) {
            void showError(error instanceof Error ? error.message : 'No se pudo crear la cuenta.')
        } finally {
            setSubmitting(false)
        }
    }

    async function openCreatedAccount() {
        if (!createdAccountId) return
        try {
            const response = await fetch('/api/accounts/selected', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accountId: createdAccountId }) })
            const body = await response.json() as { ok: boolean; error?: string }
            if (!response.ok || !body.ok) throw new Error(body.error ?? 'No se pudo abrir la cuenta.')
            router.push('/cuentas/detalle')
        } catch (error) {
            void showError(error instanceof Error ? error.message : 'No se pudo abrir la cuenta.')
        }
    }

    return <main className="relative min-h-screen bg-gradient-to-br from-pink-100 via-pink-50 to-rose-100 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-2xl">
            <Link href="/" className={cn(buttonVariants({ variant: 'outline' }), 'mb-5 h-9')}><ArrowLeft data-icon="inline-start" /> Volver a cuentas</Link>
            <header className="mb-6"><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Crear cuenta de crédito</h1><p className="mt-2 text-sm text-muted-foreground">Registra al cliente y configura su cuenta.</p></header>

            <form onSubmit={review} className="space-y-5">
                <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-6"><SectionTitle number="1" title="Datos del cliente" /><div className="mt-5 grid gap-4"><Field label="Nombre completo" required><Input value={form.fullName} onChange={(event) => update('fullName', event.target.value)} placeholder="Nombre y apellidos" autoComplete="name" required /></Field><Field label="Teléfono" required><Input value={form.phone} onChange={(event) => update('phone', formatPhone(event.target.value))} placeholder="+506 8888-8888" inputMode="numeric" autoComplete="tel" required /></Field><Field label="Dirección completa"><Textarea value={form.address} onChange={(event) => update('address', event.target.value)} placeholder="Provincia, cantón, distrito y señas" /></Field></div></section>
                <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-6"><SectionTitle number="2" title="Datos de la cuenta" /><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Saldo inicial"><Input value={form.initialBalance} onChange={(event) => update('initialBalance', event.target.value)} type="number" min="0" step="0.01" inputMode="decimal" placeholder="₡ 0" /></Field><Field label="Monto quincenal" required><Input value={form.quincenalAmount} onChange={(event) => update('quincenalAmount', event.target.value)} type="number" min="0.01" step="0.01" inputMode="decimal" placeholder="₡ 0" required /></Field><Field label="Abono inicial"><Input value={form.initialPayment} onChange={(event) => update('initialPayment', event.target.value)} type="number" min="0" step="0.01" inputMode="decimal" placeholder="₡ 0" /></Field><div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground"><p className="font-medium text-foreground">Próximo pago</p><p className="mt-1">Se calculará automáticamente para el próximo 15 o 30.</p></div><div className="sm:col-span-2"><Field label="Detalle de la cuenta"><Textarea value={form.detail} onChange={(event) => update('detail', event.target.value)} placeholder="Información adicional de la cuenta" /></Field></div></div></section>
                <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-6">
                    <SectionTitle number="3" title="Cargo de la cuenta" />
                    <p className="mt-3 text-sm text-muted-foreground">Opcional. Registra el primer producto o cargo asociado a esta cuenta.</p>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2"><Field label="Descripción del cargo"><Input value={form.chargeDescription} onChange={(event) => update('chargeDescription', event.target.value)} placeholder="Nombre del producto" /></Field></div>
                        <Field label="Monto del cargo"><Input value={form.chargeAmount} onChange={(event) => update('chargeAmount', event.target.value)} type="number" min="0.01" step="0.01" inputMode="decimal" placeholder="₡ 0" /></Field>
                        <Field label="Fecha del cargo"><Input value={form.chargeDate} onChange={(event) => update('chargeDate', event.target.value)} type="date" /><span className="text-xs font-normal text-muted-foreground">Si se omite, se usará la fecha actual.</span></Field>
                    </div>
                </section>
                <div className="flex flex-col gap-2">
                    <Button type="submit" size="lg" className="h-9 w-full"><CheckCircle2 data-icon="inline-start" /> Revisar y crear cuenta</Button>
                    <Button type="button" variant="outline" size="lg" className="h-9 w-full" onClick={clearForm}>Limpiar formulario</Button>
                </div>
            </form>
        </div>

        <Dialog.Root open={confirmOpen} onOpenChange={setConfirmOpen}><Dialog.Portal><Dialog.Backdrop className="fixed inset-0 z-40 bg-black/45" /><Dialog.Viewport className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"><Dialog.Popup className="w-full max-w-md rounded-t-2xl bg-card p-5 shadow-xl outline-none sm:rounded-2xl sm:p-6"><Dialog.Title className="text-lg font-semibold">Confirmar creación de cuenta</Dialog.Title><Dialog.Description className="mt-1 text-sm text-muted-foreground">Verifica los datos antes de guardar.</Dialog.Description><dl className="mt-5 divide-y rounded-lg border text-sm"><Summary label="Cliente" value={form.fullName} /><Summary label="Teléfono" value={form.phone} /><Summary label="Monto quincenal" value={formatMoney(amount(form.quincenalAmount))} /><Summary label="Saldo inicial" value={formatMoney(amount(form.initialBalance))} /><Summary label="Abono inicial" value={formatMoney(amount(form.initialPayment))} />{form.chargeDescription.trim() && <><Summary label="Cargo" value={form.chargeDescription.trim()} /><Summary label="Monto del cargo" value={formatMoney(amount(form.chargeAmount))} /><Summary label="Fecha del cargo" value={form.chargeDate || 'Fecha actual'} /></>}</dl><div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Dialog.Close className={cn(buttonVariants({ variant: 'outline' }), 'h-9')} disabled={submitting}>Cancelar</Dialog.Close><Button type="button" className="h-9" onClick={createAccount} disabled={submitting}>{submitting && <LoaderCircle className="animate-spin" data-icon="inline-start" />}{submitting ? 'Creando...' : 'Crear cuenta'}</Button></div></Dialog.Popup></Dialog.Viewport></Dialog.Portal></Dialog.Root>
        <Dialog.Root open={Boolean(createdAccountId)} onOpenChange={(open) => { if (!open) setCreatedAccountId(null) }}>
            <Dialog.Portal>
                <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/45" />
                <Dialog.Viewport className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
                    <Dialog.Popup className="w-full max-w-md rounded-t-2xl bg-card p-5 shadow-xl outline-none sm:rounded-2xl sm:p-6">
                        <Dialog.Title className="text-lg font-semibold">Cuenta creada correctamente</Dialog.Title>
                        <Dialog.Description className="mt-2 text-sm text-muted-foreground">¿Deseas crear otra cuenta?</Dialog.Description>
                        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                            <Button type="button" variant="outline" className="h-9" onClick={() => { clearForm(); setCreatedAccountId(null) }}>Sí, crear otra</Button>
                            <Button type="button" className="h-9" onClick={openCreatedAccount}>No, ver detalle</Button>
                            <Button type="button" variant="secondary" className="h-9" onClick={() => router.push('/')}>No, regresar al inicio</Button>
                        </div>
                    </Dialog.Popup>
                </Dialog.Viewport>
            </Dialog.Portal>
        </Dialog.Root>
    </main>
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) { return <label className="grid gap-1.5 text-sm font-medium"><span>{label}{required && <span className="text-destructive"> (obligatorio)</span>}</span>{children}</label> }
function SectionTitle({ number, title }: { number: string; title: string }) { return <div className="flex items-center gap-3"><span className="flex size-7 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{number}</span><h2 className="font-semibold">{title}</h2></div> }
function Summary({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between gap-4 px-3 py-2.5"><dt className="text-muted-foreground">{label}</dt><dd className="text-right font-medium">{value}</dd></div> }
function formatMoney(value: number): string { return new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 2 }).format(value) }
