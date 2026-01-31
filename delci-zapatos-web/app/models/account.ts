import type { BagClassification, ShoeClassification, ShoeSize } from '@/app/models/products';

export type AccountItemBase = {
  id: string;
  productId?: string;
  sku?: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

export type ShoeAccountItem = AccountItemBase &
  ShoeClassification & {
    category: 'zapatos';
    color: string;
    size: ShoeSize;
  };

export type BagAccountItem = AccountItemBase &
  BagClassification & {
    category: 'bolsos';
  };

export type AccountItem = ShoeAccountItem | BagAccountItem;

export interface Account {
  id: string;
  clientId: string;
  clientName: string;
  totalAmount: number;
  totalPaid: number;
  remainingAmount: number;
  totalProducts: number;
  items?: AccountItem[];
  status: 'active' | 'paid' | 'overdue';
  lastPaymentDate?: string;
  nextPaymentDate?: string;
}
