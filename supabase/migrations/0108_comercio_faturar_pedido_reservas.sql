-- Faturamento transacional de pedidos e proteção do estoque reservado.

alter table commerce_sales_orders add column if not exists sale_id uuid;
alter table commerce_sales_orders add constraint commerce_sales_order_sale_fk
  foreign key(sale_id,business_id,owner_id) references commerce_sales(id,business_id,owner_id);
create unique index commerce_sales_orders_sale_uidx on commerce_sales_orders(sale_id) where sale_id is not null;

alter table commerce_sales_orders drop constraint if exists commerce_sales_orders_status_check;
alter table commerce_sales_orders add constraint commerce_sales_orders_status_check
  check(status in('aberto','separacao','pronto','faturado','cancelado','expirado'));

create index commerce_reservations_active_product_idx
  on commerce_stock_reservations(business_id,product_id,variant_id,expires_at)
  where status='ativa';

create function commerce_expirar_reservas() returns integer
language plpgsql security invoker set search_path=public as $$
declare n integer;
begin
  update commerce_stock_reservations
     set status='expirada',updated_at=now()
   where owner_id=commerce_owner_atual() and status='ativa' and expires_at is not null and expires_at<=now();
  get diagnostics n=row_count;
  update commerce_sales_orders o set status='expirado',updated_at=now()
   where o.owner_id=commerce_owner_atual() and o.status in('aberto','separacao','pronto') and o.reserva_ate is not null and o.reserva_ate<=now();
  return n;
end; $$;

create or replace function commerce_concluir_venda(p_sale_id uuid,p_pagamentos jsonb)
returns void language plpgsql security invoker set search_path=public as $$
declare
  v_sale commerce_sales%rowtype; v_item commerce_sale_items%rowtype; v_payment jsonb;
  v_cash numeric(14,2):=0; v_credit numeric(14,2):=0; v_value numeric(14,2); v_form text;
  v_limit numeric(14,2); v_open_credit numeric(14,2):=0; v_available numeric(14,4);
begin
  perform commerce_expirar_reservas();
  select * into v_sale from commerce_sales where id=p_sale_id and owner_id=commerce_owner_atual() for update;
  if not found then raise exception 'Venda nao encontrada.';end if;
  if v_sale.status<>'aberta' then raise exception 'A venda nao esta aberta.';end if;
  if jsonb_typeof(p_pagamentos)<>'array' or jsonb_array_length(p_pagamentos)=0 then raise exception 'Informe os pagamentos.';end if;
  for v_payment in select value from jsonb_array_elements(p_pagamentos) loop
    v_form:=v_payment->>'forma';v_value:=(v_payment->>'valor')::numeric;
    if v_form not in('dinheiro','pix','debito','credito','boleto','crediario','outro') or v_value<=0 then raise exception 'Pagamento invalido.';end if;
    if v_form='crediario' then v_credit:=v_credit+v_value;else v_cash:=v_cash+v_value;end if;
  end loop;
  if round(v_cash+v_credit,2)<>v_sale.total then raise exception 'A soma dos pagamentos deve ser igual ao total da venda.';end if;
  if v_credit>0 then
    if v_sale.customer_id is null then raise exception 'Selecione um cliente para usar crediario.';end if;
    select limite_credito into v_limit from commerce_customers where id=v_sale.customer_id and business_id=v_sale.business_id and owner_id=v_sale.owner_id and ativo for update;
    if not found then raise exception 'Cliente invalido ou inativo.';end if;
    if v_limit is not null then
      select coalesce(sum(valor-valor_pago),0) into v_open_credit from commerce_accounts_receivable where customer_id=v_sale.customer_id and owner_id=v_sale.owner_id and status in('aberta','parcial','vencida');
      if v_open_credit+v_credit>v_limit then raise exception 'Limite de crediario excedido. Disponivel: R$ %.',greatest(v_limit-v_open_credit,0);end if;
    end if;
  end if;
  for v_item in select * from commerce_sale_items where sale_id=p_sale_id order by product_id,variant_id nulls first,id loop
    select p.estoque_atual-coalesce((select sum(r.quantidade) from commerce_stock_reservations r where r.product_id=p.id and r.status='ativa' and (r.expires_at is null or r.expires_at>now())),0)
      into v_available from commerce_products p where p.id=v_item.product_id and p.owner_id=v_sale.owner_id for update;
    if coalesce(v_available,0)<v_item.quantidade then raise exception 'Estoque disponivel insuficiente para %.',v_item.descricao;end if;
    if v_item.variant_id is not null then
      select v.estoque_atual-coalesce((select sum(r.quantidade) from commerce_stock_reservations r where r.variant_id=v.id and r.status='ativa' and (r.expires_at is null or r.expires_at>now())),0)
        into v_available from commerce_product_variants v where v.id=v_item.variant_id and v.owner_id=v_sale.owner_id for update;
      if coalesce(v_available,0)<v_item.quantidade then raise exception 'Estoque disponivel insuficiente para a variacao de %.',v_item.descricao;end if;
    end if;
    update commerce_products set estoque_atual=estoque_atual-v_item.quantidade,updated_at=now() where id=v_item.product_id;
    insert into commerce_inventory_movements(business_id,owner_id,product_id,variant_id,tipo,quantidade,custo_unitario,referencia_externa)
      values(v_sale.business_id,v_sale.owner_id,v_item.product_id,v_item.variant_id,'saida_venda',v_item.quantidade,v_item.custo_unitario_snapshot,v_sale.id::text);
  end loop;
  for v_payment in select value from jsonb_array_elements(p_pagamentos) loop
    v_form:=v_payment->>'forma';v_value:=(v_payment->>'valor')::numeric;
    insert into commerce_sale_payments(sale_id,business_id,owner_id,forma,valor,status,confirmado_em)
    values(v_sale.id,v_sale.business_id,v_sale.owner_id,v_form,v_value,case when v_form='crediario' then 'pendente' else 'confirmado' end,case when v_form='crediario' then null else now() end);
  end loop;
  if v_credit>0 then insert into commerce_accounts_receivable(business_id,owner_id,sale_id,customer_id,descricao,valor,vencimento) values(v_sale.business_id,v_sale.owner_id,v_sale.id,v_sale.customer_id,'Crediario da venda #'||v_sale.numero,v_credit,current_date+30);end if;
  update commerce_sales set status='concluida',valor_pago=v_cash,competencia_em=now(),pago_em=case when v_cash>=total then now() else null end,concluida_em=now() where id=v_sale.id;
end; $$;

create function commerce_faturar_pedido_venda(p_order_id uuid,p_pagamentos jsonb) returns uuid
language plpgsql security invoker set search_path=public as $$
declare o commerce_sales_orders%rowtype;i commerce_sales_order_items%rowtype;v_sale_id uuid;cost numeric(14,4);
begin
  perform commerce_expirar_reservas();
  select * into o from commerce_sales_orders where id=p_order_id and owner_id=commerce_owner_atual() for update;
  if not found or o.status not in('aberto','separacao','pronto') then raise exception 'Pedido nao pode ser faturado.';end if;
  if not exists(select 1 from commerce_sales_order_items where order_id=o.id) then raise exception 'Pedido sem itens.';end if;
  if exists(select 1 from commerce_stock_reservations where order_id=o.id and status<>'ativa') then raise exception 'A reserva do pedido nao esta mais ativa.';end if;
  insert into commerce_sales(business_id,owner_id,customer_id,subtotal,desconto,total) values(o.business_id,o.owner_id,o.customer_id,o.subtotal,o.desconto,o.total) returning id into v_sale_id;
  for i in select * from commerce_sales_order_items where order_id=o.id order by product_id,variant_id nulls first,id loop
    if not exists(select 1 from commerce_stock_reservations where order_item_id=i.id and status='ativa' and quantidade=i.quantidade) then raise exception 'Reserva incompleta para %.',i.descricao;end if;
    if i.variant_id is null then select custo_medio into cost from commerce_products where id=i.product_id;else select custo_medio into cost from commerce_product_variants where id=i.variant_id;end if;
    insert into commerce_sale_items(sale_id,business_id,owner_id,product_id,variant_id,descricao,quantidade,preco_unitario,desconto,total,custo_unitario_snapshot)
    values(v_sale_id,o.business_id,o.owner_id,i.product_id,i.variant_id,i.descricao,i.quantidade,i.preco_unitario,i.desconto,i.total,coalesce(cost,0));
  end loop;
  update commerce_stock_reservations set status='consumida',updated_at=now() where order_id=o.id and status='ativa';
  perform commerce_concluir_venda(v_sale_id,p_pagamentos);
  update commerce_sales_orders set status='faturado',sale_id=v_sale_id,updated_at=now() where id=o.id;
  return v_sale_id;
end; $$;

revoke all on function commerce_expirar_reservas() from public,anon;
revoke all on function commerce_faturar_pedido_venda(uuid,jsonb) from public,anon;
grant execute on function commerce_expirar_reservas() to authenticated;
grant execute on function commerce_faturar_pedido_venda(uuid,jsonb) to authenticated;
