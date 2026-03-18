import { Account, AccountPayment } from '@/models/account';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    minimumFractionDigits: 2,
  }).format(amount);
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
  if (remainingAmount <= 0) return 'paid' as const;

  if (nextPaymentDate) {
    const today = todayISO();
    if (nextPaymentDate < today) return 'overdue' as const;
  }

  return 'active' as const;
};

export {
  formatCurrency,
  todayISO,
  addDaysISO,
  isAllowedPaymentDay,
  getNextPaymentDateFrom,
  getNearestUpcomingPaymentDate,
  computeStatus,
};
export type { Account, AccountPayment };
