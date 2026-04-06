import { Account, AccountPayment } from '@/models/account';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    minimumFractionDigits: 2,
  }).format(amount);
};

const normalizeAmountInput = (value: string) => {
  let cleaned = value.replace(/\s+/g, '').replace(/,/g, '.').replace(/[^\d.]/g, '');
  const firstDotIndex = cleaned.indexOf('.');

  if (firstDotIndex >= 0) {
    cleaned = `${cleaned.slice(0, firstDotIndex + 1)}${cleaned.slice(firstDotIndex + 1).replace(/\./g, '')}`;
  }

  const [rawIntegerPart = '', rawDecimalPart] = cleaned.split('.');
  const integerPart = rawIntegerPart.replace(/^0+(?=\d)/, '');
  const safeIntegerPart = integerPart || (cleaned.startsWith('.') ? '0' : '');

  if (rawDecimalPart === undefined) {
    return safeIntegerPart;
  }

  const decimalPart = rawDecimalPart.slice(0, 2);
  return `${safeIntegerPart}.${decimalPart}`;
};

const formatAmountWithSpaces = (value: string | number) => {
  const normalized = normalizeAmountInput(String(value));
  if (!normalized) return '';

  const [integerPart, decimalPart] = normalized.split('.');
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  if (decimalPart === undefined) {
    return formattedInteger;
  }

  return `${formattedInteger}.${decimalPart}`;
};

const parseAmountInput = (value: string) => {
  const normalized = normalizeAmountInput(value);
  if (!normalized || normalized === '.') {
    return Number.NaN;
  }
  return Number(normalized);
};

const todayISO = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const addDaysISO = (dateISO: string, days: number) => {
  const d = new Date(`${dateISO}T00:00:00`);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const dy = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${dy}`;
};

const toDateOnly = (value: string) => new Date(`${value}T00:00:00`);

const toISODate = (value: Date) => {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, '0');
  const d = String(value.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const isAllowedPaymentDay = (dateISO: string) => {
  const day = toDateOnly(dateISO).getDate();
  return day === 15 || day === 30;
};

const getNextPaymentDateFrom = (dateISO: string) => {
  const current = toDateOnly(dateISO);
  const year = current.getFullYear();
  const month = current.getMonth();
  const day = current.getDate();

  if (day < 15) {
    return toISODate(new Date(year, month, 15));
  }

  if (day < 30) {
    return toISODate(new Date(year, month, 30));
  }

  return toISODate(new Date(year, month + 1, 15));
};

const getNearestUpcomingPaymentDate = (referenceDateISO = todayISO()) => {
  const referenceDate = toDateOnly(referenceDateISO);
  const normalizedReference = toISODate(referenceDate);

  if (isAllowedPaymentDay(normalizedReference)) {
    return normalizedReference;
  }

  return getNextPaymentDateFrom(normalizedReference);
};

const computeStatus = (remainingAmount: number, nextPaymentDate?: string) => {
  if (remainingAmount <= 0) return 'pagada' as const;

  if (nextPaymentDate) {
    const today = todayISO();
    if (nextPaymentDate < today) return 'atrasada' as const;
  }

  return 'activa' as const;
};

export {
  formatCurrency,
  formatAmountWithSpaces,
  normalizeAmountInput,
  parseAmountInput,
  todayISO,
  addDaysISO,
  isAllowedPaymentDay,
  getNextPaymentDateFrom,
  getNearestUpcomingPaymentDate,
  computeStatus,
};
export type { Account, AccountPayment };
