-- Acesso multi-tenant da equipe. O helper resolve o proprietário efetivo
-- pelo usuário autenticado ou pelo e-mail cadastrado em commerce_staff.

create or replace function commerce_owner_atual()
returns uuid language sql stable security definer set search_path=public as $$
  select coalesce(
    (select b.owner_id from commerce_businesses b where b.owner_id=(select auth.uid()) limit 1),
    (select s.owner_id from commerce_staff s where lower(s.email)=lower(coalesce((select auth.jwt()->>'email'),'')) limit 1)
  );
$$;
revoke all on function commerce_owner_atual() from public,anon;
grant execute on function commerce_owner_atual() to authenticated;

do $$ declare t text; begin
  foreach t in array array[
    'commerce_businesses','commerce_suppliers','commerce_products','commerce_stock_entries',
    'commerce_stock_entry_items','commerce_inventory_movements','commerce_fiscal_settings',
    'commerce_customers','commerce_sales','commerce_sale_items','commerce_sale_payments'
  ] loop
    execute format('drop policy if exists %I on %I', t||'_owner', t);
    execute format('create policy %I on %I for all using (owner_id=commerce_owner_atual()) with check (owner_id=commerce_owner_atual())', t||'_tenant', t);
  end loop;
end $$;

drop policy if exists commerce_staff_owner on commerce_staff;
drop policy if exists commerce_staff_self_read on commerce_staff;
create policy commerce_staff_tenant_read on commerce_staff for select
  using (owner_id=commerce_owner_atual());
create policy commerce_staff_owner_write on commerce_staff for all
  using (owner_id=(select auth.uid())) with check (owner_id=(select auth.uid()));

drop policy if exists commerce_subscriptions_owner on commerce_subscriptions;
create policy commerce_subscriptions_tenant_read on commerce_subscriptions for select
  using (user_id=commerce_owner_atual());
