-- Orçamentos, pedidos de venda e reserva lógica de estoque.
-- A reserva não movimenta o estoque contábil; a baixa continua ocorrendo somente ao concluir a venda.

create table commerce_sales_quotes (
  id uuid primary key default gen_random_uuid(), numero bigint generated always as identity,
  business_id uuid not null, owner_id uuid not null, customer_id uuid,
  status text not null default 'aberto' check(status in ('aberto','aprovado','recusado','expirado','convertido','cancelado')),
  validade date, subtotal numeric(14,2) not null default 0, desconto numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0, observacoes text,
  created_by uuid not null default auth.uid() references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(id,business_id,owner_id),
  foreign key(business_id,owner_id) references commerce_businesses(id,owner_id) on delete cascade,
  foreign key(customer_id,business_id,owner_id) references commerce_customers(id,business_id,owner_id)
);

create table commerce_sales_quote_items (
  id uuid primary key default gen_random_uuid(), quote_id uuid not null, business_id uuid not null, owner_id uuid not null,
  product_id uuid not null, variant_id uuid, descricao text not null,
  quantidade numeric(14,4) not null check(quantidade>0), preco_unitario numeric(14,2) not null check(preco_unitario>=0),
  desconto numeric(14,2) not null default 0 check(desconto>=0), total numeric(14,2) not null check(total>=0),
  created_at timestamptz not null default now(), unique(id,business_id,owner_id),
  foreign key(quote_id,business_id,owner_id) references commerce_sales_quotes(id,business_id,owner_id) on delete cascade,
  foreign key(product_id,business_id,owner_id) references commerce_products(id,business_id,owner_id),
  foreign key(variant_id,business_id,owner_id) references commerce_product_variants(id,business_id,owner_id)
);

create table commerce_sales_orders (
  id uuid primary key default gen_random_uuid(), numero bigint generated always as identity,
  business_id uuid not null, owner_id uuid not null, customer_id uuid, quote_id uuid,
  status text not null default 'aberto' check(status in ('aberto','separacao','pronto','faturado','cancelado')),
  reserva_ate timestamptz, subtotal numeric(14,2) not null default 0, desconto numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0, observacoes text,
  created_by uuid not null default auth.uid() references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(id,business_id,owner_id),
  foreign key(business_id,owner_id) references commerce_businesses(id,owner_id) on delete cascade,
  foreign key(customer_id,business_id,owner_id) references commerce_customers(id,business_id,owner_id),
  foreign key(quote_id,business_id,owner_id) references commerce_sales_quotes(id,business_id,owner_id)
);

create table commerce_sales_order_items (
  id uuid primary key default gen_random_uuid(), order_id uuid not null, business_id uuid not null, owner_id uuid not null,
  product_id uuid not null, variant_id uuid, descricao text not null,
  quantidade numeric(14,4) not null check(quantidade>0), preco_unitario numeric(14,2) not null check(preco_unitario>=0),
  desconto numeric(14,2) not null default 0 check(desconto>=0), total numeric(14,2) not null check(total>=0),
  created_at timestamptz not null default now(), unique(id,business_id,owner_id),
  foreign key(order_id,business_id,owner_id) references commerce_sales_orders(id,business_id,owner_id) on delete cascade,
  foreign key(product_id,business_id,owner_id) references commerce_products(id,business_id,owner_id),
  foreign key(variant_id,business_id,owner_id) references commerce_product_variants(id,business_id,owner_id)
);

create table commerce_stock_reservations (
  id uuid primary key default gen_random_uuid(), order_id uuid not null, order_item_id uuid not null,
  business_id uuid not null, owner_id uuid not null, product_id uuid not null, variant_id uuid,
  quantidade numeric(14,4) not null check(quantidade>0), status text not null default 'ativa' check(status in ('ativa','consumida','liberada','expirada')),
  expires_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(order_item_id), unique(id,business_id,owner_id),
  foreign key(order_id,business_id,owner_id) references commerce_sales_orders(id,business_id,owner_id) on delete cascade,
  foreign key(order_item_id,business_id,owner_id) references commerce_sales_order_items(id,business_id,owner_id) on delete cascade,
  foreign key(product_id,business_id,owner_id) references commerce_products(id,business_id,owner_id),
  foreign key(variant_id,business_id,owner_id) references commerce_product_variants(id,business_id,owner_id)
);

create index commerce_quotes_business_status_idx on commerce_sales_quotes(business_id,status,created_at desc);
create index commerce_orders_business_status_idx on commerce_sales_orders(business_id,status,created_at desc);
create index commerce_reservations_product_idx on commerce_stock_reservations(business_id,product_id,variant_id,status,expires_at);

alter table commerce_sales_quotes enable row level security; alter table commerce_sales_quote_items enable row level security;
alter table commerce_sales_orders enable row level security; alter table commerce_sales_order_items enable row level security; alter table commerce_stock_reservations enable row level security;
create policy commerce_sales_quotes_module on commerce_sales_quotes for all using(owner_id=commerce_owner_atual() and commerce_tem_modulo('vendas')) with check(owner_id=commerce_owner_atual() and commerce_tem_modulo('vendas'));
create policy commerce_sales_quote_items_module on commerce_sales_quote_items for all using(owner_id=commerce_owner_atual() and commerce_tem_modulo('vendas')) with check(owner_id=commerce_owner_atual() and commerce_tem_modulo('vendas'));
create policy commerce_sales_orders_module on commerce_sales_orders for all using(owner_id=commerce_owner_atual() and commerce_tem_modulo('vendas')) with check(owner_id=commerce_owner_atual() and commerce_tem_modulo('vendas'));
create policy commerce_sales_order_items_module on commerce_sales_order_items for all using(owner_id=commerce_owner_atual() and commerce_tem_modulo('vendas')) with check(owner_id=commerce_owner_atual() and commerce_tem_modulo('vendas'));
create policy commerce_stock_reservations_module on commerce_stock_reservations for all using(owner_id=commerce_owner_atual() and commerce_tem_modulo('vendas')) with check(owner_id=commerce_owner_atual() and commerce_tem_modulo('vendas'));

create trigger commerce_log_sales_quotes after insert or update or delete on commerce_sales_quotes for each row execute function commerce_log_activity('orcamento_venda');
create trigger commerce_log_sales_orders after insert or update or delete on commerce_sales_orders for each row execute function commerce_log_activity('pedido_venda');

create function commerce_converter_orcamento_em_pedido(p_quote_id uuid,p_reserva_ate timestamptz default null) returns uuid
language plpgsql security invoker set search_path=public as $$
declare q commerce_sales_quotes%rowtype; i commerce_sales_quote_items%rowtype; oid uuid; oi uuid; disponivel numeric(14,4);
begin
  select * into q from commerce_sales_quotes where id=p_quote_id and owner_id=commerce_owner_atual() for update;
  if not found or q.status not in('aberto','aprovado') then raise exception 'Orcamento nao pode ser convertido.'; end if;
  if not exists(select 1 from commerce_sales_quote_items where quote_id=q.id) then raise exception 'Orcamento sem itens.'; end if;
  insert into commerce_sales_orders(business_id,owner_id,customer_id,quote_id,reserva_ate,subtotal,desconto,total,observacoes)
  values(q.business_id,q.owner_id,q.customer_id,q.id,p_reserva_ate,q.subtotal,q.desconto,q.total,q.observacoes) returning id into oid;
  for i in select * from commerce_sales_quote_items where quote_id=q.id loop
    if i.variant_id is null then
      select p.estoque_atual-coalesce((select sum(r.quantidade) from commerce_stock_reservations r where r.product_id=i.product_id and r.variant_id is null and r.status='ativa' and (r.expires_at is null or r.expires_at>now())),0) into disponivel from commerce_products p where p.id=i.product_id for update;
    else
      select v.estoque_atual-coalesce((select sum(r.quantidade) from commerce_stock_reservations r where r.variant_id=i.variant_id and r.status='ativa' and (r.expires_at is null or r.expires_at>now())),0) into disponivel from commerce_product_variants v where v.id=i.variant_id for update;
    end if;
    if coalesce(disponivel,0)<i.quantidade then raise exception 'Estoque disponivel insuficiente para %.',i.descricao; end if;
    insert into commerce_sales_order_items(order_id,business_id,owner_id,product_id,variant_id,descricao,quantidade,preco_unitario,desconto,total)
    values(oid,q.business_id,q.owner_id,i.product_id,i.variant_id,i.descricao,i.quantidade,i.preco_unitario,i.desconto,i.total) returning id into oi;
    insert into commerce_stock_reservations(order_id,order_item_id,business_id,owner_id,product_id,variant_id,quantidade,expires_at)
    values(oid,oi,q.business_id,q.owner_id,i.product_id,i.variant_id,i.quantidade,p_reserva_ate);
  end loop;
  update commerce_sales_quotes set status='convertido',updated_at=now() where id=q.id;
  return oid;
end; $$;

create function commerce_cancelar_pedido_venda(p_order_id uuid) returns void language plpgsql security invoker set search_path=public as $$
declare o commerce_sales_orders%rowtype;
begin
  select * into o from commerce_sales_orders where id=p_order_id and owner_id=commerce_owner_atual() for update;
  if not found or o.status not in('aberto','separacao','pronto') then raise exception 'Pedido nao pode ser cancelado.'; end if;
  update commerce_stock_reservations set status='liberada',updated_at=now() where order_id=o.id and status='ativa';
  update commerce_sales_orders set status='cancelado',updated_at=now() where id=o.id;
end; $$;

revoke all on function commerce_converter_orcamento_em_pedido(uuid,timestamptz) from public,anon;
revoke all on function commerce_cancelar_pedido_venda(uuid) from public,anon;
grant execute on function commerce_converter_orcamento_em_pedido(uuid,timestamptz) to authenticated;
grant execute on function commerce_cancelar_pedido_venda(uuid) to authenticated;
