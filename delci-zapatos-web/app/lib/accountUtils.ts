import { Account, AccountPayment } from '@/app/models/account';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    minimumFractionDigits: 2,
  }).format(amount);
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const addDaysISO = (dateISO: string, days: number) => {
  const d = new Date(dateISO);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const toDateOnly = (value: string) => new Date(`${value}T00:00:00`);

const toISODate = (value: Date) => {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next.toISOString().slice(0, 10);
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
