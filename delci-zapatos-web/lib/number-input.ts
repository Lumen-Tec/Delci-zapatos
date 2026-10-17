export function formatAmountInput(value: string): string {
    if (!value) return ''
    const [integer, decimals] = value.split('.')
    const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    return decimals === undefined ? grouped : `${grouped},${decimals}`
}

export function parseAmountInput(value: string): string | null {
    const normalized = value.replace(/\s/g, '').replace(',', '.')
    if (!/^\d*(?:\.\d{0,2})?$/.test(normalized)) return null
    return normalized.startsWith('.') ? `0${normalized}` : normalized
}

export function amountCaretPosition(formatted: string, charactersBeforeCaret: number): number {
    let position = 0
    let characters = 0
    while (position < formatted.length && characters < charactersBeforeCaret) {
        if (formatted[position] !== ' ') characters++
        position++
    }
    return position
}

export function amountValidationMessage(value: string, min?: number, max?: number): string {
    if (!value) return ''
    const amount = Number(value)
    if (!Number.isFinite(amount)) return 'Ingresa un monto válido.'
    if (min !== undefined && amount < min) return `El monto debe ser mayor o igual a ${formatAmountInput(String(min))}.`
    if (max !== undefined && amount > max) return `El monto no puede superar ${formatAmountInput(String(max))}.`
    return ''
}
