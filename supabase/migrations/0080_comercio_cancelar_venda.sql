-- Cancelamento idempotente: devolve ao estoque exatamente os itens baixados,
-- registra movimentos compensatórios e estorna os pagamentos confirmados.

create or replace function commerce_cancelar_venda(p_sale_id uuid)
returns void language plpgsql security invoker set search_path=public as $$
declare v_sale commerce_sales%rowtype; v_item commerce_sale_items%rowtype;
begin
  select * into v_sale from commerce_sales where id=p_sale_id and owner_id=(select auth.uid()) for update;
  if not found then raise exception 'Venda não encontrada.'; end if;
  if v_sale.status='cancelada' then raise exception 'Esta venda já foi cancelada.'; end if;
  if v_sale.status not in ('concluida','devolvida_parcial') then raise exception 'Somente vendas concluídas podem ser canceladas.'; end if;
  for v_item in select * from commerce_sale_items where sale_id=p_sale_id loop
    perform 1 from commerce_products where id=v_item.product_id for update;
    update commerce_products set estoque_atual=estoque_atual+v_item.quantidade,updated_at=now() where id=v_item.product_id;
    insert into commerce_inventory_movements(business_id,owner_id,product_id,tipo,quantidade,custo_unitario,referencia_externa)
      values(v_sale.business_id,v_sale.owner_id,v_item.product_id,'devolucao_cliente',v_item.quantidade,v_item.custo_unitario_snapshot,'cancelamento:'||v_sale.id::text);
  end loop;
  update commerce_sale_payments set status='estornado' where sale_id=v_sale.id and status='confirmado';
  update commerce_sales set status='cancelada',cancelada_em=now() where id=v_sale.id;
end; $$;

revoke all on function commerce_cancelar_venda(uuid) from public,anon;
grant execute on function commerce_cancelar_venda(uuid) to authenticated;
