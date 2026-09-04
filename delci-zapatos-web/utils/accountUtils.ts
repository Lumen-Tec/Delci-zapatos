import type { AccountStatus } from '@/types/database'

function formatDate(year: number, month: number, day: number): string {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function nextMonth(year: number, month: number): { year: number; month: number } {
    return month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 }
}

export function todayISO(): string {
    const now = new Date()
    return formatDate(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

/** Fecha centinela para cumplir NOT NULL cuando no existe un pago pendiente. */
export function getNoPendingPaymentDate(): string {
    const now = new Date()
    return formatDate(now.getFullYear() + 100, now.getMonth() + 1, now.getDate())
}

export function isNoPendingPaymentDate(date: string): boolean {
    const year = Number(date.slice(0, 4))
    return Number.isFinite(year) && year >= new Date().getFullYear() + 50
}

/** Devuelve el siguiente vencimiento estrictamente posterior a la fecha indicada. */
export function getNextPaymentDateFrom(date: string): string {
    const [year, month, day] = date.split('-').map(Number)
    if (day < 15) return formatDate(year, month, 15)
    if (day < 30) return formatDate(year, month, 30)
    const next = nextMonth(year, month)
    return formatDate(next.year, next.month, 15)
}

/** Devuelve la quincena anterior a una fecha programada (15 o 30). */
export function getPreviousPaymentDateFrom(date: string): string {
    const [year, month, day] = date.split('-').map(Number)
    if (day === 30) return formatDate(year, month, 15)
    const previous = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 }
    return formatDate(previous.year, previous.month, 30)
}

/** Si hoy es 15 o 30, devuelve la quincena siguiente. */
export function getNearestUpcomingPaymentDate(date = todayISO()): string {
    return getNextPaymentDateFrom(date)
}

export function computeStatus(remainingAmount: number, nextPaymentDate: string): AccountStatus {
    if (remainingAmount <= 0) return 'pagada'
    return nextPaymentDate < todayISO() ? 'atrasada' : 'activa'
}

export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 2 }).format(value)
}
