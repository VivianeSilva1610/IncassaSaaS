-- Schema preparation for the delivery module's future phases (ficha técnica/
-- custo, menu diário, caixa, CRM básico), per Viviane's explicit request to
-- design the data model ahead of time even though the UI for these isn't
-- being built yet. Deliberately NOT included here: mesas/comandas (needs a
-- physical location that doesn't exist yet) and anything multi-tenant
-- (there's exactly one business using this; see 0013's comment on why a
-- generic auth.uid() policy would be unsafe here anyway).

-- Ficha técnica: cost of an ingredient, and which ingredients a product consumes.
alter table del_ingredients add column if not exists custo_unitario numeric(10, 2);

create table del_product_ingredients (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references del_products(id) on delete cascade,
  ingredient_id uuid not null references del_ingredients(id) on delete cascade,
  quantidade_necessaria numeric(10, 3) not null,
  created_at timestamptz not null default now(),
  unique (product_id, ingredient_id)
);

-- Menu diário: what's being offered today and how much is left before "esaurito".
create table del_daily_menu (
  id uuid primary key default gen_random_uuid(),
  data date not null default current_date,
  product_id uuid not null references del_products(id) on delete cascade,
  quantidade_disponivel numeric(10, 2) not null,
  quantidade_vendida numeric(10, 2) not null default 0,
  created_at timestamptz not null default now(),
  unique (data, product_id)
);

-- Caixa: cash movements beyond order totals (expenses, manual entries).
create table del_caixa_movimentos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('entrada', 'saida')),
  categoria text not null default 'altro',
  valor numeric(10, 2) not null,
  descrizione text,
  data date not null default current_date,
  created_at timestamptz not null default now()
);

-- CRM básico: customer records, linked optionally from orders.
create table del_customers (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text,
  email text,
  created_at timestamptz not null default now()
);

alter table del_orders add column if not exists customer_id uuid references del_customers(id) on delete set null;

alter table del_product_ingredients enable row level security;
alter table del_daily_menu enable row level security;
alter table del_caixa_movimentos enable row level security;
alter table del_customers enable row level security;

create policy "del_owner_only" on del_product_ingredients for all
  using ((auth.jwt() ->> 'email') = 'viroedu@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'viroedu@gmail.com');

create policy "del_owner_only" on del_daily_menu for all
  using ((auth.jwt() ->> 'email') = 'viroedu@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'viroedu@gmail.com');

create policy "del_owner_only" on del_caixa_movimentos for all
  using ((auth.jwt() ->> 'email') = 'viroedu@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'viroedu@gmail.com');

create policy "del_owner_only" on del_customers for all
  using ((auth.jwt() ->> 'email') = 'viroedu@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'viroedu@gmail.com');
