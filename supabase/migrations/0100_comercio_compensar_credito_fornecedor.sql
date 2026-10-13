-- Uso de credito de fornecedor em uma conta a pagar futura, sem movimentar caixa.
create table commerce_supplier_credit_compensations(
 id uuid primary key default gen_random_uuid(),business_id uuid not null,owner_id uuid not null,
 supplier_return_id uuid not null,account_payable_id uuid not null,valor numeric(14,2) not null check(valor>0),
 observacoes text,created_by uuid not null default auth.uid() references auth.users(id),created_at timestamptz not null default now(),
 unique(id,business_id,owner_id),
 foreign key(business_id,owner_id) references commerce_businesses(id,owner_id) on delete cascade,
 foreign key(supplier_return_id,business_id,owner_id) references commerce_supplier_returns(id,business_id,owner_id),
 foreign key(account_payable_id,business_id,owner_id) references commerce_accounts_payable(id,business_id,owner_id)
);
create index commerce_supplier_credit_comp_return_idx on commerce_supplier_credit_compensations(supplier_return_id,created_at desc);
create index commerce_supplier_credit_comp_payable_idx on commerce_supplier_credit_compensations(account_payable_id);
alter table commerce_supplier_credit_compensations enable row level security;
create policy commerce_supplier_credit_compensations_module on commerce_supplier_credit_compensations for all
 using(owner_id=commerce_owner_atual() and commerce_tem_modulo('financeiro'))
 with check(owner_id=commerce_owner_atual() and commerce_tem_modulo('financeiro'));

create function commerce_credito_fornecedor_usado(p_return_id uuid,p_owner_id uuid)
returns numeric language sql stable security invoker set search_path=public as $$
 select coalesce((select sum(valor) from commerce_supplier_credit_refunds where supplier_return_id=p_return_id and owner_id=p_owner_id),0)
      + coalesce((select sum(valor) from commerce_supplier_credit_compensations where supplier_return_id=p_return_id and owner_id=p_owner_id),0)
$$;

create function commerce_compensar_credito_fornecedor(p_return_id uuid,p_account_payable_id uuid,p_valor numeric,p_observacoes text default null)
returns uuid language plpgsql security invoker set search_path=public as $$
declare r commerce_supplier_returns%rowtype;p commerce_accounts_payable%rowtype;usado numeric(14,2);v_id uuid;
begin
 select * into r from commerce_supplier_returns where id=p_return_id and owner_id=commerce_owner_atual() for update;
 if not found then raise exception 'Credito nao encontrado.';end if;
 usado:=commerce_credito_fornecedor_usado(r.id,r.owner_id);
 if p_valor<=0 or p_valor>r.credito_fornecedor-usado then raise exception 'Valor excede o credito disponivel de R$ %.',r.credito_fornecedor-usado;end if;
 select * into p from commerce_accounts_payable where id=p_account_payable_id and business_id=r.business_id and owner_id=r.owner_id for update;
 if not found or p.supplier_id is distinct from r.supplier_id then raise exception 'A conta deve pertencer ao mesmo fornecedor.';end if;
 if p.status not in('aberta','parcial','vencida') or p_valor>p.valor-p.valor_pago then raise exception 'Valor excede o saldo da conta a pagar.';end if;
 insert into commerce_supplier_credit_compensations(business_id,owner_id,supplier_return_id,account_payable_id,valor,observacoes)
 values(r.business_id,r.owner_id,r.id,p.id,p_valor,nullif(trim(p_observacoes),'')) returning id into v_id;
 update commerce_accounts_payable set valor=valor-p_valor,
  status=case when valor-p_valor=valor_pago then case when valor_pago>0 then 'paga' else 'cancelada' end when valor_pago>0 then 'parcial' when vencimento<current_date then 'vencida' else 'aberta' end,
  updated_at=now() where id=p.id;
 if usado+p_valor=r.credito_fornecedor then update commerce_supplier_returns set status_financeiro='compensado' where id=r.id;end if;
 return v_id;
end;$$;

create or replace function commerce_receber_credito_fornecedor(p_return_id uuid,p_valor numeric,p_forma text default null,p_observacoes text default null)
returns uuid language plpgsql security invoker set search_path=public as $$
declare r commerce_supplier_returns%rowtype;usado numeric(14,2);v_id uuid;
begin
 select * into r from commerce_supplier_returns where id=p_return_id and owner_id=commerce_owner_atual() for update;
 if not found then raise exception 'Credito nao encontrado.';end if;
 usado:=commerce_credito_fornecedor_usado(r.id,r.owner_id);
 if p_valor<=0 or p_valor>r.credito_fornecedor-usado then raise exception 'Valor excede o credito disponivel de R$ %.',r.credito_fornecedor-usado;end if;
 insert into commerce_supplier_credit_refunds(business_id,owner_id,supplier_return_id,valor,forma,observacoes) values(r.business_id,r.owner_id,r.id,p_valor,nullif(trim(p_forma),''),nullif(trim(p_observacoes),'')) returning id into v_id;
 insert into commerce_cash_movements(business_id,owner_id,tipo,descricao,valor,supplier_credit_refund_id) values(r.business_id,r.owner_id,'reembolso_fornecedor','Reembolso recebido de fornecedor',p_valor,v_id);
 if usado+p_valor=r.credito_fornecedor then update commerce_supplier_returns set status_financeiro='compensado' where id=r.id;end if;
 return v_id;
end;$$;
revoke all on function commerce_credito_fornecedor_usado(uuid,uuid) from public,anon;
revoke all on function commerce_compensar_credito_fornecedor(uuid,uuid,numeric,text) from public,anon;
grant execute on function commerce_credito_fornecedor_usado(uuid,uuid) to authenticated;
grant execute on function commerce_compensar_credito_fornecedor(uuid,uuid,numeric,text) to authenticated;
