-- Phase 2a: del_pricing_config stops being a single global row and becomes
-- one row per tenant, keyed by owner_id (same pattern as `profiles`).
alter table del_pricing_config add column if not exists owner_id uuid references auth.users(id) on delete cascade;
update del_pricing_config set owner_id = (select id from auth.users where email = 'viroedu@gmail.com') where owner_id is null;
alter table del_pricing_config alter column owner_id set not null;
alter table del_pricing_config alter column owner_id set default auth.uid();

alter table del_pricing_config drop constraint if exists del_pricing_config_pkey;
alter table del_pricing_config drop column if exists id;
alter table del_pricing_config add primary key (owner_id);

drop policy "del_owner_only" on del_pricing_config;
create policy "del_owner_only" on del_pricing_config for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Phase 2b: revert migration 0017's link from del_orders to the INCASSA
-- `clients` table. A restaurant-SaaS tenant won't necessarily have an
-- INCASSA account, so a delivery order can't depend on it. Back to
-- free-text customer name/phone only (cliente_nome/cliente_telefone,
-- already on del_orders since 0013).
alter table del_orders drop column if exists cliente_id;
