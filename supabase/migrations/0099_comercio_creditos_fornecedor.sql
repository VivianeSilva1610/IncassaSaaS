-- Recebimento auditavel de creditos de devolucoes a fornecedores.
alter table commerce_cash_movements drop constraint if exists commerce_cash_movements_tipo_check;
alter table commerce_cash_movements add constraint commerce_cash_movements_tipo_check check(tipo in('entrada_manual','saida_manual','aporte','retirada','recebimento_conta','pagamento_conta','estorno_recebimento','estorno_venda','reembolso_fornecedor'));

create table commerce_supplier_credit_refunds(
 id uuid primary key default gen_random_uuid(),business_id uuid not null,owner_id uuid not null,supplier_return_id uuid not null,
 valor numeric(14,2) not null check(valor>0),forma text,observacoes text,created_by uuid not null default auth.uid() references auth.users(id),created_at timestamptz not null default now(),
 unique(id,business_id,owner_id),foreign key(business_id,owner_id) references commerce_businesses(id,owner_id) on delete cascade,
 foreign key(supplier_return_id,business_id,owner_id) references commerce_supplier_returns(id,business_id,owner_id)
);
alter table commerce_supplier_credit_refunds enable row level security;
create policy commerce_supplier_credit_refunds_module on commerce_supplier_credit_refunds for all using(owner_id=commerce_owner_atual() and commerce_tem_modulo('financeiro')) with check(owner_id=commerce_owner_atual() and commerce_tem_modulo('financeiro'));
alter table commerce_cash_movements add column if not exists supplier_credit_refund_id uuid;
alter table commerce_cash_movements add constraint commerce_cash_supplier_refund_fk foreign key(supplier_credit_refund_id,business_id,owner_id) references commerce_supplier_credit_refunds(id,business_id,owner_id);
create unique index commerce_cash_supplier_refund_unique on commerce_cash_movements(supplier_credit_refund_id) where supplier_credit_refund_id is not null;

create function commerce_receber_credito_fornecedor(p_return_id uuid,p_valor numeric,p_forma text default null,p_observacoes text default null)
returns uuid language plpgsql security invoker set search_path=public as $$
declare r commerce_supplier_returns%rowtype;usado numeric(14,2);v_id uuid;
begin
 select * into r from commerce_supplier_returns where id=p_return_id and owner_id=commerce_owner_atual() for update;
 if not found then raise exception 'Credito nao encontrado.';end if;
 select coalesce(sum(valor),0) into usado from commerce_supplier_credit_refunds where supplier_return_id=r.id and owner_id=r.owner_id;
 if p_valor<=0 or p_valor>r.credito_fornecedor-usado then raise exception 'Valor excede o credito disponivel de R$ %.',r.credito_fornecedor-usado;end if;
 insert into commerce_supplier_credit_refunds(business_id,owner_id,supplier_return_id,valor,forma,observacoes) values(r.business_id,r.owner_id,r.id,p_valor,nullif(trim(p_forma),''),nullif(trim(p_observacoes),'')) returning id into v_id;
 insert into commerce_cash_movements(business_id,owner_id,tipo,descricao,valor,supplier_credit_refund_id) values(r.business_id,r.owner_id,'reembolso_fornecedor','Reembolso recebido de fornecedor',p_valor,v_id);
 if usado+p_valor=r.credito_fornecedor then update commerce_supplier_returns set status_financeiro='compensado' where id=r.id;end if;
 return v_id;
end;$$;
revoke all on function commerce_receber_credito_fornecedor(uuid,numeric,text,text) from public,anon;
grant execute on function commerce_receber_credito_fornecedor(uuid,numeric,text,text) to authenticated;
