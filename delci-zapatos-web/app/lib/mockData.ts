import { Account } from '@/app/components/dashboard/AccountsTableWithFilters';
import { Client } from '@/app/components/clientes/ClientsTable';

export const mockStats = {
  inventory: {
    total: 156,
    description: 'productos en inventario/bodega',
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

export const mockClients: Client[] = [
  {
    id: '001',
    name: 'María García',
    phone: '+506 8888-1234',
    totalProducts: 3,
  },
  {
    id: '002',
    name: 'Juan López',
    phone: '+506 8888-5678',
    totalProducts: 5,
  },
  {
    id: '003',
    name: 'Ana Martínez',
    phone: '+506 8888-9012',
    totalProducts: 2,
  },
  {
    id: '004',
    name: 'Carlos Rodríguez',
    phone: '+506 8888-3456',
    totalProducts: 4,
  },
  {
    id: '005',
    name: 'Sofía Hernández',
    phone: '+506 8888-7890',
    totalProducts: 1,
  },
  {
    id: '006',
    name: 'Luis Pérez',
    phone: '+506 8888-2345',
    totalProducts: 6,
  },
  {
    id: '007',
    name: 'Carmen Sánchez',
    phone: '+506 8888-6789',
    totalProducts: 2,
  },
  {
    id: '008',
    name: 'Roberto Díaz',
    phone: '+506 8888-0123',
    totalProducts: 3,
  },
];
