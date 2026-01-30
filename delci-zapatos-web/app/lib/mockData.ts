import { Account } from '@/app/components/dashboard/AccountsTableWithFilters';

export const mockStats = {
  inventory: {
    total: 156,
    description: 'productos en stock',
  },
  pendingAccounts: {
    total: 23,
    description: 'cuentas con pagos pendientes',
  },
  clients: {
    total: 89,
    description: 'Total de clientes',
  },
  paymentAlerts: {
    total: 7,
    description: 'cuentas con pagos proximos a vencer',
  },
};

export const mockAccounts: Account[] = [
  {
    id: '001',
    client: 'María García',
    productCount: 3,
    totalAmount: 1250.00,
    status: 'pending',
  },
  {
    id: '002',
    client: 'Juan López',
    productCount: 5,
    totalAmount: 2100.00,
    status: 'paid',
  },
  {
    id: '003',
    client: 'Ana Martínez',
    productCount: 2,
    totalAmount: 890.00,
    status: 'pending',
  },
  {
    id: '004',
    client: 'Carlos Rodríguez',
    productCount: 4,
    totalAmount: 1675.00,
    status: 'paid',
  },
  {
    id: '005',
    client: 'Sofía Hernández',
    productCount: 1,
    totalAmount: 450.00,
    status: 'pending',
  },
  {
    id: '006',
    client: 'Luis Pérez',
    productCount: 6,
    totalAmount: 2890.00,
    status: 'paid',
  },
  {
    id: '007',
    client: 'Carmen Sánchez',
    productCount: 2,
    totalAmount: 780.00,
    status: 'pending',
  },
  {
    id: '008',
    client: 'Roberto Díaz',
    productCount: 3,
    totalAmount: 1320.00,
    status: 'paid',
  },
];
