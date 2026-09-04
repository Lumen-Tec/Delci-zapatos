export type ValidationError = { field: string; message: string }
export type ClientValidation = { isValid: true; errors: [] } | { isValid: false; errors: ValidationError[] }

export function normalizePhoneForStorage(phone: string): string {
    const digits = phone.replace(/\D/g, '').replace(/^506/, '')
    return digits ? `+506${digits.slice(0, 8)}` : ''
}

export function validateFullName(fullName: string): ValidationError | null {
    return fullName.trim() ? null : { field: 'fullName', message: 'fullName es requerido' }
}

export function validatePhone(phone: string): ValidationError | null {
    return /^\+506\d{8}$/.test(phone)
        ? null
        : { field: 'phone', message: 'phone debe tener ocho dígitos de Costa Rica' }
}

export function validateAddress(address: string): ValidationError | null {
    return typeof address === 'string' ? null : { field: 'address', message: 'address debe ser string' }
}

export function validateClient(data: { fullName: unknown; phone: unknown; address?: unknown }): ClientValidation {
    const errors: ValidationError[] = []
    if (typeof data.fullName !== 'string') errors.push({ field: 'fullName', message: 'fullName debe ser string' })
    else {
        const error = validateFullName(data.fullName)
        if (error) errors.push(error)
    }
    if (typeof data.phone !== 'string') errors.push({ field: 'phone', message: 'phone debe ser string' })
    else {
        const error = validatePhone(data.phone)
        if (error) errors.push(error)
    }
    if (data.address !== undefined && typeof data.address !== 'string') errors.push({ field: 'address', message: 'address debe ser string' })
    return errors.length ? { isValid: false, errors } : { isValid: true, errors: [] }
}
