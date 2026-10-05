-- Staff access: lets the restaurant owner authorize other people (by email)
-- to log in and work inside their restaurant data — e.g. Viviane's own
-- employees, who each get a real account but act on HER restaurant, not
-- their own separate tenant.

create table del_staff (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  nome text,
  created_at timestamptz not null default now(),
  unique (owner_id, email)
);

alter table del_staff enable row level security;

-- A staff member needs to read their own row (to resolve which owner they
-- act for); only the owner can add/remove staff.
create policy "del_staff_select" on del_staff for select
  using (owner_id = auth.uid() or email = (auth.jwt() ->> 'email'));

create policy "del_staff_manage" on del_staff for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Returns the set of owner_id values the current session may act as:
-- themselves, plus any restaurant they're registered staff for.
create or replace function public.del_effective_owner_ids()
returns setof uuid
language sql stable security definer set search_path = public
as $$
  select auth.uid()
  union
  select owner_id from del_staff where email = (auth.jwt() ->> 'email')
$$;

drop policy "del_owner_only" on del_ingredients;
create policy "del_owner_only" on del_ingredients for all
  using (owner_id in (select public.del_effective_owner_ids()))
  with check (owner_id in (select public.del_effective_owner_ids()));

drop policy "del_owner_only" on del_products;
create policy "del_owner_only" on del_products for all
  using (owner_id in (select public.del_effective_owner_ids()))
  with check (owner_id in (select public.del_effective_owner_ids()));

drop policy "del_owner_only" on del_orders;
create policy "del_owner_only" on del_orders for all
  using (owner_id in (select public.del_effective_owner_ids()))
  with check (owner_id in (select public.del_effective_owner_ids()));

drop policy "del_owner_only" on del_stock_movements;
create policy "del_owner_only" on del_stock_movements for all
  using (owner_id in (select public.del_effective_owner_ids()))
  with check (owner_id in (select public.del_effective_owner_ids()));

drop policy "del_owner_only" on del_order_items;
create policy "del_owner_only" on del_order_items for all
  using (owner_id in (select public.del_effective_owner_ids()))
  with check (owner_id in (select public.del_effective_owner_ids()));

drop policy "del_owner_only" on del_product_ingredients;
create policy "del_owner_only" on del_product_ingredients for all
  using (owner_id in (select public.del_effective_owner_ids()))
  with check (owner_id in (select public.del_effective_owner_ids()));

drop policy "del_owner_only" on del_daily_menu;
create policy "del_owner_only" on del_daily_menu for all
  using (owner_id in (select public.del_effective_owner_ids()))
  with check (owner_id in (select public.del_effective_owner_ids()));

drop policy "del_owner_only" on del_fixed_costs;
create policy "del_owner_only" on del_fixed_costs for all
  using (owner_id in (select public.del_effective_owner_ids()))
  with check (owner_id in (select public.del_effective_owner_ids()));

drop policy "del_owner_only" on del_pricing_config;
create policy "del_owner_only" on del_pricing_config for all
  using (owner_id in (select public.del_effective_owner_ids()))
  with check (owner_id in (select public.del_effective_owner_ids()));

drop policy "del_owner_only" on del_caixa_movimentos;
create policy "del_owner_only" on del_caixa_movimentos for all
  using (owner_id in (select public.del_effective_owner_ids()))
  with check (owner_id in (select public.del_effective_owner_ids()));

-- Track which logged-in person actually registered each cash movement —
-- directly relevant now that 3 different people can close the register.
alter table del_caixa_movimentos add column if not exists operador_email text;

-- Pre-authorize Viviane's two employees for her own restaurant.
insert into del_staff (owner_id, email)
values
  ((select id from auth.users where email = 'viroedu@gmail.com'), 'kolia_90@hotmail.com'),
  ((select id from auth.users where email = 'viroedu@gmail.com'), 'vivianemiriane_21@hotmail.com')
on conflict (owner_id, email) do nothing;
