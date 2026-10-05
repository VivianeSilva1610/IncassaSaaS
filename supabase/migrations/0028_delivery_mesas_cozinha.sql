-- Mesas (tables) identified by a QR code, a public menu customers can
-- order from without logging in, and comandas (tabs) that accumulate
-- orders for a table until it's settled at the end of the visit.

create table del_mesas (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  numero text not null,
  qr_token text not null unique default encode(gen_random_bytes(12), 'hex'),
  created_at timestamptz not null default now()
);

alter table del_mesas enable row level security;

create policy "del_owner_only" on del_mesas for all
  using (owner_id in (select public.del_effective_owner_ids()))
  with check (owner_id in (select public.del_effective_owner_ids()));

create table del_comandas (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  mesa_id uuid not null references del_mesas(id) on delete cascade,
  status text not null default 'aberta' check (status in ('aberta', 'fechada')),
  forma_pagamento text,
  created_at timestamptz not null default now(),
  fechada_em timestamptz
);

alter table del_comandas enable row level security;

create policy "del_owner_only" on del_comandas for all
  using (owner_id in (select public.del_effective_owner_ids()))
  with check (owner_id in (select public.del_effective_owner_ids()));

create or replace function public.check_comanda_ownership()
returns trigger as $$
begin
  if not exists (select 1 from del_mesas m where m.id = new.mesa_id and m.owner_id = new.owner_id) then
    raise exception 'mesa_id does not belong to owner_id';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger del_comandas_check_owner
  before insert or update on del_comandas
  for each row execute function public.check_comanda_ownership();

alter table del_orders add column if not exists mesa_id uuid references del_mesas(id) on delete set null;
alter table del_orders add column if not exists comanda_id uuid references del_comandas(id) on delete set null;

create or replace function public.check_order_mesa_ownership()
returns trigger as $$
begin
  if new.mesa_id is not null and not exists (
    select 1 from del_mesas m where m.id = new.mesa_id and m.owner_id = new.owner_id
  ) then
    raise exception 'mesa_id does not belong to owner_id';
  end if;
  if new.comanda_id is not null and not exists (
    select 1 from del_comandas c where c.id = new.comanda_id and c.owner_id = new.owner_id
  ) then
    raise exception 'comanda_id does not belong to owner_id';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger del_orders_check_mesa_owner
  before insert or update on del_orders
  for each row execute function public.check_order_mesa_ownership();
