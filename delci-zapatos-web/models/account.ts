import type { ShoeSize } from '@/models/product';

export type AccountItemBase = {
  id: string;
  productId?: string;
  sku?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  originalPrice?: number;
  discountPercentage?: number;
};

export type ShoeAccountItem = AccountItemBase & {
  category: 'zapatos';
  color: string;
  size: ShoeSize;
  // Compatibilidad con datos legacy guardados previamente.
  group?: string;
  subcategory?: string;
};

export type BagAccountItem = AccountItemBase & {
  category: 'bolsos';
  // Compatibilidad con datos legacy guardados previamente.
  group?: string;
  subcategory?: string;
};

export type AccountItem = ShoeAccountItem | BagAccountItem;

export type AccountPayment = {
  id: string;
  date: string;
  amount: number;
};

export interface Account {
  id: string;
  clientId: string;
  clientName: string;
  createdAt?: string;
  totalAmount: number;
  totalPaid: number;
  remainingAmount: number;
  totalProducts: number;
  items?: AccountItem[];
  status: 'active' | 'paid' | 'overdue';
  lastPaymentDate?: string;
  nextPaymentDate?: string;
  biweeklyAmount?: number;
  payments?: AccountPayment[];
}
