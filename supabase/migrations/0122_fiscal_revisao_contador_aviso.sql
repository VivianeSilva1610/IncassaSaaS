-- Revisão do contador passa a ser só um AVISO no Comércio (decisão da
-- Viviane, 2026-10-14 — o Restaurante nunca bloqueou). A revisão continua
-- disponível e registrada em commerce_fiscal_reviews, mas:
--   * documento fiscal com estabelecimento/produto sem revisão sai com
--     aviso em avisos_validacao, não com erro;
--   * dados que faltam de verdade (CNPJ, UF, NCM, origem, CST/CSOSN)
--     continuam sendo erro — sem eles o documento é rejeitado de qualquer
--     forma;
--   * revisar um produto não exige mais o estabelecimento revisado antes;
--   * produção exige só a liberação explícita (producao_liberada), não mais
--     as revisões.
-- A responsabilidade pelos dados fiscais é de quem os informa (Termos).

alter table commerce_fiscal_documents
  add column if not exists avisos_validacao jsonb not null default '[]'::jsonb;

create or replace function commerce_preparar_documento_fiscal(p_sale_id uuid,p_modelo text default '65') returns uuid
language plpgsql security invoker set search_path=public as $$
declare s commerce_sales%rowtype;f commerce_fiscal_settings%rowtype;b commerce_businesses%rowtype;errors jsonb:='[]'::jsonb;warnings jsonb:='[]'::jsonb;snapshot jsonb;doc_id uuid;
begin
  if p_modelo not in('55','65') then raise exception 'Modelo fiscal invalido.';end if;
  select * into s from commerce_sales where id=p_sale_id and owner_id=commerce_owner_atual();if not found or s.status not in('concluida','devolvida_parcial','devolvida') then raise exception 'Venda nao elegivel para documento fiscal.';end if;
  select * into f from commerce_fiscal_settings where business_id=s.business_id and owner_id=s.owner_id;
  select * into b from commerce_businesses where id=s.business_id and owner_id=s.owner_id;
  if b.cnpj is null or b.uf is null then errors:=errors||jsonb_build_array('CNPJ ou UF do estabelecimento ausente.');end if;
  if f.crt is null then errors:=errors||jsonb_build_array('CRT do estabelecimento não informado.');end if;
  if exists(select 1 from commerce_sale_items i join commerce_products p on p.id=i.product_id where i.sale_id=s.id and (p.ncm is null or p.origem_mercadoria is null or (f.crt in(1,4) and p.csosn is null) or (f.crt in(2,3) and p.cst is null))) then errors:=errors||jsonb_build_array('Há produto sem NCM, origem ou CST/CSOSN.');end if;
  if coalesce(f.revisao_status,'pendente')<>'revisada' then warnings:=warnings||jsonb_build_array('Dados fiscais do estabelecimento sem revisão registrada do contador.');end if;
  if exists(select 1 from commerce_sale_items i join commerce_products p on p.id=i.product_id where i.sale_id=s.id and p.classificacao_fiscal_status<>'revisada') then warnings:=warnings||jsonb_build_array('Há produto sem revisão registrada do contador.');end if;
  select jsonb_build_object('venda_id',s.id,'numero_venda',s.numero,'modelo',p_modelo,'ambiente','homologacao','emitente',jsonb_build_object('cnpj',b.cnpj,'uf',b.uf,'crt',f.crt),'totais',jsonb_build_object('subtotal',s.subtotal,'desconto',s.desconto,'total',s.total),'itens',coalesce(jsonb_agg(jsonb_build_object('produto_id',i.product_id,'variacao_id',i.variant_id,'descricao',i.descricao,'quantidade',i.quantidade,'valor_unitario',i.preco_unitario,'total',i.total,'ncm',p.ncm,'cest',p.cest,'origem',p.origem_mercadoria,'cst',p.cst,'csosn',p.csosn,'classificacao_revisada',p.classificacao_fiscal_status='revisada') order by i.created_at,i.id),'[]'::jsonb)) into snapshot from commerce_sale_items i join commerce_products p on p.id=i.product_id where i.sale_id=s.id;
  insert into commerce_fiscal_documents(business_id,owner_id,sale_id,modelo,status,provedor,idempotency_key,payload_snapshot,erros_validacao,avisos_validacao)
  values(s.business_id,s.owner_id,s.id,p_modelo,case when jsonb_array_length(errors)=0 then 'validado' else 'erro_validacao' end,'simulado',encode(digest(s.owner_id::text||':'||s.id::text||':'||p_modelo||':homologacao','sha256'),'hex'),snapshot,errors,warnings)
  on conflict(owner_id,idempotency_key) do update set payload_snapshot=excluded.payload_snapshot,erros_validacao=excluded.erros_validacao,avisos_validacao=excluded.avisos_validacao,status=excluded.status,updated_at=now() returning id into doc_id;
  return doc_id;
end; $$;

create or replace function commerce_revisar_produto_fiscal(p_product_id uuid,p_observacoes text default null) returns uuid
language plpgsql security invoker set search_path=public as $$
declare f commerce_fiscal_settings%rowtype;p commerce_products%rowtype;rid uuid;
begin
  select * into f from commerce_fiscal_settings where owner_id=commerce_owner_atual();
  select * into p from commerce_products where id=p_product_id and owner_id=f.owner_id for update;
  if not found then raise exception 'Produto nao encontrado.';end if;
  if length(trim(coalesce(f.contador_nome,'')))<3 or length(trim(coalesce(f.contador_crc,'')))<4 then raise exception 'Informe nome e CRC do contador responsavel na configuracao fiscal.';end if;
  if p.ncm is null or p.origem_mercadoria is null then raise exception 'Informe NCM e origem da mercadoria.';end if;
  if f.crt in(1,4) and p.csosn is null then raise exception 'Informe o CSOSN validado para este produto.';end if;
  if f.crt in(2,3) and p.cst is null then raise exception 'Informe o CST validado para este produto.';end if;
  insert into commerce_fiscal_reviews(business_id,owner_id,tipo,product_id,contador_nome,contador_crc,declaracao,observacoes,fonte_url)
  values(p.business_id,p.owner_id,'produto',p.id,f.contador_nome,f.contador_crc,'NCM, origem e enquadramento tributario do produto revisados pelo responsavel informado.',nullif(trim(p_observacoes),''),'https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior/classificacao-fiscal-de-mercadorias/ncm') returning id into rid;
  update commerce_products set classificacao_fiscal_status='revisada',classificacao_revisada_em=now(),classificacao_revisada_por=f.contador_nome,updated_at=now() where id=p.id;
  return rid;
end; $$;

create or replace function commerce_guardar_ambiente_fiscal() returns trigger language plpgsql set search_path=public as $$
begin
  if new.ambiente='producao' and not new.producao_liberada then raise exception 'Producao fiscal bloqueada: falta a liberacao explicita.';end if;
  return new;
end; $$;
