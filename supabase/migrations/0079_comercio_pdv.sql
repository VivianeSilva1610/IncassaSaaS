-- Núcleo do PDV: venda, itens, pagamentos e baixa/estorno de estoque.
-- Pedido criado não é pagamento; competência e caixa permanecem separados.

create table commerce_customers (
  id uuid primary key default gen_random_uuid(), business_id uuid not null, owner_id uuid not null,
  nome text not null, documento text, email text, telefone text, ativo boolean not null default true,
  created_at timestamptz not null default now(), unique (id, business_id, owner_id),
  foreign key (business_id, owner_id) references commerce_businesses(id, owner_id) on delete cascade
);

create table commerce_sales (
  id uuid primary key default gen_random_uuid(), business_id uuid not null, owner_id uuid not null,
  customer_id uuid, numero bigint generated always as identity,
  status text not null default 'aberta' check (status in ('aberta','concluida','cancelada','devolvida_parcial','devolvida')),
  subtotal numeric(14,2) not null default 0, desconto numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0, valor_pago numeric(14,2) not null default 0,
  competencia_em timestamptz, pago_em timestamptz, concluida_em timestamptz, cancelada_em timestamptz,
  created_by uuid not null default auth.uid() references auth.users(id), created_at timestamptz not null default now(),
  unique (id, business_id, owner_id), foreign key (business_id, owner_id) references commerce_businesses(id, owner_id) on delete cascade,
  foreign key (customer_id, business_id, owner_id) references commerce_customers(id, business_id, owner_id)
);

create table commerce_sale_items (
  id uuid primary key default gen_random_uuid(), sale_id uuid not null, business_id uuid not null, owner_id uuid not null,
  product_id uuid not null, descricao text not null, quantidade numeric(14,4) not null check (quantidade > 0),
  preco_unitario numeric(14,2) not null check (preco_unitario >= 0), desconto numeric(14,2) not null default 0,
  total numeric(14,2) not null check (total >= 0), custo_unitario_snapshot numeric(14,4) not null default 0,
  created_at timestamptz not null default now(),
  foreign key (sale_id, business_id, owner_id) references commerce_sales(id, business_id, owner_id) on delete cascade,
  foreign key (product_id, business_id, owner_id) references commerce_products(id, business_id, owner_id)
);

create table commerce_sale_payments (
  id uuid primary key default gen_random_uuid(), sale_id uuid not null, business_id uuid not null, owner_id uuid not null,
  forma text not null check (forma in ('dinheiro','pix','debito','credito','boleto','crediario','outro')),
  valor numeric(14,2) not null check (valor > 0), status text not null default 'confirmado' check (status in ('pendente','confirmado','estornado','cancelado')),
  referencia_externa text, confirmado_em timestamptz, created_at timestamptz not null default now(),
  foreign key (sale_id, business_id, owner_id) references commerce_sales(id, business_id, owner_id) on delete cascade
);

create index commerce_sales_owner_date_idx on commerce_sales(owner_id, created_at desc);
create index commerce_sales_business_status_idx on commerce_sales(business_id, status, created_at desc);
create index commerce_sale_items_sale_idx on commerce_sale_items(sale_id);
create index commerce_payments_sale_idx on commerce_sale_payments(sale_id, status);
create index commerce_customers_owner_name_idx on commerce_customers(owner_id, nome);

alter table commerce_customers enable row level security; alter table commerce_sales enable row level security;
alter table commerce_sale_items enable row level security; alter table commerce_sale_payments enable row level security;
create policy commerce_customers_owner on commerce_customers for all using (owner_id=(select auth.uid())) with check (owner_id=(select auth.uid()));
create policy commerce_sales_owner on commerce_sales for all using (owner_id=(select auth.uid())) with check (owner_id=(select auth.uid()));
create policy commerce_sale_items_owner on commerce_sale_items for all using (owner_id=(select auth.uid())) with check (owner_id=(select auth.uid()));
create policy commerce_sale_payments_owner on commerce_sale_payments for all using (owner_id=(select auth.uid())) with check (owner_id=(select auth.uid()));

create or replace function commerce_concluir_venda(p_sale_id uuid, p_pagamentos jsonb)
returns void language plpgsql security invoker set search_path=public as $$
declare v_sale commerce_sales%rowtype; v_item commerce_sale_items%rowtype; v_payment jsonb; v_paid numeric(14,2):=0;
begin
  select * into v_sale from commerce_sales where id=p_sale_id and owner_id=(select auth.uid()) for update;
  if not found then raise exception 'Venda não encontrada.'; end if;
  if v_sale.status <> 'aberta' then raise exception 'A venda não está aberta.'; end if;
  for v_item in select * from commerce_sale_items where sale_id=p_sale_id loop
    perform 1 from commerce_products where id=v_item.product_id and estoque_atual >= v_item.quantidade for update;
    if not found then raise exception 'Estoque insuficiente para %.', v_item.descricao; end if;
    update commerce_products set estoque_atual=estoque_atual-v_item.quantidade, updated_at=now() where id=v_item.product_id;
    insert into commerce_inventory_movements(business_id,owner_id,product_id,tipo,quantidade,custo_unitario,referencia_externa)
      values(v_sale.business_id,v_sale.owner_id,v_item.product_id,'saida_venda',v_item.quantidade,v_item.custo_unitario_snapshot,v_sale.id::text);
  end loop;
  for v_payment in select value from jsonb_array_elements(p_pagamentos) loop
    insert into commerce_sale_payments(sale_id,business_id,owner_id,forma,valor,status,confirmado_em)
      values(v_sale.id,v_sale.business_id,v_sale.owner_id,v_payment->>'forma',(v_payment->>'valor')::numeric,'confirmado',now());
    v_paid:=v_paid+(v_payment->>'valor')::numeric;
  end loop;
  if v_paid < v_sale.total then raise exception 'O pagamento é menor que o total da venda.'; end if;
  update commerce_sales set status='concluida',valor_pago=v_paid,competencia_em=now(),pago_em=now(),concluida_em=now() where id=v_sale.id;
end; $$;

revoke all on function commerce_concluir_venda(uuid,jsonb) from public,anon;
grant execute on function commerce_concluir_venda(uuid,jsonb) to authenticated;
