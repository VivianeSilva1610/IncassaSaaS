-- Defesa em profundidade: a equipe so acessa no banco os modulos atribuídos.
create or replace function commerce_tem_modulo(p_modulo text)
returns boolean language sql stable security definer set search_path=public as $$
  select case
    when exists(select 1 from commerce_businesses where owner_id=auth.uid()) then true
    else exists(
      select 1 from commerce_staff s
      where s.owner_id=commerce_owner_atual()
        and lower(s.email)=lower(coalesce(auth.jwt()->>'email',''))
        and (p_modulo=any(s.modulos) or (p_modulo='gerencia' and s.gerente))
    )
  end;
$$;
revoke all on function commerce_tem_modulo(text) from public,anon;
grant execute on function commerce_tem_modulo(text) to authenticated;

do $$
declare r record; pol record;
begin
 for r in select * from (values
  ('commerce_products','produtos|compras|estoque|vendas'),
  ('commerce_product_price_history','produtos|compras'),
  ('commerce_suppliers','compras'),
  ('commerce_stock_entries','compras'),
  ('commerce_stock_entry_items','compras'),
  ('commerce_inventory_movements','estoque|compras|vendas'),
  ('commerce_inventory_counts','estoque'),
  ('commerce_inventory_count_items','estoque'),
  ('commerce_customers','clientes|vendas'),
  ('commerce_sales','vendas|financeiro'),
  ('commerce_sale_items','vendas|financeiro'),
  ('commerce_sale_payments','vendas|financeiro'),
  ('commerce_sale_returns','vendas|financeiro'),
  ('commerce_sale_return_items','vendas|financeiro'),
  ('commerce_accounts_receivable','financeiro|vendas'),
  ('commerce_accounts_payable','financeiro|compras'),
  ('commerce_account_settlements','financeiro'),
  ('commerce_cash_movements','financeiro|vendas'),
  ('commerce_cash_sessions','financeiro'),
  ('commerce_fiscal_settings','fiscal')
 ) as x(tabela,modulos)
 loop
  for pol in select policyname from pg_policies where schemaname='public' and tablename=r.tabela loop
   execute format('drop policy if exists %I on %I',pol.policyname,r.tabela);
  end loop;
  execute format(
   'create policy %I on %I for all to authenticated using(owner_id=commerce_owner_atual() and (%s)) with check(owner_id=commerce_owner_atual() and (%s))',
   r.tabela||'_module_access',r.tabela,
   (select string_agg(format('commerce_tem_modulo(%L)',m),' or ') from unnest(string_to_array(r.modulos,'|')) m),
   (select string_agg(format('commerce_tem_modulo(%L)',m),' or ') from unnest(string_to_array(r.modulos,'|')) m)
  );
 end loop;
end $$;

drop policy if exists commerce_activity_log_select on commerce_activity_log;
drop policy if exists commerce_activity_log_insert on commerce_activity_log;
create policy commerce_activity_log_select on commerce_activity_log for select to authenticated
  using(owner_id=commerce_owner_atual() and commerce_tem_modulo('gerencia'));
create policy commerce_activity_log_insert on commerce_activity_log for insert to authenticated
  with check(owner_id=commerce_owner_atual());
