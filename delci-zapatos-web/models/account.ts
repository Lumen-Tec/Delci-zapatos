import type { ProductSize } from '@/models/product';

export type AccountItemBase = {
  id: string;
  productId?: string;
  productSizeId?: string;
  productName: string;
  category: string;
  color?: string;
  size?: string;
  quantity: number;
  unitPrice: number;
  originalPrice?: number;
  discountPct?: number;
};

export type AccountItem = AccountItemBase;

export type AccountPayment = {
  id: string;
  accountId: string;
  amount: number;
  paymentDate: string;
  createdAt?: string;
};

export interface Account {
  id: string;
  clientId: string;
  initialBalance: number;
  quincenalAmount: number;
  detail?: string;
  nextPaymentDate: string;
  status: 'activa' | 'pagada' | 'atrasada';
  createdAt?: string;
  items?: AccountItem[];
  payments?: AccountPayment[];
}
