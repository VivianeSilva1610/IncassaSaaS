-- Governança fiscal: revisão rastreável e bloqueio defensivo do ambiente de produção.

alter table commerce_fiscal_settings
  add column if not exists producao_liberada boolean not null default false,
  add column if not exists producao_liberada_em timestamptz,
  add column if not exists producao_liberada_por uuid references auth.users(id);

create table commerce_fiscal_reviews(
  id uuid primary key default gen_random_uuid(),business_id uuid not null,owner_id uuid not null,
  tipo text not null check(tipo in('estabelecimento','produto','producao')),
  product_id uuid,contador_nome text not null,contador_crc text not null,
  declaracao text not null,observacoes text,fonte_url text,
  created_by uuid not null default auth.uid() references auth.users(id),created_at timestamptz not null default now(),
  unique(id,business_id,owner_id),
  foreign key(business_id,owner_id) references commerce_businesses(id,owner_id) on delete cascade,
  foreign key(product_id,business_id,owner_id) references commerce_products(id,business_id,owner_id)
);
create index commerce_fiscal_reviews_business_date_idx on commerce_fiscal_reviews(business_id,created_at desc);
create index commerce_fiscal_reviews_product_idx on commerce_fiscal_reviews(product_id,created_at desc) where product_id is not null;
alter table commerce_fiscal_reviews enable row level security;
create policy commerce_fiscal_reviews_module on commerce_fiscal_reviews for all using(owner_id=commerce_owner_atual() and commerce_tem_modulo('fiscal')) with check(owner_id=commerce_owner_atual() and commerce_tem_modulo('fiscal'));

create function commerce_revisar_estabelecimento_fiscal(p_observacoes text default null) returns uuid
language plpgsql security invoker set search_path=public as $$
declare f commerce_fiscal_settings%rowtype;b commerce_businesses%rowtype;rid uuid;
begin
  select * into f from commerce_fiscal_settings where owner_id=commerce_owner_atual() for update;
  select * into b from commerce_businesses where id=f.business_id and owner_id=f.owner_id;
  if not found or b.cnpj is null or b.uf is null or f.regime_tributario is null or f.crt is null or f.cnae_principal is null then raise exception 'Complete os dados obrigatorios antes da revisao.';end if;
  if length(trim(coalesce(f.contador_nome,'')))<3 or length(trim(coalesce(f.contador_crc,'')))<4 then raise exception 'Informe nome e CRC do contador responsavel.';end if;
  insert into commerce_fiscal_reviews(business_id,owner_id,tipo,contador_nome,contador_crc,declaracao,observacoes,fonte_url)
  values(f.business_id,f.owner_id,'estabelecimento',f.contador_nome,f.contador_crc,'Dados cadastrais, regime, CRT e CNAE revisados pelo responsavel informado.',nullif(trim(p_observacoes),''),'https://www.nfe.fazenda.gov.br/portal/') returning id into rid;
  update commerce_fiscal_settings set revisao_status='revisada',revisada_em=now(),revisada_por=f.contador_nome,producao_liberada=false,producao_liberada_em=null,producao_liberada_por=null,updated_at=now() where business_id=f.business_id;
  return rid;
end; $$;

create function commerce_revisar_produto_fiscal(p_product_id uuid,p_observacoes text default null) returns uuid
language plpgsql security invoker set search_path=public as $$
declare f commerce_fiscal_settings%rowtype;p commerce_products%rowtype;rid uuid;
begin
  select * into f from commerce_fiscal_settings where owner_id=commerce_owner_atual();
  select * into p from commerce_products where id=p_product_id and owner_id=f.owner_id for update;
  if not found then raise exception 'Produto nao encontrado.';end if;
  if f.revisao_status<>'revisada' then raise exception 'Revise primeiro a configuracao do estabelecimento.';end if;
  if p.ncm is null or p.origem_mercadoria is null then raise exception 'Informe NCM e origem da mercadoria.';end if;
  if f.crt in(1,4) and p.csosn is null then raise exception 'Informe o CSOSN validado para este produto.';end if;
  if f.crt in(2,3) and p.cst is null then raise exception 'Informe o CST validado para este produto.';end if;
  insert into commerce_fiscal_reviews(business_id,owner_id,tipo,product_id,contador_nome,contador_crc,declaracao,observacoes,fonte_url)
  values(p.business_id,p.owner_id,'produto',p.id,f.contador_nome,f.contador_crc,'NCM, origem e enquadramento tributario do produto revisados pelo responsavel informado.',nullif(trim(p_observacoes),''),'https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior/classificacao-fiscal-de-mercadorias/ncm') returning id into rid;
  update commerce_products set classificacao_fiscal_status='revisada',classificacao_revisada_em=now(),classificacao_revisada_por=f.contador_nome,updated_at=now() where id=p.id;
  return rid;
end; $$;

create function commerce_guardar_ambiente_fiscal() returns trigger language plpgsql set search_path=public as $$
begin
  if new.ambiente='producao' and (not new.producao_liberada or new.revisao_status<>'revisada' or exists(select 1 from commerce_products p where p.business_id=new.business_id and p.ativo and p.classificacao_fiscal_status<>'revisada')) then raise exception 'Producao fiscal bloqueada: conclua as revisoes e a liberacao explicita.';end if;
  return new;
end; $$;
create trigger commerce_fiscal_environment_guard before insert or update of ambiente,producao_liberada on commerce_fiscal_settings for each row execute function commerce_guardar_ambiente_fiscal();

revoke all on function commerce_revisar_estabelecimento_fiscal(text) from public,anon;
revoke all on function commerce_revisar_produto_fiscal(uuid,text) from public,anon;
grant execute on function commerce_revisar_estabelecimento_fiscal(text) to authenticated;
grant execute on function commerce_revisar_produto_fiscal(uuid,text) to authenticated;
