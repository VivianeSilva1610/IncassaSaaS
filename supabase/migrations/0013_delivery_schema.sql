-- Internal-only module for Viviane's own food delivery business.
-- Deliberately isolated from the INCASSA SaaS schema: no foreign keys into
-- clients/invoices/uscite/pagamenti/profiles/purchases, dedicated "del_"
-- prefix, and RLS locked to a single fixed email rather than a generic
-- auth.uid() check — any authenticated INCASSA paying customer is also a
-- valid Supabase Auth user in this same project, so a generic policy would
-- let them read/write here too.

create table del_ingredients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome text not null,
  unidade text not null,
  quantidade_atual numeric(10, 3) not null default 0,
  estoque_minimo numeric(10, 3),
  created_at timestamptz not null default now()
);

create table del_products (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome text not null,
  descrizione text,
  preco numeric(10, 2) not null,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table del_orders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  cliente_nome text,
  cliente_telefone text,
  canal text not null default 'telefone',
  status text not null default 'novo',
  totale numeric(10, 2) not null default 0,
  note text,
  created_at timestamptz not null default now()
);

create table del_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references del_orders(id) on delete cascade,
  product_id uuid references del_products(id) on delete set null,
  quantidade numeric(10, 2) not null,
  preco_unitario numeric(10, 2) not null,
  created_at timestamptz not null default now()
);

create table del_stock_movements (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  ingredient_id uuid not null references del_ingredients(id) on delete cascade,
  tipo text not null check (tipo in ('entrada', 'saida', 'ajuste')),
  quantidade numeric(10, 3) not null,
  motivo text,
  order_id uuid references del_orders(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table del_ingredients enable row level security;
alter table del_products enable row level security;
alter table del_orders enable row level security;
alter table del_order_items enable row level security;
alter table del_stock_movements enable row level security;

create policy "del_owner_only" on del_ingredients for all
  using ((auth.jwt() ->> 'email') = 'viroedu@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'viroedu@gmail.com');

create policy "del_owner_only" on del_products for all
  using ((auth.jwt() ->> 'email') = 'viroedu@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'viroedu@gmail.com');

create policy "del_owner_only" on del_orders for all
  using ((auth.jwt() ->> 'email') = 'viroedu@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'viroedu@gmail.com');

create policy "del_owner_only" on del_order_items for all
  using ((auth.jwt() ->> 'email') = 'viroedu@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'viroedu@gmail.com');

create policy "del_owner_only" on del_stock_movements for all
  using ((auth.jwt() ->> 'email') = 'viroedu@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'viroedu@gmail.com');
