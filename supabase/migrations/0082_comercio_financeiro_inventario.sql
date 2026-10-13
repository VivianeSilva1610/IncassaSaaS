-- Financeiro e inventário do INCASSA Comércio.
-- Venda (competência), pagamento (caixa) e movimento manual são fontes separadas.

create table commerce_accounts_receivable (
  id uuid primary key default gen_random_uuid(), business_id uuid not null, owner_id uuid not null,
  sale_id uuid, customer_id uuid, descricao text not null, valor numeric(14,2) not null check(valor>0),
  vencimento date not null, status text not null default 'aberta' check(status in('aberta','paga','cancelada','vencida')),
  paga_em timestamptz, created_at timestamptz not null default now(), unique(id,business_id,owner_id),
  foreign key(business_id,owner_id) references commerce_businesses(id,owner_id) on delete cascade,
  foreign key(sale_id,business_id,owner_id) references commerce_sales(id,business_id,owner_id),
  foreign key(customer_id,business_id,owner_id) references commerce_customers(id,business_id,owner_id)
);

create table commerce_accounts_payable (
  id uuid primary key default gen_random_uuid(), business_id uuid not null, owner_id uuid not null,
  supplier_id uuid, entry_id uuid, descricao text not null, valor numeric(14,2) not null check(valor>0),
  vencimento date not null, status text not null default 'aberta' check(status in('aberta','paga','cancelada','vencida')),
  paga_em timestamptz, created_at timestamptz not null default now(), unique(id,business_id,owner_id),
  foreign key(business_id,owner_id) references commerce_businesses(id,owner_id) on delete cascade,
  foreign key(supplier_id,business_id,owner_id) references commerce_suppliers(id,business_id,owner_id),
  foreign key(entry_id,business_id,owner_id) references commerce_stock_entries(id,business_id,owner_id)
);

create table commerce_cash_movements (
  id uuid primary key default gen_random_uuid(), business_id uuid not null, owner_id uuid not null,
  tipo text not null check(tipo in('entrada_manual','saida_manual','aporte','retirada')),
  descricao text not null, valor numeric(14,2) not null check(valor>0), ocorrido_em timestamptz not null default now(),
  created_by uuid not null default auth.uid() references auth.users(id), created_at timestamptz not null default now(),
  foreign key(business_id,owner_id) references commerce_businesses(id,owner_id) on delete cascade
);

create table commerce_inventory_counts (
  id uuid primary key default gen_random_uuid(), business_id uuid not null, owner_id uuid not null,
  status text not null default 'aberto' check(status in('aberto','concluido','cancelado')),
  observacoes text, concluido_em timestamptz, created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(), unique(id,business_id,owner_id),
  foreign key(business_id,owner_id) references commerce_businesses(id,owner_id) on delete cascade
);

create table commerce_inventory_count_items (
  id uuid primary key default gen_random_uuid(), count_id uuid not null, business_id uuid not null, owner_id uuid not null,
  product_id uuid not null, saldo_sistema numeric(14,4) not null, saldo_contado numeric(14,4) not null check(saldo_contado>=0),
  diferenca numeric(14,4) generated always as(saldo_contado-saldo_sistema) stored,
  foreign key(count_id,business_id,owner_id) references commerce_inventory_counts(id,business_id,owner_id) on delete cascade,
  foreign key(product_id,business_id,owner_id) references commerce_products(id,business_id,owner_id), unique(count_id,product_id)
);

create index commerce_receivable_due_idx on commerce_accounts_receivable(business_id,status,vencimento);
create index commerce_payable_due_idx on commerce_accounts_payable(business_id,status,vencimento);
create index commerce_cash_date_idx on commerce_cash_movements(business_id,ocorrido_em desc);
create index commerce_inventory_count_idx on commerce_inventory_counts(business_id,created_at desc);

alter table commerce_accounts_receivable enable row level security; alter table commerce_accounts_payable enable row level security;
alter table commerce_cash_movements enable row level security; alter table commerce_inventory_counts enable row level security;
alter table commerce_inventory_count_items enable row level security;
create policy commerce_receivable_tenant on commerce_accounts_receivable for all using(owner_id=commerce_owner_atual()) with check(owner_id=commerce_owner_atual());
create policy commerce_payable_tenant on commerce_accounts_payable for all using(owner_id=commerce_owner_atual()) with check(owner_id=commerce_owner_atual());
create policy commerce_cash_tenant on commerce_cash_movements for all using(owner_id=commerce_owner_atual()) with check(owner_id=commerce_owner_atual());
create policy commerce_inventory_counts_tenant on commerce_inventory_counts for all using(owner_id=commerce_owner_atual()) with check(owner_id=commerce_owner_atual());
create policy commerce_inventory_items_tenant on commerce_inventory_count_items for all using(owner_id=commerce_owner_atual()) with check(owner_id=commerce_owner_atual());

create or replace function commerce_concluir_venda(p_sale_id uuid,p_pagamentos jsonb)
returns void language plpgsql security invoker set search_path=public as $$
declare v_sale commerce_sales%rowtype;v_item commerce_sale_items%rowtype;v_payment jsonb;v_cash numeric(14,2):=0;v_credit numeric(14,2):=0;v_value numeric(14,2);v_form text;
begin
 select * into v_sale from commerce_sales where id=p_sale_id and owner_id=commerce_owner_atual() for update;
 if not found then raise exception 'Venda não encontrada.';end if;if v_sale.status<>'aberta' then raise exception 'A venda não está aberta.';end if;
 for v_item in select * from commerce_sale_items where sale_id=p_sale_id loop
  perform 1 from commerce_products where id=v_item.product_id and estoque_atual>=v_item.quantidade for update;
  if not found then raise exception 'Estoque insuficiente para %.',v_item.descricao;end if;
  update commerce_products set estoque_atual=estoque_atual-v_item.quantidade,updated_at=now() where id=v_item.product_id;
  insert into commerce_inventory_movements(business_id,owner_id,product_id,tipo,quantidade,custo_unitario,referencia_externa) values(v_sale.business_id,v_sale.owner_id,v_item.product_id,'saida_venda',v_item.quantidade,v_item.custo_unitario_snapshot,v_sale.id::text);
 end loop;
 for v_payment in select value from jsonb_array_elements(p_pagamentos) loop
  v_form:=v_payment->>'forma';v_value:=(v_payment->>'valor')::numeric;
  insert into commerce_sale_payments(sale_id,business_id,owner_id,forma,valor,status,confirmado_em) values(v_sale.id,v_sale.business_id,v_sale.owner_id,v_form,v_value,case when v_form='crediario' then 'pendente' else 'confirmado' end,case when v_form='crediario' then null else now() end);
  if v_form='crediario' then v_credit:=v_credit+v_value;else v_cash:=v_cash+v_value;end if;
 end loop;
 if v_cash+v_credit<v_sale.total then raise exception 'O pagamento é menor que o total da venda.';end if;
 if v_credit>0 then insert into commerce_accounts_receivable(business_id,owner_id,sale_id,customer_id,descricao,valor,vencimento) values(v_sale.business_id,v_sale.owner_id,v_sale.id,v_sale.customer_id,'Crediário da venda #'||v_sale.numero,v_credit,current_date+interval '30 days');end if;
 update commerce_sales set status='concluida',valor_pago=v_cash,competencia_em=now(),pago_em=case when v_cash>=total then now() else null end,concluida_em=now() where id=v_sale.id;
end;$$;

create or replace function commerce_concluir_inventario(p_count_id uuid)
returns void language plpgsql security invoker set search_path=public as $$
declare v_count commerce_inventory_counts%rowtype;v_item commerce_inventory_count_items%rowtype;
begin select * into v_count from commerce_inventory_counts where id=p_count_id and owner_id=commerce_owner_atual() for update;
 if not found or v_count.status<>'aberto' then raise exception 'Inventário não está aberto.';end if;
 for v_item in select * from commerce_inventory_count_items where count_id=p_count_id and diferenca<>0 loop
  perform 1 from commerce_products where id=v_item.product_id for update;
  update commerce_products set estoque_atual=v_item.saldo_contado,updated_at=now() where id=v_item.product_id;
  insert into commerce_inventory_movements(business_id,owner_id,product_id,tipo,quantidade,referencia_externa) values(v_count.business_id,v_count.owner_id,v_item.product_id,case when v_item.diferenca>0 then 'ajuste_entrada' else 'ajuste_saida' end,abs(v_item.diferenca),'inventario:'||v_count.id::text);
 end loop;update commerce_inventory_counts set status='concluido',concluido_em=now() where id=v_count.id;end;$$;

revoke all on function commerce_concluir_inventario(uuid) from public,anon;grant execute on function commerce_concluir_inventario(uuid) to authenticated;
