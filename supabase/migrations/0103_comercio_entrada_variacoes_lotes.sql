-- Entrada por variacao e rastreabilidade opcional.
alter table commerce_stock_entry_items add column if not exists variant_id uuid;
alter table commerce_stock_entry_items add constraint commerce_entry_item_variant_fk foreign key(variant_id,business_id,owner_id) references commerce_product_variants(id,business_id,owner_id);
alter table commerce_inventory_movements add column if not exists variant_id uuid;
alter table commerce_inventory_movements add constraint commerce_inventory_variant_fk foreign key(variant_id,business_id,owner_id) references commerce_product_variants(id,business_id,owner_id);
create table commerce_stock_lots(id uuid primary key default gen_random_uuid(),business_id uuid not null,owner_id uuid not null,product_id uuid not null,variant_id uuid,entry_item_id uuid not null,numero_lote text,validade date,quantidade_inicial numeric(14,4) not null check(quantidade_inicial>0),quantidade_atual numeric(14,4) not null check(quantidade_atual>=0),created_at timestamptz not null default now(),unique(id,business_id,owner_id),foreign key(business_id,owner_id) references commerce_businesses(id,owner_id) on delete cascade,foreign key(product_id,business_id,owner_id) references commerce_products(id,business_id,owner_id),foreign key(variant_id,business_id,owner_id) references commerce_product_variants(id,business_id,owner_id),foreign key(entry_item_id) references commerce_stock_entry_items(id),check(numero_lote is not null or validade is not null));
create index commerce_stock_lots_product_idx on commerce_stock_lots(product_id,validade) where quantidade_atual>0;
alter table commerce_stock_lots enable row level security;
create policy commerce_stock_lots_module on commerce_stock_lots for all using(owner_id=commerce_owner_atual() and (commerce_tem_modulo('estoque') or commerce_tem_modulo('compras'))) with check(owner_id=commerce_owner_atual() and (commerce_tem_modulo('estoque') or commerce_tem_modulo('compras')));

create or replace function commerce_efetivar_entrada(p_entry_id uuid,p_mapeamentos jsonb) returns void language plpgsql security invoker set search_path=public as $$
declare e commerce_stock_entries%rowtype;i commerce_stock_entry_items%rowtype;p commerce_products%rowtype;v commerce_product_variants%rowtype;m jsonb;pid uuid;vid uuid;saldo numeric(14,4);custo numeric(14,4);lote text;val date;
begin
 select * into e from commerce_stock_entries where id=p_entry_id and owner_id=commerce_owner_atual() for update;
 if not found then raise exception 'Entrada nao encontrada.';end if;if e.status='efetivada' then raise exception 'Esta entrada ja foi efetivada.';end if;if e.status='cancelada' then raise exception 'Uma entrada cancelada nao pode ser efetivada.';end if;
 for i in select * from commerce_stock_entry_items where entry_id=e.id and owner_id=e.owner_id order by created_at,id loop
  select value into m from jsonb_array_elements(p_mapeamentos) value where value->>'item_id'=i.id::text limit 1;
  begin pid:=nullif(m->>'product_id','')::uuid;vid:=nullif(m->>'variant_id','')::uuid;exception when others then raise exception 'Mapeamento invalido.';end;
  select * into p from commerce_products where id=pid and business_id=e.business_id and owner_id=e.owner_id for update;if not found then raise exception 'Produto invalido.';end if;
  if vid is not null then select * into v from commerce_product_variants where id=vid and product_id=p.id and owner_id=e.owner_id and ativo for update;if not found then raise exception 'Variacao invalida ou inativa.';end if;update commerce_product_variants set estoque_atual=estoque_atual+i.quantidade,custo_medio=round(((estoque_atual*custo_medio)+(i.quantidade*i.valor_unitario))/(estoque_atual+i.quantidade),4),updated_at=now() where id=v.id;end if;
  saldo:=p.estoque_atual+i.quantidade;custo:=round(((p.estoque_atual*p.custo_medio)+(i.quantidade*i.valor_unitario))/saldo,4);
  update commerce_stock_entry_items set product_id=p.id,variant_id=vid where id=i.id;
  insert into commerce_inventory_movements(business_id,owner_id,product_id,variant_id,tipo,quantidade,custo_unitario,entry_id) values(e.business_id,e.owner_id,p.id,vid,case when e.origem='nfe_xml' then 'entrada_nfe' else 'entrada_compra' end,i.quantidade,i.valor_unitario,e.id);
  update commerce_products set estoque_atual=saldo,custo_medio=custo,updated_at=now() where id=p.id;
  lote:=nullif(trim(m->>'numero_lote'),'');val:=nullif(m->>'validade','')::date;
  if lote is not null or val is not null then if lote is not null and not p.controla_lote then raise exception 'Ative o controle de lote para %.',p.nome;end if;if val is not null and not p.controla_validade then raise exception 'Ative o controle de validade para %.',p.nome;end if;insert into commerce_stock_lots(business_id,owner_id,product_id,variant_id,entry_item_id,numero_lote,validade,quantidade_inicial,quantidade_atual) values(e.business_id,e.owner_id,p.id,vid,i.id,lote,val,i.quantidade,i.quantidade);end if;
 end loop;
 if not exists(select 1 from commerce_stock_entry_items where entry_id=e.id) then raise exception 'A entrada nao possui itens.';end if;
 update commerce_stock_entries set status='efetivada',efetivada_em=now(),efetivada_por=auth.uid(),updated_at=now() where id=e.id;
end;$$;
