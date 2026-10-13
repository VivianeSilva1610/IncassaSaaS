-- Conciliação entre pedido de compra, NF-e e recebimento físico efetivado.

create table commerce_purchase_order_receipts(
  id uuid primary key default gen_random_uuid(),business_id uuid not null,owner_id uuid not null,
  order_id uuid not null,order_item_id uuid not null,entry_id uuid not null,entry_item_id uuid not null,
  quantidade numeric(14,4) not null check(quantidade>0),aplicada boolean not null default false,
  created_at timestamptz not null default now(),aplicada_em timestamptz,
  unique(order_item_id,entry_item_id),unique(id,business_id,owner_id),
  foreign key(order_id,business_id,owner_id) references commerce_purchase_orders(id,business_id,owner_id) on delete cascade,
  foreign key(order_item_id,business_id,owner_id) references commerce_purchase_order_items(id,business_id,owner_id),
  foreign key(entry_id,business_id,owner_id) references commerce_stock_entries(id,business_id,owner_id) on delete cascade,
  foreign key(entry_item_id) references commerce_stock_entry_items(id) on delete cascade
);
create index commerce_purchase_receipts_order_idx on commerce_purchase_order_receipts(order_id,aplicada);
create index commerce_purchase_receipts_entry_idx on commerce_purchase_order_receipts(entry_id);
alter table commerce_purchase_order_receipts enable row level security;
create policy commerce_purchase_receipts_module on commerce_purchase_order_receipts for all using(owner_id=commerce_owner_atual() and commerce_tem_modulo('compras')) with check(owner_id=commerce_owner_atual() and commerce_tem_modulo('compras'));

-- Registra como já aplicados os recebimentos criados antes desta migração.
insert into commerce_purchase_order_receipts(business_id,owner_id,order_id,order_item_id,entry_id,entry_item_id,quantidade,aplicada,aplicada_em)
select e.business_id,e.owner_id,e.purchase_order_id,oi.id,e.id,ei.id,least(ei.quantidade,oi.quantidade_recebida),true,coalesce(e.efetivada_em,e.created_at)
from commerce_stock_entries e join commerce_stock_entry_items ei on ei.entry_id=e.id
join lateral(select i.id,i.quantidade_recebida from commerce_purchase_order_items i where i.order_id=e.purchase_order_id and i.product_id=ei.product_id and i.variant_id is not distinct from ei.variant_id and i.quantidade_recebida>0 order by i.created_at,i.id limit 1) oi on true
where e.purchase_order_id is not null and least(ei.quantidade,oi.quantidade_recebida)>0
on conflict do nothing;

create or replace function commerce_receber_pedido_compra(p_order_id uuid,p_itens jsonb) returns uuid
language plpgsql security invoker set search_path=public as $$
declare o commerce_purchase_orders%rowtype;i commerce_purchase_order_items%rowtype;j jsonb;q numeric(14,4);total numeric(14,2):=0;eid uuid;eiid uuid;
begin
  select * into o from commerce_purchase_orders where id=p_order_id and owner_id=commerce_owner_atual() for update;
  if not found or o.status not in('aberto','parcial') then raise exception 'Pedido nao aceita recebimento.';end if;
  if jsonb_typeof(p_itens)<>'array' or jsonb_array_length(p_itens)=0 then raise exception 'Informe os itens recebidos.';end if;
  for j in select value from jsonb_array_elements(p_itens) loop
    q:=(j->>'quantidade')::numeric;
    select * into i from commerce_purchase_order_items where id=(j->>'item_id')::uuid and order_id=o.id and owner_id=o.owner_id for update;
    if not found or q<=0 or q>i.quantidade_pedida-i.quantidade_recebida-coalesce((select sum(r.quantidade) from commerce_purchase_order_receipts r where r.order_item_id=i.id and not r.aplicada),0) then raise exception 'Quantidade recebida invalida.';end if;
    total:=total+round(q*i.valor_unitario,2);
  end loop;
  insert into commerce_stock_entries(business_id,owner_id,supplier_id,purchase_order_id,origem,numero_documento,valor_produtos,valor_total)
  values(o.business_id,o.owner_id,o.supplier_id,o.id,'pedido_compra','PC-'||o.numero,total,total) returning id into eid;
  for j in select value from jsonb_array_elements(p_itens) loop
    q:=(j->>'quantidade')::numeric;select * into i from commerce_purchase_order_items where id=(j->>'item_id')::uuid;
    insert into commerce_stock_entry_items(entry_id,business_id,owner_id,product_id,variant_id,descricao_documento,quantidade,unidade,valor_unitario,valor_total)
    select eid,o.business_id,o.owner_id,i.product_id,i.variant_id,i.descricao,q,p.unidade,i.valor_unitario,round(q*i.valor_unitario,2) from commerce_products p where p.id=i.product_id returning id into eiid;
    insert into commerce_purchase_order_receipts(business_id,owner_id,order_id,order_item_id,entry_id,entry_item_id,quantidade) values(o.business_id,o.owner_id,o.id,i.id,eid,eiid,q);
  end loop;
  return eid;
end; $$;

create function commerce_vincular_nfe_pedido_compra(p_entry_id uuid,p_order_id uuid) returns void
language plpgsql security invoker set search_path=public as $$
declare e commerce_stock_entries%rowtype;o commerce_purchase_orders%rowtype;
begin
  select * into e from commerce_stock_entries where id=p_entry_id and owner_id=commerce_owner_atual() for update;
  select * into o from commerce_purchase_orders where id=p_order_id and owner_id=commerce_owner_atual() for update;
  if not found or e.id is null or e.origem<>'nfe_xml' or e.status not in('rascunho','conferida') then raise exception 'NF-e ou pedido invalido.';end if;
  if o.status not in('aberto','parcial') then raise exception 'Pedido nao aceita recebimento.';end if;
  if e.business_id<>o.business_id or e.supplier_id<>o.supplier_id then raise exception 'O fornecedor da NF-e nao corresponde ao pedido.';end if;
  update commerce_stock_entries set purchase_order_id=o.id,updated_at=now() where id=e.id;
end; $$;

-- A versão completa desta função preserva lote/validade e aplica o recebimento ao pedido somente após a entrada física.
create or replace function commerce_aplicar_recebimento_pedido() returns trigger language plpgsql security invoker set search_path=public as $$
declare r commerce_purchase_order_receipts%rowtype;e commerce_stock_entries%rowtype;ei commerce_stock_entry_items%rowtype;oi commerce_purchase_order_items%rowtype;remaining numeric(14,4);use_qty numeric(14,4);
begin
  if old.status not in('rascunho','conferida') or new.status<>'efetivada' or new.purchase_order_id is null then return new;end if;
  select * into e from commerce_stock_entries where id=new.id;
  for ei in select * from commerce_stock_entry_items where entry_id=e.id order by created_at,id loop
    remaining:=ei.quantidade-coalesce((select sum(quantidade) from commerce_purchase_order_receipts where entry_item_id=ei.id),0);
    for oi in select * from commerce_purchase_order_items where order_id=e.purchase_order_id and product_id=ei.product_id and variant_id is not distinct from ei.variant_id and quantidade_recebida<quantidade_pedida order by created_at,id for update loop
      exit when remaining<=0;use_qty:=least(remaining,oi.quantidade_pedida-oi.quantidade_recebida-coalesce((select sum(quantidade) from commerce_purchase_order_receipts where order_item_id=oi.id and not aplicada),0));
      if use_qty>0 then insert into commerce_purchase_order_receipts(business_id,owner_id,order_id,order_item_id,entry_id,entry_item_id,quantidade) values(e.business_id,e.owner_id,e.purchase_order_id,oi.id,e.id,ei.id,use_qty);remaining:=remaining-use_qty;end if;
    end loop;
  end loop;
  for r in select * from commerce_purchase_order_receipts where entry_id=e.id and not aplicada order by created_at,id for update loop
    update commerce_purchase_order_items set quantidade_recebida=quantidade_recebida+r.quantidade where id=r.order_item_id;
    update commerce_purchase_order_receipts set aplicada=true,aplicada_em=now() where id=r.id;
  end loop;
  update commerce_purchase_orders set status=case when not exists(select 1 from commerce_purchase_order_items where order_id=e.purchase_order_id and quantidade_recebida<quantidade_pedida) then 'recebido' else 'parcial' end,updated_at=now() where id=e.purchase_order_id;
  return new;
end; $$;
create trigger commerce_entry_apply_purchase_receipt after update of status on commerce_stock_entries for each row execute function commerce_aplicar_recebimento_pedido();

revoke all on function commerce_vincular_nfe_pedido_compra(uuid,uuid) from public,anon;
grant execute on function commerce_vincular_nfe_pedido_compra(uuid,uuid) to authenticated;
