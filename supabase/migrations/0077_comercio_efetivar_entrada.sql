-- Efetivação atômica de entradas do INCASSA Comércio.
-- A função vincula os itens conferidos, registra o razão de estoque,
-- recalcula custo médio ponderado e atualiza saldos numa única transação.

alter table commerce_stock_entry_items add column if not exists gtin_documento text;
alter table commerce_stock_entry_items add column if not exists cest_documento text;

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
  where id = p_entry_id and owner_id = (select auth.uid())
  for update;

  if not found then raise exception 'Entrada não encontrada.'; end if;
  if v_entry.status = 'efetivada' then raise exception 'Esta entrada já foi efetivada.'; end if;
  if v_entry.status = 'cancelada' then raise exception 'Uma entrada cancelada não pode ser efetivada.'; end if;

  for v_item in
    select * from commerce_stock_entry_items
    where entry_id = p_entry_id and owner_id = (select auth.uid())
    order by created_at, id
  loop
    select value into v_map from jsonb_array_elements(p_mapeamentos) value
    where value->>'item_id' = v_item.id::text limit 1;
    v_product_id := nullif(v_map->>'product_id', '')::uuid;
    if v_product_id is null then raise exception 'Todos os itens precisam estar vinculados a um produto.'; end if;

    select * into v_product from commerce_products
    where id = v_product_id and business_id = v_entry.business_id and owner_id = v_entry.owner_id
    for update;
    if not found then raise exception 'Produto de destino inválido.'; end if;

    v_novo_saldo := v_product.estoque_atual + v_item.quantidade;
    v_novo_custo := case
      when v_novo_saldo <= 0 then v_item.valor_unitario
      else round(((v_product.estoque_atual * v_product.custo_medio) + (v_item.quantidade * v_item.valor_unitario)) / v_novo_saldo, 4)
    end;

    update commerce_stock_entry_items set product_id = v_product_id where id = v_item.id;
    insert into commerce_inventory_movements (
      business_id, owner_id, product_id, tipo, quantidade, custo_unitario, entry_id
    ) values (
      v_entry.business_id, v_entry.owner_id, v_product_id,
      case when v_entry.origem = 'nfe_xml' then 'entrada_nfe' else 'entrada_compra' end,
      v_item.quantidade, v_item.valor_unitario, v_entry.id
    );
    update commerce_products
    set estoque_atual = v_novo_saldo, custo_medio = v_novo_custo, updated_at = now()
    where id = v_product_id;
  end loop;

  if not exists (select 1 from commerce_stock_entry_items where entry_id = p_entry_id) then
    raise exception 'A entrada não possui itens.';
  end if;

  update commerce_stock_entries
  set status = 'efetivada', efetivada_em = now(), efetivada_por = (select auth.uid()), updated_at = now()
  where id = p_entry_id;
end;
$$;

revoke all on function commerce_efetivar_entrada(uuid, jsonb) from public, anon;
grant execute on function commerce_efetivar_entrada(uuid, jsonb) to authenticated;
