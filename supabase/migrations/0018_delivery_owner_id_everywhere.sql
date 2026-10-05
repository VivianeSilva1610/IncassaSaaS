-- Phase 0 of converting the delivery module to a real multi-tenant SaaS.
-- Adds owner_id to the del_* tables that don't have it yet, backfills
-- existing rows to Viviane's own account (the only tenant so far), and adds
-- ownership-validation triggers — same defense-in-depth pattern as
-- supabase/migrations/0008_client_ownership_trigger.sql, which exists
-- because RLS alone never validates a foreign key's ownership chain.
-- Purely additive: RLS policies still check the fixed email, so nothing
-- observable changes yet (see 0019 for the RLS swap).

alter table del_order_items add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table del_product_ingredients add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table del_daily_menu add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table del_fixed_costs add column if not exists owner_id uuid references auth.users(id) on delete cascade;

update del_order_items set owner_id = (select id from auth.users where email = 'viroedu@gmail.com') where owner_id is null;
update del_product_ingredients set owner_id = (select id from auth.users where email = 'viroedu@gmail.com') where owner_id is null;
update del_daily_menu set owner_id = (select id from auth.users where email = 'viroedu@gmail.com') where owner_id is null;
update del_fixed_costs set owner_id = (select id from auth.users where email = 'viroedu@gmail.com') where owner_id is null;

alter table del_order_items alter column owner_id set not null;
alter table del_product_ingredients alter column owner_id set not null;
alter table del_daily_menu alter column owner_id set not null;
alter table del_fixed_costs alter column owner_id set not null;

alter table del_order_items alter column owner_id set default auth.uid();
alter table del_product_ingredients alter column owner_id set default auth.uid();
alter table del_daily_menu alter column owner_id set default auth.uid();
alter table del_fixed_costs alter column owner_id set default auth.uid();

create or replace function public.check_order_item_ownership()
returns trigger as $$
begin
  if not exists (
    select 1 from del_orders o where o.id = new.order_id and o.owner_id = new.owner_id
  ) then
    raise exception 'order_id does not belong to owner_id';
  end if;
  if new.product_id is not null and not exists (
    select 1 from del_products p where p.id = new.product_id and p.owner_id = new.owner_id
  ) then
    raise exception 'product_id does not belong to owner_id';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger del_order_items_check_owner
  before insert or update on del_order_items
  for each row execute function public.check_order_item_ownership();

create or replace function public.check_product_ingredient_ownership()
returns trigger as $$
begin
  if not exists (
    select 1 from del_products p where p.id = new.product_id and p.owner_id = new.owner_id
  ) then
    raise exception 'product_id does not belong to owner_id';
  end if;
  if not exists (
    select 1 from del_ingredients i where i.id = new.ingredient_id and i.owner_id = new.owner_id
  ) then
    raise exception 'ingredient_id does not belong to owner_id';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger del_product_ingredients_check_owner
  before insert or update on del_product_ingredients
  for each row execute function public.check_product_ingredient_ownership();

create or replace function public.check_daily_menu_ownership()
returns trigger as $$
begin
  if not exists (
    select 1 from del_products p where p.id = new.product_id and p.owner_id = new.owner_id
  ) then
    raise exception 'product_id does not belong to owner_id';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger del_daily_menu_check_owner
  before insert or update on del_daily_menu
  for each row execute function public.check_daily_menu_ownership();

create or replace function public.check_stock_movement_ownership()
returns trigger as $$
begin
  if not exists (
    select 1 from del_ingredients i where i.id = new.ingredient_id and i.owner_id = new.owner_id
  ) then
    raise exception 'ingredient_id does not belong to owner_id';
  end if;
  if new.order_id is not null and not exists (
    select 1 from del_orders o where o.id = new.order_id and o.owner_id = new.owner_id
  ) then
    raise exception 'order_id does not belong to owner_id';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger del_stock_movements_check_owner
  before insert or update on del_stock_movements
  for each row execute function public.check_stock_movement_ownership();
