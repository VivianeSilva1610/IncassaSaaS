-- Estoque avançado, parte 1: perdas/desperdício como categoria própria de
-- movimento (em vez de só "ajuste" com texto livre), e inventário
-- (contagem física) que gera os ajustes/perdas automaticamente a partir da
-- diferença entre o que o sistema acha que tem e o que foi contado.

alter table del_stock_movements drop constraint del_stock_movements_tipo_check;
alter table del_stock_movements add constraint del_stock_movements_tipo_check
  check (tipo in ('entrada', 'saida', 'ajuste', 'perda'));

create table del_inventarios (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  realizado_por uuid not null references auth.users(id),
  realizado_por_email text,
  observacao text,
  created_at timestamptz not null default now()
);

create table del_inventario_itens (
  id uuid primary key default gen_random_uuid(),
  inventario_id uuid not null references del_inventarios(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  ingredient_id uuid not null references del_ingredients(id) on delete cascade,
  quantidade_sistema numeric(10, 3) not null,
  quantidade_contada numeric(10, 3) not null,
  diferenca numeric(10, 3) not null,
  created_at timestamptz not null default now()
);

alter table del_inventarios enable row level security;
create policy "del_owner_only" on del_inventarios for all
  using (owner_id in (select public.del_effective_owner_ids()))
  with check (owner_id in (select public.del_effective_owner_ids()));

alter table del_inventario_itens enable row level security;
create policy "del_owner_only" on del_inventario_itens for all
  using (owner_id in (select public.del_effective_owner_ids()))
  with check (owner_id in (select public.del_effective_owner_ids()));

create index del_inventarios_owner_created_idx on del_inventarios (owner_id, created_at desc);
create index del_inventario_itens_inventario_idx on del_inventario_itens (inventario_id);
