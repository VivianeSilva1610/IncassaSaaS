-- Baixas parciais auditaveis para contas a pagar e a receber.

alter table commerce_accounts_receivable add column if not exists valor_pago numeric(14,2) not null default 0 check(valor_pago>=0);
alter table commerce_accounts_payable add column if not exists valor_pago numeric(14,2) not null default 0 check(valor_pago>=0);
update commerce_accounts_receivable set valor_pago=valor where status='paga' and valor_pago=0;
update commerce_accounts_payable set valor_pago=valor where status='paga' and valor_pago=0;
alter table commerce_accounts_receivable drop constraint if exists commerce_accounts_receivable_status_check;
alter table commerce_accounts_receivable add constraint commerce_accounts_receivable_status_check check(status in('aberta','parcial','paga','cancelada','vencida'));
alter table commerce_accounts_payable drop constraint if exists commerce_accounts_payable_status_check;
alter table commerce_accounts_payable add constraint commerce_accounts_payable_status_check check(status in('aberta','parcial','paga','cancelada','vencida'));

create table commerce_account_settlements(
  id uuid primary key default gen_random_uuid(), business_id uuid not null, owner_id uuid not null,
  tipo text not null check(tipo in('receber','pagar')), account_receivable_id uuid, account_payable_id uuid,
  valor numeric(14,2) not null check(valor>0), forma text, liquidado_em timestamptz not null default now(),
  created_by uuid not null default auth.uid() references auth.users(id), created_at timestamptz not null default now(),
  unique(id,business_id,owner_id), foreign key(business_id,owner_id) references commerce_businesses(id,owner_id) on delete cascade,
  foreign key(account_receivable_id,business_id,owner_id) references commerce_accounts_receivable(id,business_id,owner_id),
  foreign key(account_payable_id,business_id,owner_id) references commerce_accounts_payable(id,business_id,owner_id),
  check((tipo='receber' and account_receivable_id is not null and account_payable_id is null) or (tipo='pagar' and account_payable_id is not null and account_receivable_id is null))
);
create index commerce_settlements_receivable_idx on commerce_account_settlements(account_receivable_id,liquidado_em desc);
create index commerce_settlements_payable_idx on commerce_account_settlements(account_payable_id,liquidado_em desc);
alter table commerce_account_settlements enable row level security;
create policy commerce_settlements_tenant on commerce_account_settlements for all using(owner_id=commerce_owner_atual()) with check(owner_id=commerce_owner_atual());

drop index if exists commerce_cash_receivable_payment_unique;
drop index if exists commerce_cash_payable_payment_unique;
alter table commerce_cash_movements add column if not exists settlement_id uuid;
alter table commerce_cash_movements add constraint commerce_cash_settlement_fk foreign key(settlement_id,business_id,owner_id) references commerce_account_settlements(id,business_id,owner_id);
create unique index commerce_cash_settlement_unique on commerce_cash_movements(settlement_id) where settlement_id is not null;

drop function if exists commerce_baixar_conta(text,uuid);
create function commerce_baixar_conta(p_tipo text,p_id uuid,p_valor numeric,p_forma text default null)
returns void language plpgsql security invoker set search_path=public as $$
declare v_r commerce_accounts_receivable%rowtype;v_p commerce_accounts_payable%rowtype;v_s uuid;v_novo numeric(14,2);
begin
 if p_valor<=0 then raise exception 'Valor da baixa deve ser positivo.';end if;
 if p_tipo='receber' then
  select * into v_r from commerce_accounts_receivable where id=p_id and owner_id=commerce_owner_atual() for update;
  if not found then raise exception 'Conta a receber nao encontrada.';end if;
  if v_r.status in('paga','cancelada') then raise exception 'Esta conta nao aceita novas baixas.';end if;
  v_novo:=v_r.valor_pago+p_valor;if v_novo>v_r.valor then raise exception 'Valor excede o saldo de R$ %.',v_r.valor-v_r.valor_pago;end if;
  insert into commerce_account_settlements(business_id,owner_id,tipo,account_receivable_id,valor,forma) values(v_r.business_id,v_r.owner_id,'receber',v_r.id,p_valor,nullif(trim(p_forma),'')) returning id into v_s;
  update commerce_accounts_receivable set valor_pago=v_novo,status=case when v_novo=v_r.valor then 'paga' else 'parcial' end,paga_em=case when v_novo=v_r.valor then now() else null end where id=v_r.id;
  insert into commerce_cash_movements(business_id,owner_id,tipo,descricao,valor,account_receivable_id,settlement_id) values(v_r.business_id,v_r.owner_id,'recebimento_conta','Recebimento: '||v_r.descricao,p_valor,v_r.id,v_s);
  if v_r.sale_id is not null then
   update commerce_sales set valor_pago=least(total,valor_pago+p_valor),pago_em=case when valor_pago+p_valor>=total then now() else pago_em end where id=v_r.sale_id and owner_id=v_r.owner_id;
   if v_novo=v_r.valor then update commerce_sale_payments set status='confirmado',confirmado_em=now() where sale_id=v_r.sale_id and owner_id=v_r.owner_id and forma='crediario' and status='pendente';end if;
  end if;
 elsif p_tipo='pagar' then
  select * into v_p from commerce_accounts_payable where id=p_id and owner_id=commerce_owner_atual() for update;
  if not found then raise exception 'Conta a pagar nao encontrada.';end if;
  if v_p.status in('paga','cancelada') then raise exception 'Esta conta nao aceita novas baixas.';end if;
  v_novo:=v_p.valor_pago+p_valor;if v_novo>v_p.valor then raise exception 'Valor excede o saldo de R$ %.',v_p.valor-v_p.valor_pago;end if;
  insert into commerce_account_settlements(business_id,owner_id,tipo,account_payable_id,valor,forma) values(v_p.business_id,v_p.owner_id,'pagar',v_p.id,p_valor,nullif(trim(p_forma),'')) returning id into v_s;
  update commerce_accounts_payable set valor_pago=v_novo,status=case when v_novo=v_p.valor then 'paga' else 'parcial' end,paga_em=case when v_novo=v_p.valor then now() else null end where id=v_p.id;
  insert into commerce_cash_movements(business_id,owner_id,tipo,descricao,valor,account_payable_id,settlement_id) values(v_p.business_id,v_p.owner_id,'pagamento_conta','Pagamento: '||v_p.descricao,p_valor,v_p.id,v_s);
 else raise exception 'Tipo de conta invalido.';end if;
end;$$;
revoke all on function commerce_baixar_conta(text,uuid,numeric,text) from public,anon;
grant execute on function commerce_baixar_conta(text,uuid,numeric,text) to authenticated;
