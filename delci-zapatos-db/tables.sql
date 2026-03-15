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

-- products: bolsos usan stock/discount directamente;
--    zapatos los manejan en product_sizes
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text,
  category text not null check (category in ('zapatos', 'bolsos')),
  base_price numeric(10,2) not null,
  color text,
  discount_pct numeric(5,2),
  discount_days int,
  discount_start date,
  stock int default 0,
  is_active boolean default false,
  created_at timestamptz default now()
);

-- product_sizes — solo para zapatos
--    price nullable: si es null se usa base_price del producto
create table product_sizes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  size text not null,
  price numeric(10,2),
  stock int not null default 0,
  discount_pct numeric(5,2),
  discount_days int,
  discount_start date
);

-- accounts — next_payment_date se calcula al crear (próximo 15 o 30)
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

-- account_items — precio congelado al momento de agregar
--    product_name, category, size como texto para preservar historial
--    product_size_id nullable (bolsos no tienen talla)
--    original_price guarda precio sin descuento (para mostrarlo tachado)
create table account_items (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_size_id uuid references product_sizes(id) on delete set null,
  product_name text not null,
  category text not null,
  color text, -- Historical, para mostrarlo aunque el producto cambie
  size text,
  quantity int not null default 1,
  unit_price numeric(10,2) not null,
  original_price numeric(10,2),
  discount_pct numeric(5,2)
);

-- account_payments
create table account_payments (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  amount numeric(10,2) not null,
  payment_date date not null,
  created_at timestamptz default now()
);
