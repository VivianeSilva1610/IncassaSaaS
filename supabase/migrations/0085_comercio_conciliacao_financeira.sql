-- Concilia contas a pagar/receber com o caixa e mantém cancelamentos auditáveis.

alter table commerce_cash_movements
  add column if not exists account_receivable_id uuid,
  add column if not exists account_payable_id uuid;

alter table commerce_cash_movements
  drop constraint if exists commerce_cash_movements_tipo_check;
alter table commerce_cash_movements
  add constraint commerce_cash_movements_tipo_check check (
    tipo in (
      'entrada_manual', 'saida_manual', 'aporte', 'retirada',
      'recebimento_conta', 'pagamento_conta', 'estorno_recebimento'
    )
  );

alter table commerce_cash_movements
  add constraint commerce_cash_receivable_fk
  foreign key (account_receivable_id, business_id, owner_id)
  references commerce_accounts_receivable(id, business_id, owner_id);

alter table commerce_cash_movements
  add constraint commerce_cash_payable_fk
  foreign key (account_payable_id, business_id, owner_id)
  references commerce_accounts_payable(id, business_id, owner_id);

create unique index commerce_cash_receivable_payment_unique
  on commerce_cash_movements(account_receivable_id)
  where tipo = 'recebimento_conta';
create unique index commerce_cash_receivable_refund_unique
  on commerce_cash_movements(account_receivable_id)
  where tipo = 'estorno_recebimento';
create unique index commerce_cash_payable_payment_unique
  on commerce_cash_movements(account_payable_id)
  where tipo = 'pagamento_conta';

create or replace function commerce_baixar_conta(p_tipo text, p_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_receivable commerce_accounts_receivable%rowtype;
  v_payable commerce_accounts_payable%rowtype;
begin
  if p_tipo = 'receber' then
    select * into v_receivable
    from commerce_accounts_receivable
    where id = p_id and owner_id = commerce_owner_atual()
    for update;

    if not found then raise exception 'Conta a receber nao encontrada.'; end if;
    if v_receivable.status = 'paga' then return; end if;
    if v_receivable.status not in ('aberta', 'vencida') then
      raise exception 'Esta conta a receber nao pode ser baixada.';
    end if;

    update commerce_accounts_receivable
    set status = 'paga', paga_em = now()
    where id = v_receivable.id and owner_id = v_receivable.owner_id;

    insert into commerce_cash_movements(
      business_id, owner_id, tipo, descricao, valor, account_receivable_id
    ) values (
      v_receivable.business_id, v_receivable.owner_id, 'recebimento_conta',
      'Recebimento: ' || v_receivable.descricao, v_receivable.valor, v_receivable.id
    );

    if v_receivable.sale_id is not null then
      update commerce_sale_payments
      set status = 'confirmado', confirmado_em = now()
      where sale_id = v_receivable.sale_id
        and owner_id = v_receivable.owner_id
        and forma = 'crediario'
        and status = 'pendente';

      update commerce_sales
      set valor_pago = least(total, valor_pago + v_receivable.valor),
          pago_em = case when valor_pago + v_receivable.valor >= total then now() else pago_em end
      where id = v_receivable.sale_id and owner_id = v_receivable.owner_id;
    end if;

  elsif p_tipo = 'pagar' then
    select * into v_payable
    from commerce_accounts_payable
    where id = p_id and owner_id = commerce_owner_atual()
    for update;

    if not found then raise exception 'Conta a pagar nao encontrada.'; end if;
    if v_payable.status = 'paga' then return; end if;
    if v_payable.status not in ('aberta', 'vencida') then
      raise exception 'Esta conta a pagar nao pode ser baixada.';
    end if;

    update commerce_accounts_payable
    set status = 'paga', paga_em = now()
    where id = v_payable.id and owner_id = v_payable.owner_id;

    insert into commerce_cash_movements(
      business_id, owner_id, tipo, descricao, valor, account_payable_id
    ) values (
      v_payable.business_id, v_payable.owner_id, 'pagamento_conta',
      'Pagamento: ' || v_payable.descricao, v_payable.valor, v_payable.id
    );
  else
    raise exception 'Tipo de conta invalido.';
  end if;
end;
$$;

revoke all on function commerce_baixar_conta(text, uuid) from public, anon;
grant execute on function commerce_baixar_conta(text, uuid) to authenticated;

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
  where id = p_sale_id and owner_id = commerce_owner_atual()
  for update;
  if not found then raise exception 'Venda nao encontrada.'; end if;
  if v_sale.status = 'cancelada' then raise exception 'Esta venda ja foi cancelada.'; end if;
  if v_sale.status not in ('concluida', 'devolvida_parcial') then
    raise exception 'Somente vendas concluidas podem ser canceladas.';
  end if;

  for v_item in select * from commerce_sale_items
    where sale_id = p_sale_id and owner_id = v_sale.owner_id
  loop
    perform 1 from commerce_products
    where id = v_item.product_id and owner_id = v_sale.owner_id for update;
    update commerce_products
    set estoque_atual = estoque_atual + v_item.quantidade, updated_at = now()
    where id = v_item.product_id and owner_id = v_sale.owner_id;
    insert into commerce_inventory_movements(
      business_id, owner_id, product_id, tipo, quantidade, custo_unitario, referencia_externa
    ) values (
      v_sale.business_id, v_sale.owner_id, v_item.product_id, 'devolucao_cliente',
      v_item.quantidade, v_item.custo_unitario_snapshot, 'cancelamento:' || v_sale.id::text
    );
  end loop;

  for v_receivable in select * from commerce_accounts_receivable
    where sale_id = v_sale.id and owner_id = v_sale.owner_id for update
  loop
    if v_receivable.status = 'paga' then
      insert into commerce_cash_movements(
        business_id, owner_id, tipo, descricao, valor, account_receivable_id
      ) values (
        v_receivable.business_id, v_receivable.owner_id, 'estorno_recebimento',
        'Estorno: ' || v_receivable.descricao, v_receivable.valor, v_receivable.id
      ) on conflict do nothing;
    end if;
    update commerce_accounts_receivable
    set status = 'cancelada'
    where id = v_receivable.id;
  end loop;

  update commerce_sale_payments set status = 'estornado'
  where sale_id = v_sale.id and owner_id = v_sale.owner_id
    and status in ('confirmado', 'pendente');
  update commerce_sales
  set status = 'cancelada', cancelada_em = now()
  where id = v_sale.id and owner_id = v_sale.owner_id;
end;
$$;

revoke all on function commerce_cancelar_venda(uuid) from public, anon;
grant execute on function commerce_cancelar_venda(uuid) to authenticated;
