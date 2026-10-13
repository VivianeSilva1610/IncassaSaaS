-- Cadastro completo de clientes e controle concorrente do limite de crediario.

alter table commerce_customers
  add column if not exists limite_credito numeric(14,2) check (limite_credito is null or limite_credito >= 0),
  add column if not exists observacoes text,
  add column if not exists updated_at timestamptz not null default now();

comment on column commerce_customers.limite_credito is
  'Nulo significa sem limite configurado. Zero bloqueia novas vendas no crediario.';

create index if not exists commerce_customers_business_active_name_idx
  on commerce_customers(business_id, ativo, nome);

create or replace function commerce_concluir_venda(p_sale_id uuid,p_pagamentos jsonb)
returns void language plpgsql security invoker set search_path=public as $$
declare
  v_sale commerce_sales%rowtype; v_item commerce_sale_items%rowtype; v_payment jsonb;
  v_cash numeric(14,2):=0; v_credit numeric(14,2):=0; v_value numeric(14,2); v_form text;
  v_limit numeric(14,2); v_open_credit numeric(14,2):=0;
begin
  select * into v_sale from commerce_sales where id=p_sale_id and owner_id=commerce_owner_atual() for update;
  if not found then raise exception 'Venda nao encontrada.';end if;
  if v_sale.status<>'aberta' then raise exception 'A venda nao esta aberta.';end if;

  for v_payment in select value from jsonb_array_elements(p_pagamentos) loop
    v_form:=v_payment->>'forma'; v_value:=(v_payment->>'valor')::numeric;
    if v_value<=0 then raise exception 'Valor de pagamento invalido.';end if;
    if v_form='crediario' then v_credit:=v_credit+v_value;else v_cash:=v_cash+v_value;end if;
  end loop;
  if round(v_cash+v_credit,2)<>v_sale.total then raise exception 'A soma dos pagamentos deve ser igual ao total da venda.';end if;

  if v_credit>0 then
    if v_sale.customer_id is null then raise exception 'Selecione um cliente para usar crediario.';end if;
    select limite_credito into v_limit from commerce_customers
      where id=v_sale.customer_id and business_id=v_sale.business_id and owner_id=v_sale.owner_id and ativo=true for update;
    if not found then raise exception 'Cliente invalido ou inativo.';end if;
    if v_limit is not null then
      select coalesce(sum(valor),0) into v_open_credit from commerce_accounts_receivable
        where customer_id=v_sale.customer_id and owner_id=v_sale.owner_id and status in('aberta','vencida');
      if v_open_credit+v_credit>v_limit then
        raise exception 'Limite de crediario excedido. Disponivel: R$ %.', greatest(v_limit-v_open_credit,0);
      end if;
    end if;
  end if;

  for v_item in select * from commerce_sale_items where sale_id=p_sale_id loop
    perform 1 from commerce_products where id=v_item.product_id and estoque_atual>=v_item.quantidade for update;
    if not found then raise exception 'Estoque insuficiente para %.',v_item.descricao;end if;
    update commerce_products set estoque_atual=estoque_atual-v_item.quantidade,updated_at=now() where id=v_item.product_id;
    insert into commerce_inventory_movements(business_id,owner_id,product_id,tipo,quantidade,custo_unitario,referencia_externa)
      values(v_sale.business_id,v_sale.owner_id,v_item.product_id,'saida_venda',v_item.quantidade,v_item.custo_unitario_snapshot,v_sale.id::text);
  end loop;
  for v_payment in select value from jsonb_array_elements(p_pagamentos) loop
    v_form:=v_payment->>'forma';v_value:=(v_payment->>'valor')::numeric;
    insert into commerce_sale_payments(sale_id,business_id,owner_id,forma,valor,status,confirmado_em)
      values(v_sale.id,v_sale.business_id,v_sale.owner_id,v_form,v_value,case when v_form='crediario' then 'pendente' else 'confirmado' end,case when v_form='crediario' then null else now() end);
  end loop;
  if v_credit>0 then
    insert into commerce_accounts_receivable(business_id,owner_id,sale_id,customer_id,descricao,valor,vencimento)
      values(v_sale.business_id,v_sale.owner_id,v_sale.id,v_sale.customer_id,'Crediario da venda #'||v_sale.numero,v_credit,current_date+30);
  end if;
  update commerce_sales set status='concluida',valor_pago=v_cash,competencia_em=now(),pago_em=case when v_cash>=total then now() else null end,concluida_em=now() where id=v_sale.id;
end;$$;

revoke all on function commerce_concluir_venda(uuid,jsonb) from public,anon;
grant execute on function commerce_concluir_venda(uuid,jsonb) to authenticated;

