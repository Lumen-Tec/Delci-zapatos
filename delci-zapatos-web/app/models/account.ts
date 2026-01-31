export interface Account {
  id: string;
  clientId: string;
  clientName: string;
  totalAmount: number;
  totalPaid: number;
  remainingAmount: number;
  totalProducts: number;
  status: 'active' | 'paid' | 'overdue';
  lastPaymentDate?: string;
  nextPaymentDate?: string;
}
