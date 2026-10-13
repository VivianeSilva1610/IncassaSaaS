-- Protecoes de integridade e correcao do fechamento de caixa.

alter table commerce_products
  add constraint commerce_products_estoque_nao_negativo check (estoque_atual >= 0) not valid;
alter table commerce_products validate constraint commerce_products_estoque_nao_negativo;

alter table commerce_accounts_receivable
  add constraint commerce_receivable_pago_ate_total check (valor_pago <= valor) not valid;
alter table commerce_accounts_receivable validate constraint commerce_receivable_pago_ate_total;
alter table commerce_accounts_payable
  add constraint commerce_payable_pago_ate_total check (valor_pago <= valor) not valid;
alter table commerce_accounts_payable validate constraint commerce_payable_pago_ate_total;

create or replace function commerce_fechar_caixa(p_session_id uuid,p_saldo_informado numeric,p_observacoes text default null)
returns void language plpgsql security invoker set search_path=public as $$
declare v_session commerce_cash_sessions%rowtype;v_sales numeric(14,2);v_moves numeric(14,2);v_expected numeric(14,2);
begin
  if p_saldo_informado<0 then raise exception 'Saldo informado invalido.';end if;
  select * into v_session from commerce_cash_sessions where id=p_session_id and owner_id=commerce_owner_atual() for update;
  if not found or v_session.status<>'aberto' then raise exception 'Caixa nao esta aberto.';end if;
  select coalesce(sum(valor),0) into v_sales from commerce_sale_payments
    where business_id=v_session.business_id and forma<>'crediario' and status in('confirmado','estornado') and created_at>=v_session.aberto_em;
  select coalesce(sum(case
    when tipo in('entrada_manual','aporte','recebimento_conta','reembolso_fornecedor') then valor
    else -valor end),0) into v_moves
    from commerce_cash_movements where business_id=v_session.business_id and ocorrido_em>=v_session.aberto_em;
  v_expected:=v_session.saldo_inicial+v_sales+v_moves;
  update commerce_cash_sessions set status='fechado',saldo_esperado=v_expected,saldo_informado=p_saldo_informado,
    diferenca=p_saldo_informado-v_expected,fechado_em=now(),fechado_por=auth.uid(),observacoes=nullif(trim(p_observacoes),'')
    where id=v_session.id;
end;$$;
