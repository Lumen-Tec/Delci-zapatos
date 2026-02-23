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

const computeStatus = (remainingAmount: number, nextPaymentDate?: string) => {
  if (remainingAmount <= 0) return 'paid' as const;

  if (nextPaymentDate) {
    const today = todayISO();
    if (nextPaymentDate < today) return 'overdue' as const;
  }

  return 'active' as const;
};

export { formatCurrency, todayISO, addDaysISO, computeStatus };
export type { Account, AccountPayment };
