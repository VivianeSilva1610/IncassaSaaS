-- Sessoes de caixa e estornos no periodo em que realmente ocorreram.

alter table commerce_cash_movements add column if not exists sale_payment_id uuid references commerce_sale_payments(id);
alter table commerce_cash_movements drop constraint if exists commerce_cash_movements_tipo_check;
alter table commerce_cash_movements add constraint commerce_cash_movements_tipo_check check (
  tipo in ('entrada_manual','saida_manual','aporte','retirada','recebimento_conta','pagamento_conta','estorno_recebimento','estorno_venda')
);
create unique index commerce_cash_sale_refund_unique on commerce_cash_movements(sale_payment_id) where tipo='estorno_venda';

create or replace function commerce_registrar_estorno_pagamento()
returns trigger language plpgsql security invoker set search_path=public as $$
begin
  if old.status='confirmado' and new.status='estornado' and old.forma<>'crediario' then
    insert into commerce_cash_movements(business_id,owner_id,tipo,descricao,valor,sale_payment_id)
    values(old.business_id,old.owner_id,'estorno_venda','Estorno de venda',old.valor,old.id)
    on conflict do nothing;
  end if;
  return new;
end;$$;
drop trigger if exists commerce_sale_payment_refund_cash on commerce_sale_payments;
create trigger commerce_sale_payment_refund_cash after update of status on commerce_sale_payments
for each row execute function commerce_registrar_estorno_pagamento();

create table commerce_cash_sessions (
  id uuid primary key default gen_random_uuid(), business_id uuid not null, owner_id uuid not null,
  status text not null default 'aberto' check(status in('aberto','fechado')),
  saldo_inicial numeric(14,2) not null default 0 check(saldo_inicial>=0),
  saldo_esperado numeric(14,2), saldo_informado numeric(14,2), diferenca numeric(14,2),
  aberto_em timestamptz not null default now(), aberto_por uuid not null default auth.uid() references auth.users(id),
  fechado_em timestamptz, fechado_por uuid references auth.users(id), observacoes text,
  unique(id,business_id,owner_id), foreign key(business_id,owner_id) references commerce_businesses(id,owner_id) on delete cascade
);
create unique index commerce_cash_one_open_session on commerce_cash_sessions(business_id) where status='aberto';
create index commerce_cash_sessions_history on commerce_cash_sessions(business_id,aberto_em desc);
alter table commerce_cash_sessions enable row level security;
create policy commerce_cash_sessions_tenant on commerce_cash_sessions for all using(owner_id=commerce_owner_atual()) with check(owner_id=commerce_owner_atual());

create or replace function commerce_abrir_caixa(p_business_id uuid,p_saldo_inicial numeric)
returns uuid language plpgsql security invoker set search_path=public as $$
declare v_id uuid; begin
  if p_saldo_inicial<0 then raise exception 'Saldo inicial invalido.'; end if;
  if not exists(select 1 from commerce_businesses where id=p_business_id and owner_id=commerce_owner_atual()) then raise exception 'Empresa nao encontrada.'; end if;
  insert into commerce_cash_sessions(business_id,owner_id,saldo_inicial)
  values(p_business_id,commerce_owner_atual(),p_saldo_inicial) returning id into v_id;
  return v_id;
end;$$;

create or replace function commerce_fechar_caixa(p_session_id uuid,p_saldo_informado numeric,p_observacoes text default null)
returns void language plpgsql security invoker set search_path=public as $$
declare v_session commerce_cash_sessions%rowtype;v_sales numeric(14,2);v_moves numeric(14,2);v_expected numeric(14,2);begin
  if p_saldo_informado<0 then raise exception 'Saldo informado invalido.';end if;
  select * into v_session from commerce_cash_sessions where id=p_session_id and owner_id=commerce_owner_atual() for update;
  if not found or v_session.status<>'aberto' then raise exception 'Caixa nao esta aberto.';end if;
  select coalesce(sum(valor),0) into v_sales from commerce_sale_payments where business_id=v_session.business_id and forma<>'crediario' and status in('confirmado','estornado') and created_at>=v_session.aberto_em;
  select coalesce(sum(case when tipo in('entrada_manual','aporte','recebimento_conta') then valor else -valor end),0) into v_moves from commerce_cash_movements where business_id=v_session.business_id and ocorrido_em>=v_session.aberto_em;
  v_expected:=v_session.saldo_inicial+v_sales+v_moves;
  update commerce_cash_sessions set status='fechado',saldo_esperado=v_expected,saldo_informado=p_saldo_informado,diferenca=p_saldo_informado-v_expected,fechado_em=now(),fechado_por=auth.uid(),observacoes=nullif(trim(p_observacoes),'') where id=v_session.id;
end;$$;
revoke all on function commerce_abrir_caixa(uuid,numeric) from public,anon;grant execute on function commerce_abrir_caixa(uuid,numeric) to authenticated;
revoke all on function commerce_fechar_caixa(uuid,numeric,text) from public,anon;grant execute on function commerce_fechar_caixa(uuid,numeric,text) to authenticated;
