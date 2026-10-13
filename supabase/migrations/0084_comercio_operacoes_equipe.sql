-- Permite que integrantes da equipe operem o tenant do proprietario.
-- O usuario que executou a operacao continua registrado em created_by /
-- efetivada_por, enquanto owner_id identifica o tenant dos dados.

create or replace function commerce_efetivar_entrada(p_entry_id uuid, p_mapeamentos jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_entry commerce_stock_entries%rowtype;
  v_item commerce_stock_entry_items%rowtype;
  v_product commerce_products%rowtype;
  v_map jsonb;
  v_product_id uuid;
  v_novo_saldo numeric(14,4);
  v_novo_custo numeric(14,4);
begin
  select * into v_entry
  from commerce_stock_entries
  where id = p_entry_id and owner_id = commerce_owner_atual()
  for update;

  if not found then raise exception 'Entrada nao encontrada.'; end if;
  if v_entry.status = 'efetivada' then raise exception 'Esta entrada ja foi efetivada.'; end if;
  if v_entry.status = 'cancelada' then raise exception 'Uma entrada cancelada nao pode ser efetivada.'; end if;

  for v_item in
    select * from commerce_stock_entry_items
    where entry_id = p_entry_id and owner_id = commerce_owner_atual()
    order by created_at, id
  loop
    select value into v_map
    from jsonb_array_elements(p_mapeamentos) value
    where value->>'item_id' = v_item.id::text
    limit 1;

    v_product_id := nullif(v_map->>'product_id', '')::uuid;
    if v_product_id is null then
      raise exception 'Todos os itens precisam estar vinculados a um produto.';
    end if;

    select * into v_product
    from commerce_products
    where id = v_product_id
      and business_id = v_entry.business_id
      and owner_id = v_entry.owner_id
    for update;

    if not found then raise exception 'Produto de destino invalido.'; end if;

    v_novo_saldo := v_product.estoque_atual + v_item.quantidade;
    v_novo_custo := case
      when v_novo_saldo <= 0 then v_item.valor_unitario
      else round(
        ((v_product.estoque_atual * v_product.custo_medio) +
         (v_item.quantidade * v_item.valor_unitario)) / v_novo_saldo,
        4
      )
    end;

    update commerce_stock_entry_items
    set product_id = v_product_id
    where id = v_item.id;

    insert into commerce_inventory_movements (
      business_id, owner_id, product_id, tipo, quantidade, custo_unitario, entry_id
    ) values (
      v_entry.business_id, v_entry.owner_id, v_product_id,
      case when v_entry.origem = 'nfe_xml' then 'entrada_nfe' else 'entrada_compra' end,
      v_item.quantidade, v_item.valor_unitario, v_entry.id
    );

    update commerce_products
    set estoque_atual = v_novo_saldo,
        custo_medio = v_novo_custo,
        updated_at = now()
    where id = v_product_id;
  end loop;

  if not exists (
    select 1 from commerce_stock_entry_items where entry_id = p_entry_id
  ) then
    raise exception 'A entrada nao possui itens.';
  end if;

  update commerce_stock_entries
  set status = 'efetivada',
      efetivada_em = now(),
      efetivada_por = (select auth.uid()),
      updated_at = now()
  where id = p_entry_id and owner_id = commerce_owner_atual();
end;
$$;

revoke all on function commerce_efetivar_entrada(uuid, jsonb) from public, anon;
grant execute on function commerce_efetivar_entrada(uuid, jsonb) to authenticated;

create or replace function commerce_cancelar_venda(p_sale_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_sale commerce_sales%rowtype;
  v_item commerce_sale_items%rowtype;
begin
  select * into v_sale
  from commerce_sales
  where id = p_sale_id and owner_id = commerce_owner_atual()
  for update;

  if not found then raise exception 'Venda nao encontrada.'; end if;
  if v_sale.status = 'cancelada' then raise exception 'Esta venda ja foi cancelada.'; end if;
  if v_sale.status not in ('concluida', 'devolvida_parcial') then
    raise exception 'Somente vendas concluidas podem ser canceladas.';
  end if;

  for v_item in
    select * from commerce_sale_items
    where sale_id = p_sale_id and owner_id = v_sale.owner_id
  loop
    perform 1
    from commerce_products
    where id = v_item.product_id and owner_id = v_sale.owner_id
    for update;

    update commerce_products
    set estoque_atual = estoque_atual + v_item.quantidade,
        updated_at = now()
    where id = v_item.product_id and owner_id = v_sale.owner_id;

    insert into commerce_inventory_movements (
      business_id, owner_id, product_id, tipo, quantidade,
      custo_unitario, referencia_externa
    ) values (
      v_sale.business_id, v_sale.owner_id, v_item.product_id,
      'devolucao_cliente', v_item.quantidade,
      v_item.custo_unitario_snapshot, 'cancelamento:' || v_sale.id::text
    );
  end loop;

  update commerce_sale_payments
  set status = 'estornado'
  where sale_id = v_sale.id
    and owner_id = v_sale.owner_id
    and status = 'confirmado';

  update commerce_sales
  set status = 'cancelada', cancelada_em = now()
  where id = v_sale.id and owner_id = v_sale.owner_id;
end;
$$;

revoke all on function commerce_cancelar_venda(uuid) from public, anon;
grant execute on function commerce_cancelar_venda(uuid) to authenticated;
