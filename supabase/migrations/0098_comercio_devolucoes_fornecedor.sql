-- Cancelamento de compras em rascunho e devolucoes ao fornecedor.
-- A devolucao baixa o estoque, compensa apenas saldos ainda abertos e preserva pagamentos realizados.

alter table commerce_accounts_payable add column if not exists updated_at timestamptz not null default now();
alter table commerce_accounts_payable drop constraint if exists commerce_accounts_payable_valor_check;
alter table commerce_accounts_payable add constraint commerce_accounts_payable_valor_check check (valor >= 0);

create table commerce_supplier_returns (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  owner_id uuid not null,
  entry_id uuid not null,
  supplier_id uuid,
  motivo text not null check (length(trim(motivo)) >= 3),
  valor_produtos numeric(14,2) not null check (valor_produtos > 0),
  valor_compensado numeric(14,2) not null default 0 check (valor_compensado >= 0),
  credito_fornecedor numeric(14,2) not null default 0 check (credito_fornecedor >= 0),
  status_financeiro text not null check (status_financeiro in ('compensado','credito_pendente')),
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  unique (id, business_id, owner_id),
  foreign key (business_id, owner_id) references commerce_businesses(id, owner_id) on delete cascade,
  foreign key (entry_id, business_id, owner_id) references commerce_stock_entries(id, business_id, owner_id),
  foreign key (supplier_id, business_id, owner_id) references commerce_suppliers(id, business_id, owner_id)
);

create table commerce_supplier_return_items (
  id uuid primary key default gen_random_uuid(),
  return_id uuid not null,
  entry_item_id uuid not null,
  business_id uuid not null,
  owner_id uuid not null,
  product_id uuid not null,
  descricao text not null,
  quantidade numeric(14,4) not null check (quantidade > 0),
  valor_unitario numeric(14,4) not null check (valor_unitario >= 0),
  valor_total numeric(14,2) not null check (valor_total >= 0),
  created_at timestamptz not null default now(),
  foreign key (return_id, business_id, owner_id) references commerce_supplier_returns(id, business_id, owner_id) on delete cascade,
  foreign key (entry_item_id) references commerce_stock_entry_items(id),
  foreign key (business_id, owner_id) references commerce_businesses(id, owner_id) on delete cascade,
  foreign key (product_id, business_id, owner_id) references commerce_products(id, business_id, owner_id)
);

create index commerce_supplier_returns_entry_idx on commerce_supplier_returns(entry_id, created_at desc);
create index commerce_supplier_return_items_entry_item_idx on commerce_supplier_return_items(entry_item_id);

alter table commerce_supplier_returns enable row level security;
alter table commerce_supplier_return_items enable row level security;
create policy commerce_supplier_returns_module on commerce_supplier_returns for all
  using (owner_id = commerce_owner_atual() and (commerce_tem_modulo('compras') or commerce_tem_modulo('financeiro')))
  with check (owner_id = commerce_owner_atual() and (commerce_tem_modulo('compras') or commerce_tem_modulo('financeiro')));
create policy commerce_supplier_return_items_module on commerce_supplier_return_items for all
  using (owner_id = commerce_owner_atual() and (commerce_tem_modulo('compras') or commerce_tem_modulo('financeiro')))
  with check (owner_id = commerce_owner_atual() and (commerce_tem_modulo('compras') or commerce_tem_modulo('financeiro')));

create trigger commerce_log_supplier_returns after insert or update or delete on commerce_supplier_returns
  for each row execute function commerce_log_activity('devolucao_fornecedor');

create function commerce_cancelar_entrada(p_entry_id uuid)
returns void language plpgsql security invoker set search_path = public as $$
declare v_entry commerce_stock_entries%rowtype;
begin
  select * into v_entry from commerce_stock_entries
    where id = p_entry_id and owner_id = commerce_owner_atual() for update;
  if not found then raise exception 'Compra nao encontrada.'; end if;
  if v_entry.status not in ('rascunho','conferida') then
    raise exception 'Somente uma compra ainda nao efetivada pode ser cancelada.';
  end if;
  if exists (select 1 from commerce_accounts_payable where entry_id = v_entry.id and valor_pago > 0) then
    raise exception 'A compra possui pagamento registrado e nao pode ser cancelada.';
  end if;
  update commerce_accounts_payable set status = 'cancelada', updated_at = now()
    where entry_id = v_entry.id and owner_id = v_entry.owner_id and status in ('aberta','parcial','vencida');
  update commerce_stock_entries set status = 'cancelada', updated_at = now() where id = v_entry.id;
end; $$;

create function commerce_registrar_devolucao_fornecedor(p_entry_id uuid, p_itens jsonb, p_motivo text)
returns uuid language plpgsql security invoker set search_path = public as $$
declare
  v_entry commerce_stock_entries%rowtype;
  v_json jsonb;
  v_item commerce_stock_entry_items%rowtype;
  v_product commerce_products%rowtype;
  v_return_id uuid;
  v_qty numeric(14,4);
  v_returned numeric(14,4);
  v_total numeric(14,2) := 0;
  v_remaining numeric(14,2);
  v_adjust numeric(14,2);
  v_payable commerce_accounts_payable%rowtype;
begin
  select * into v_entry from commerce_stock_entries
    where id = p_entry_id and owner_id = commerce_owner_atual() for update;
  if not found then raise exception 'Compra nao encontrada.'; end if;
  if v_entry.status <> 'efetivada' then raise exception 'Somente uma compra efetivada aceita devolucao.'; end if;
  if jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) = 0 then raise exception 'Selecione os itens devolvidos.'; end if;
  if jsonb_array_length(p_itens) > 200 then raise exception 'A devolucao aceita ate 200 itens.'; end if;
  if (select count(*) from jsonb_array_elements(p_itens)) <>
     (select count(distinct value->>'entry_item_id') from jsonb_array_elements(p_itens)) then
    raise exception 'Cada item deve aparecer apenas uma vez na devolucao.';
  end if;
  if length(trim(coalesce(p_motivo,''))) < 3 then raise exception 'Informe o motivo da devolucao.'; end if;

  -- Primeira passagem valida tudo antes de gerar efeitos.
  for v_json in select value from jsonb_array_elements(p_itens) loop
    begin v_qty := (v_json->>'quantidade')::numeric; exception when others then raise exception 'Quantidade invalida.'; end;
    if v_qty <= 0 then raise exception 'A quantidade deve ser positiva.'; end if;
    select * into v_item from commerce_stock_entry_items
      where id = (v_json->>'entry_item_id')::uuid and entry_id = v_entry.id and owner_id = v_entry.owner_id;
    if not found or v_item.product_id is null then raise exception 'Item da compra invalido ou sem produto vinculado.'; end if;
    select coalesce(sum(quantidade),0) into v_returned from commerce_supplier_return_items
      where entry_item_id = v_item.id and owner_id = v_entry.owner_id;
    if v_qty + v_returned > v_item.quantidade then raise exception 'Quantidade devolvida excede a quantidade comprada de %.', v_item.descricao_documento; end if;
    select * into v_product from commerce_products where id = v_item.product_id and owner_id = v_entry.owner_id for update;
    if v_product.estoque_atual < v_qty then raise exception 'Estoque insuficiente para devolver %.', v_item.descricao_documento; end if;
    v_total := v_total + round(v_qty * v_item.valor_unitario, 2);
  end loop;

  insert into commerce_supplier_returns(business_id, owner_id, entry_id, supplier_id, motivo, valor_produtos, valor_compensado, credito_fornecedor, status_financeiro)
  values(v_entry.business_id, v_entry.owner_id, v_entry.id, v_entry.supplier_id, trim(p_motivo), v_total, 0, v_total, 'credito_pendente')
  returning id into v_return_id;

  for v_json in select value from jsonb_array_elements(p_itens) loop
    v_qty := (v_json->>'quantidade')::numeric;
    select * into v_item from commerce_stock_entry_items where id = (v_json->>'entry_item_id')::uuid and entry_id = v_entry.id;
    update commerce_products set estoque_atual = estoque_atual - v_qty, updated_at = now() where id = v_item.product_id;
    insert into commerce_supplier_return_items(return_id, entry_item_id, business_id, owner_id, product_id, descricao, quantidade, valor_unitario, valor_total)
      values(v_return_id, v_item.id, v_entry.business_id, v_entry.owner_id, v_item.product_id, v_item.descricao_documento, v_qty, v_item.valor_unitario, round(v_qty * v_item.valor_unitario,2));
    insert into commerce_inventory_movements(business_id, owner_id, product_id, tipo, quantidade, custo_unitario, entry_id, referencia_externa)
      values(v_entry.business_id, v_entry.owner_id, v_item.product_id, 'devolucao_fornecedor', v_qty, v_item.valor_unitario, v_entry.id, v_return_id::text);
  end loop;

  v_remaining := v_total;
  for v_payable in select * from commerce_accounts_payable
    where entry_id = v_entry.id and owner_id = v_entry.owner_id and status in ('aberta','parcial','vencida') and valor > valor_pago
    order by vencimento desc, created_at desc for update
  loop
    exit when v_remaining <= 0;
    v_adjust := least(v_remaining, v_payable.valor - v_payable.valor_pago);
    update commerce_accounts_payable set
      valor = valor - v_adjust,
      status = case when valor - v_adjust = valor_pago then case when valor_pago > 0 then 'paga' else 'cancelada' end when valor_pago > 0 then 'parcial' when vencimento < current_date then 'vencida' else 'aberta' end,
      updated_at = now()
    where id = v_payable.id;
    v_remaining := v_remaining - v_adjust;
  end loop;
  update commerce_supplier_returns set valor_compensado = v_total - v_remaining, credito_fornecedor = v_remaining,
    status_financeiro = case when v_remaining > 0 then 'credito_pendente' else 'compensado' end
    where id = v_return_id;
  return v_return_id;
end; $$;

revoke all on function commerce_cancelar_entrada(uuid) from public, anon;
revoke all on function commerce_registrar_devolucao_fornecedor(uuid,jsonb,text) from public, anon;
grant execute on function commerce_cancelar_entrada(uuid) to authenticated;
grant execute on function commerce_registrar_devolucao_fornecedor(uuid,jsonb,text) to authenticated;
