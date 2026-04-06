import type { Client } from '@/models/client';

export interface ClientValidationError {
  field: 'fullName' | 'phone' | 'address';
  message: string;
}

export interface ClientValidationResult {
  isValid: boolean;
  errors: ClientValidationError[];
}

/**
 * Normaliza telefono para almacenamiento uniforme (+506XXXXXXXX).
 */
export const normalizePhoneForStorage = (phone: string): string => {
  const digitsOnly = phone.replace(/\D/g, '');

  if (digitsOnly.length === 8) {
    return `+506${digitsOnly}`;
  }

  if (digitsOnly.length === 11 && digitsOnly.startsWith('506')) {
    return `+${digitsOnly}`;
  }

  return '';
};

/**
 * Valida el campo de nombre completo del cliente
 */
export const validateFullName = (fullName: string): ClientValidationError | null => {
  if (!fullName || fullName.trim().length === 0) {
    return {
      field: 'fullName',
      message: 'El nombre completo es requerido'
    };
  }

  if (fullName.trim().length < 3) {
    return {
      field: 'fullName',
      message: 'El nombre debe tener al menos 3 caracteres'
    };
  }

  if (fullName.trim().length > 100) {
    return {
      field: 'fullName',
      message: 'El nombre no puede exceder 100 caracteres'
    };
  }

  // Validar caracteres permitidos
  const validNamePattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;
  if (!validNamePattern.test(fullName.trim())) {
    return {
      field: 'fullName',
      message: 'El nombre solo puede contener letras, espacios, guiones y apóstrofes'
    };
  }

  return null;
};

/**
 * Valida el campo de teléfono del cliente
 */
export const validatePhone = (phone: string): ClientValidationError | null => {
  if (!phone || phone.trim().length === 0) {
    return {
      field: 'phone',
      message: 'El teléfono es requerido'
    };
  }

  const normalizedPhone = normalizePhoneForStorage(phone);
  if (!normalizedPhone) {
    return {
      field: 'phone',
      message: 'El teléfono debe tener 8 dígitos de Costa Rica'
    };
  }

  const costaRicaPattern = /^\+506[2-9]\d{7}$/;
  if (!costaRicaPattern.test(normalizedPhone)) {
    return {
      field: 'phone',
      message: 'El formato para teléfonos de Costa Rica debe ser +506 seguido de 8 dígitos'
    };
  }

  return null;
};

/**
 * Valida el campo de dirección del cliente (opcional)
 */
export const validateAddress = (address: string): ClientValidationError | null => {
  // La dirección es opcional, pero si se proporciona debe validar
  if (address && address.trim().length > 0) {
    if (address.trim().length < 5) {
      return {
        field: 'address',
        message: 'La dirección debe tener al menos 5 caracteres si se proporciona'
      };
    }

    if (address.trim().length > 200) {
      return {
        field: 'address',
        message: 'La dirección no puede exceder 200 caracteres'
      };
    }
  }

  return null;
};

/**
 * Valida todos los campos del cliente
 */
export const validateClient = (client: Partial<Client>): ClientValidationResult => {
  const errors: ClientValidationError[] = [];

  const nameError = validateFullName(client.fullName || '');
  if (nameError) errors.push(nameError);

  const phoneError = validatePhone(client.phone || '');
  if (phoneError) errors.push(phoneError);

  const addressError = validateAddress(client.address || '');
  if (addressError) errors.push(addressError);

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Formatea el número de teléfono para mostrarlo consistentemente
 */
export const formatPhone = (phone: string): string => {
  const cleanPhone = normalizePhoneForStorage(phone) || phone.replace(/[\s\-\(\)]/g, '');
  
  // Formato para Costa Rica: +506 XXXX-XXXX
  if (cleanPhone.startsWith('+506') && cleanPhone.length === 12) {
    return `+506 ${cleanPhone.slice(4, 8)}-${cleanPhone.slice(8)}`;
  }
  
  // Formato general: mantener el formato original pero limpio
  if (cleanPhone.startsWith('+')) {
    return phone.replace(/[\s\-\(\)]/g, '');
  }
  
  return phone;
};

/**
 * Formatea el nombre completo para mostrarlo
 */
export const formatFullName = (fullName: string): string => {
  return fullName.trim().replace(/\s+/g, ' ');
};

/**
 * Verifica si un cliente tiene datos válidos (para validación rápida)
 */
export const isClientDataValid = (client: Partial<Client>): boolean => {
  const validation = validateClient(client);
  return validation.isValid;
};