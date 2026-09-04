/*=========================================
- Creación de Tablas Delci Zapatos
- Autor: Yosimar Montenegro - Para Lumentec: Delci Zapatos Gestor

=========================================*/

-- Clients: Tabla independiente, no depende de otras.
create table clients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  address text not null,
  created_at timestamptz default now()
);

-- accounts — next_payment_date se calcula al crear (próximo 15 o 30) del mes actual
--    status guardado para facilitar filtros en el dashboard
create table accounts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id),
  initial_balance numeric(10,2) default 0,
  quincenal_amount numeric(10,2) not null,
  detail text,
  next_payment_date date not null,
  status text not null default 'activa'
    check (status in ('activa', 'pagada', 'atrasada')),
  created_at timestamptz default now()
);

-- account_payments
create table account_payments (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  amount numeric(10,2) not null,
  payment_date date not null,
  created_at timestamptz default now()
);

-- account_charges
create table account_charges (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  description text not null,
  amount numeric(10,2) not null,
  charge_date date not null,
  created_at timestamptz default now()
);
