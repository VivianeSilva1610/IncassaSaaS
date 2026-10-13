-- Devolucoes parciais e totais de vendas do INCASSA Comercio.
-- A devolucao fisica e o reembolso financeiro ficam explicitamente separados.

create table commerce_sale_returns (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null,
  business_id uuid not null,
  owner_id uuid not null,
  motivo text not null,
  valor numeric(14,2) not null check (valor >= 0),
  reembolso_forma text check (reembolso_forma is null or reembolso_forma in ('dinheiro','pix','debito','credito','boleto','outro')),
  reembolso_status text not null default 'pendente' check (reembolso_status in ('pendente','realizado')),
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  unique (id, business_id, owner_id),
  foreign key (sale_id, business_id, owner_id) references commerce_sales(id, business_id, owner_id)
);

create table commerce_sale_return_items (
  id uuid primary key default gen_random_uuid(),
  return_id uuid not null,
  sale_item_id uuid not null,
  sale_id uuid not null,
  business_id uuid not null,
  owner_id uuid not null,
  product_id uuid not null,
  quantidade numeric(14,4) not null check (quantidade > 0),
  valor numeric(14,2) not null check (valor >= 0),
  created_at timestamptz not null default now(),
  foreign key (return_id, business_id, owner_id) references commerce_sale_returns(id, business_id, owner_id) on delete cascade,
  foreign key (sale_id, business_id, owner_id) references commerce_sales(id, business_id, owner_id),
  foreign key (product_id, business_id, owner_id) references commerce_products(id, business_id, owner_id),
  foreign key (sale_item_id) references commerce_sale_items(id)
);

create index commerce_returns_sale_idx on commerce_sale_returns(sale_id, created_at desc);
create index commerce_return_items_sale_item_idx on commerce_sale_return_items(sale_item_id);

alter table commerce_sale_returns enable row level security;
alter table commerce_sale_return_items enable row level security;
create policy commerce_sale_returns_tenant on commerce_sale_returns for all
  using (owner_id = commerce_owner_atual()) with check (owner_id = commerce_owner_atual());
create policy commerce_sale_return_items_tenant on commerce_sale_return_items for all
  using (owner_id = commerce_owner_atual()) with check (owner_id = commerce_owner_atual());

alter table commerce_cash_movements add column if not exists sale_return_id uuid;
alter table commerce_cash_movements add constraint commerce_cash_sale_return_fk
  foreign key (sale_return_id, business_id, owner_id)
  references commerce_sale_returns(id, business_id, owner_id);
create unique index commerce_cash_sale_return_unique on commerce_cash_movements(sale_return_id)
  where sale_return_id is not null;

create or replace function commerce_registrar_devolucao(
  p_sale_id uuid,
  p_itens jsonb,
  p_motivo text,
  p_reembolso_forma text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_sale commerce_sales%rowtype;
  v_item commerce_sale_items%rowtype;
  v_json jsonb;
  v_return_id uuid;
  v_quantidade numeric(14,4);
  v_ja_devolvida numeric(14,4);
  v_valor numeric(14,2);
  v_total_devolucao numeric(14,2) := 0;
  v_total_quantidade numeric(14,4);
  v_total_devolvida numeric(14,4);
begin
  select * into v_sale from commerce_sales
    where id = p_sale_id and owner_id = commerce_owner_atual() for update;
  if not found then raise exception 'Venda nao encontrada.'; end if;
  if v_sale.status not in ('concluida','devolvida_parcial') then
    raise exception 'Esta venda nao aceita devolucao.';
  end if;
  if length(trim(coalesce(p_motivo,''))) < 3 then raise exception 'Informe o motivo da devolucao.'; end if;
  if p_reembolso_forma is not null and p_reembolso_forma not in ('dinheiro','pix','debito','credito','boleto','outro') then
    raise exception 'Forma de reembolso invalida.';
  end if;
  if jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) = 0 then
    raise exception 'Selecione ao menos um item.';
  end if;

  -- Valida primeiro para manter a operacao integralmente atomica.
  for v_json in select value from jsonb_array_elements(p_itens)
  loop
    begin v_quantidade := (v_json->>'quantidade')::numeric;
    exception when others then raise exception 'Quantidade devolvida invalida.'; end;
    select * into v_item from commerce_sale_items
      where id = (v_json->>'sale_item_id')::uuid and sale_id = v_sale.id
        and business_id = v_sale.business_id and owner_id = v_sale.owner_id;
    if not found then raise exception 'Item da venda invalido.'; end if;
    select coalesce(sum(quantidade),0) into v_ja_devolvida
      from commerce_sale_return_items where sale_item_id = v_item.id and owner_id = v_sale.owner_id;
    if v_quantidade <= 0 or v_quantidade > v_item.quantidade - v_ja_devolvida then
      raise exception 'Quantidade devolvida excede o saldo de %.', v_item.descricao;
    end if;
    v_valor := case when v_sale.subtotal > 0
      then round(v_item.preco_unitario * v_quantidade * v_sale.total / v_sale.subtotal, 2)
      else 0 end;
    v_total_devolucao := v_total_devolucao + v_valor;
  end loop;

  insert into commerce_sale_returns(sale_id,business_id,owner_id,motivo,valor,reembolso_forma,reembolso_status)
  values(v_sale.id,v_sale.business_id,v_sale.owner_id,trim(p_motivo),v_total_devolucao,p_reembolso_forma,
    case when p_reembolso_forma is null then 'pendente' else 'realizado' end)
  returning id into v_return_id;

  for v_json in select value from jsonb_array_elements(p_itens)
  loop
    v_quantidade := (v_json->>'quantidade')::numeric;
    select * into v_item from commerce_sale_items where id = (v_json->>'sale_item_id')::uuid;
    v_valor := case when v_sale.subtotal > 0
      then round(v_item.preco_unitario * v_quantidade * v_sale.total / v_sale.subtotal, 2)
      else 0 end;
    perform 1 from commerce_products where id = v_item.product_id and owner_id = v_sale.owner_id for update;
    update commerce_products set estoque_atual = estoque_atual + v_quantidade, updated_at = now()
      where id = v_item.product_id and owner_id = v_sale.owner_id;
    insert into commerce_sale_return_items(return_id,sale_item_id,sale_id,business_id,owner_id,product_id,quantidade,valor)
      values(v_return_id,v_item.id,v_sale.id,v_sale.business_id,v_sale.owner_id,v_item.product_id,v_quantidade,v_valor);
    insert into commerce_inventory_movements(business_id,owner_id,product_id,tipo,quantidade,custo_unitario,referencia_externa)
      values(v_sale.business_id,v_sale.owner_id,v_item.product_id,'devolucao_cliente',v_quantidade,v_item.custo_unitario_snapshot,'devolucao:'||v_return_id::text);
  end loop;

  if p_reembolso_forma is not null and v_total_devolucao > 0 then
    insert into commerce_cash_movements(business_id,owner_id,tipo,descricao,valor,sale_return_id)
      values(v_sale.business_id,v_sale.owner_id,'estorno_venda','Reembolso da venda #'||v_sale.numero,v_total_devolucao,v_return_id);
  end if;

  select coalesce(sum(quantidade),0) into v_total_quantidade from commerce_sale_items where sale_id = v_sale.id;
  select coalesce(sum(quantidade),0) into v_total_devolvida from commerce_sale_return_items where sale_id = v_sale.id;
  update commerce_sales set status = case when v_total_devolvida >= v_total_quantidade then 'devolvida' else 'devolvida_parcial' end
    where id = v_sale.id;
  return v_return_id;
end;
$$;

revoke all on function commerce_registrar_devolucao(uuid,jsonb,text,text) from public, anon;
grant execute on function commerce_registrar_devolucao(uuid,jsonb,text,text) to authenticated;

-- Depois de uma devolucao parcial, cancelar a venda inteira devolveria os mesmos
-- itens novamente. O restante deve ser devolvido pelo fluxo item a item.
create or replace function commerce_cancelar_venda(p_sale_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_sale commerce_sales%rowtype;
  v_item commerce_sale_items%rowtype;
  v_receivable commerce_accounts_receivable%rowtype;
begin
  select * into v_sale from commerce_sales
    where id = p_sale_id and owner_id = commerce_owner_atual() for update;
  if not found then raise exception 'Venda nao encontrada.'; end if;
  if v_sale.status = 'cancelada' then raise exception 'Esta venda ja foi cancelada.'; end if;
  if v_sale.status = 'devolvida_parcial' then
    raise exception 'A venda possui devolucao parcial. Devolva os itens restantes pela tela de detalhes.';
  end if;
  if v_sale.status <> 'concluida' then raise exception 'Somente vendas concluidas podem ser canceladas.'; end if;

  for v_item in select * from commerce_sale_items where sale_id = p_sale_id and owner_id = v_sale.owner_id
  loop
    perform 1 from commerce_products where id = v_item.product_id and owner_id = v_sale.owner_id for update;
    update commerce_products set estoque_atual = estoque_atual + v_item.quantidade, updated_at = now()
      where id = v_item.product_id and owner_id = v_sale.owner_id;
    insert into commerce_inventory_movements(business_id,owner_id,product_id,tipo,quantidade,custo_unitario,referencia_externa)
      values(v_sale.business_id,v_sale.owner_id,v_item.product_id,'devolucao_cliente',v_item.quantidade,v_item.custo_unitario_snapshot,'cancelamento:'||v_sale.id::text);
  end loop;

  for v_receivable in select * from commerce_accounts_receivable where sale_id = v_sale.id and owner_id = v_sale.owner_id for update
  loop
    if v_receivable.status = 'paga' then
      insert into commerce_cash_movements(business_id,owner_id,tipo,descricao,valor,account_receivable_id)
        values(v_receivable.business_id,v_receivable.owner_id,'estorno_recebimento','Estorno: '||v_receivable.descricao,v_receivable.valor,v_receivable.id)
        on conflict do nothing;
    end if;
    update commerce_accounts_receivable set status = 'cancelada' where id = v_receivable.id;
  end loop;

  update commerce_sale_payments set status = 'estornado'
    where sale_id = v_sale.id and owner_id = v_sale.owner_id and status in ('confirmado','pendente');
  update commerce_sales set status = 'cancelada', cancelada_em = now()
    where id = v_sale.id and owner_id = v_sale.owner_id;
end;
$$;

revoke all on function commerce_cancelar_venda(uuid) from public, anon;
grant execute on function commerce_cancelar_venda(uuid) to authenticated;
