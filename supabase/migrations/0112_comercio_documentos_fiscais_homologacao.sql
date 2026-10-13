-- Documentos fiscais do Comércio: pré-validação e simulação somente em homologação.

alter table commerce_fiscal_settings
  add column if not exists provedor text,
  add column if not exists provedor_configurado boolean not null default false;

create table commerce_fiscal_documents(
  id uuid primary key default gen_random_uuid(),business_id uuid not null,owner_id uuid not null,sale_id uuid not null,
  modelo text not null check(modelo in('55','65')),ambiente text not null default 'homologacao' check(ambiente='homologacao'),
  status text not null default 'rascunho' check(status in('rascunho','erro_validacao','validado','simulado','cancelado')),
  provedor text not null default 'simulado',idempotency_key text not null,payload_snapshot jsonb not null default '{}'::jsonb,
  erros_validacao jsonb not null default '[]'::jsonb,resposta_sanitizada jsonb,protocolo text,chave_acesso text,
  tentativas integer not null default 0 check(tentativas>=0),erro_mensagem text,
  created_by uuid not null default auth.uid() references auth.users(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),simulada_em timestamptz,cancelada_em timestamptz,
  unique(id,business_id,owner_id),unique(owner_id,idempotency_key),
  foreign key(business_id,owner_id) references commerce_businesses(id,owner_id) on delete cascade,
  foreign key(sale_id,business_id,owner_id) references commerce_sales(id,business_id,owner_id)
);
create unique index commerce_fiscal_document_active_uidx on commerce_fiscal_documents(sale_id,modelo,ambiente) where status<>'cancelado';
create index commerce_fiscal_document_business_date_idx on commerce_fiscal_documents(business_id,created_at desc);
alter table commerce_fiscal_documents enable row level security;
create policy commerce_fiscal_documents_module on commerce_fiscal_documents for all using(owner_id=commerce_owner_atual() and commerce_tem_modulo('fiscal')) with check(owner_id=commerce_owner_atual() and commerce_tem_modulo('fiscal'));
create trigger commerce_log_fiscal_documents after insert or update or delete on commerce_fiscal_documents for each row execute function commerce_log_activity('documento_fiscal_comercio');

create function commerce_preparar_documento_fiscal(p_sale_id uuid,p_modelo text default '65') returns uuid
language plpgsql security invoker set search_path=public as $$
declare s commerce_sales%rowtype;f commerce_fiscal_settings%rowtype;b commerce_businesses%rowtype;errors jsonb:='[]'::jsonb;snapshot jsonb;doc_id uuid;
begin
  if p_modelo not in('55','65') then raise exception 'Modelo fiscal invalido.';end if;
  select * into s from commerce_sales where id=p_sale_id and owner_id=commerce_owner_atual();if not found or s.status not in('concluida','devolvida_parcial','devolvida') then raise exception 'Venda nao elegivel para documento fiscal.';end if;
  select * into f from commerce_fiscal_settings where business_id=s.business_id and owner_id=s.owner_id;
  select * into b from commerce_businesses where id=s.business_id and owner_id=s.owner_id;
  if f.revisao_status<>'revisada' then errors:=errors||jsonb_build_array('Configuração do estabelecimento ainda não revisada.');end if;
  if b.cnpj is null or b.uf is null then errors:=errors||jsonb_build_array('CNPJ ou UF do estabelecimento ausente.');end if;
  if exists(select 1 from commerce_sale_items i join commerce_products p on p.id=i.product_id where i.sale_id=s.id and (p.classificacao_fiscal_status<>'revisada' or p.ncm is null or p.origem_mercadoria is null or (f.crt in(1,4) and p.csosn is null) or (f.crt in(2,3) and p.cst is null))) then errors:=errors||jsonb_build_array('Há produto sem classificação fiscal revisada ou incompleta.');end if;
  select jsonb_build_object('venda_id',s.id,'numero_venda',s.numero,'modelo',p_modelo,'ambiente','homologacao','emitente',jsonb_build_object('cnpj',b.cnpj,'uf',b.uf,'crt',f.crt),'totais',jsonb_build_object('subtotal',s.subtotal,'desconto',s.desconto,'total',s.total),'itens',coalesce(jsonb_agg(jsonb_build_object('produto_id',i.product_id,'variacao_id',i.variant_id,'descricao',i.descricao,'quantidade',i.quantidade,'valor_unitario',i.preco_unitario,'total',i.total,'ncm',p.ncm,'cest',p.cest,'origem',p.origem_mercadoria,'cst',p.cst,'csosn',p.csosn) order by i.created_at,i.id),'[]'::jsonb)) into snapshot from commerce_sale_items i join commerce_products p on p.id=i.product_id where i.sale_id=s.id;
  insert into commerce_fiscal_documents(business_id,owner_id,sale_id,modelo,status,provedor,idempotency_key,payload_snapshot,erros_validacao)
  values(s.business_id,s.owner_id,s.id,p_modelo,case when jsonb_array_length(errors)=0 then 'validado' else 'erro_validacao' end,'simulado',encode(digest(s.owner_id::text||':'||s.id::text||':'||p_modelo||':homologacao','sha256'),'hex'),snapshot,errors)
  on conflict(owner_id,idempotency_key) do update set payload_snapshot=excluded.payload_snapshot,erros_validacao=excluded.erros_validacao,status=excluded.status,updated_at=now() returning id into doc_id;
  return doc_id;
end; $$;

create function commerce_simular_documento_fiscal(p_document_id uuid) returns void
language plpgsql security invoker set search_path=public as $$
declare d commerce_fiscal_documents%rowtype;
begin
  select * into d from commerce_fiscal_documents where id=p_document_id and owner_id=commerce_owner_atual() for update;
  if not found or d.status<>'validado' or d.ambiente<>'homologacao' then raise exception 'Documento nao esta pronto para simulacao.';end if;
  update commerce_fiscal_documents set status='simulado',tentativas=tentativas+1,protocolo='SIM-'||upper(substr(replace(id::text,'-',''),1,20)),resposta_sanitizada=jsonb_build_object('simulado',true,'mensagem','Documento validado localmente; nenhuma transmissão foi realizada.'),simulada_em=now(),updated_at=now() where id=d.id;
end; $$;

revoke all on function commerce_preparar_documento_fiscal(uuid,text) from public,anon;
revoke all on function commerce_simular_documento_fiscal(uuid) from public,anon;
grant execute on function commerce_preparar_documento_fiscal(uuid,text) to authenticated;
grant execute on function commerce_simular_documento_fiscal(uuid) to authenticated;
