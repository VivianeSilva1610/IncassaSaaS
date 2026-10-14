-- Estrutura para emissão real futura. Esta migration não ativa produção,
-- não transmite documentos e não preenche dados fiscais inexistentes.

alter table del_fiscal_config drop constraint if exists del_fiscal_config_provedor_check;
alter table del_fiscal_config add constraint del_fiscal_config_provedor_check
  check (provedor is null or provedor in ('simulado', 'incassa_direto', 'focus_nfe', 'plugnotas', 'enotas'));
alter table del_fiscal_config add column if not exists producao_liberada boolean not null default false;
alter table del_fiscal_config add column if not exists serie_nfe smallint not null default 1 check (serie_nfe > 0);

alter table del_notas_fiscais drop constraint if exists del_notas_fiscais_status_check;
alter table del_notas_fiscais add constraint del_notas_fiscais_status_check
  check (status in ('pendente', 'processando', 'emitida', 'rejeitada', 'denegada', 'erro_comunicacao', 'erro', 'cancelada'));
alter table del_notas_fiscais add column if not exists referencia_provedor text;
alter table del_notas_fiscais add column if not exists codigo_status_sefaz text;
alter table del_notas_fiscais add column if not exists mensagem_sefaz text;
alter table del_notas_fiscais add column if not exists xml_path text;
alter table del_notas_fiscais add column if not exists danfe_path text;
alter table del_notas_fiscais add column if not exists ultima_consulta_em timestamptz;
alter table del_notas_fiscais add column if not exists tentativas integer not null default 0 check (tentativas >= 0);

create unique index if not exists del_notas_fiscais_referencia_uidx
  on del_notas_fiscais (owner_id, referencia_provedor)
  where referencia_provedor is not null;

create table del_fiscal_eventos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  nota_id uuid not null references del_notas_fiscais(id) on delete cascade,
  tipo text not null,
  status_anterior text,
  status_novo text,
  codigo_sefaz text,
  mensagem_sanitizada text,
  created_by uuid default auth.uid() references auth.users(id),
  created_at timestamptz not null default now()
);

alter table del_fiscal_eventos enable row level security;
create policy del_fiscal_eventos_select on del_fiscal_eventos for select
  using (owner_id in (select public.del_effective_owner_ids()));
create policy del_fiscal_eventos_insert on del_fiscal_eventos for insert
  with check (owner_id in (select public.del_effective_owner_ids()));
create index del_fiscal_eventos_nota_idx on del_fiscal_eventos (nota_id, created_at desc);

alter table commerce_fiscal_settings add column if not exists provedor text not null default 'simulado';
update commerce_fiscal_settings set provedor = 'simulado' where provedor is null;
alter table commerce_fiscal_settings alter column provedor set default 'simulado';
alter table commerce_fiscal_settings alter column provedor set not null;
alter table commerce_fiscal_settings add column if not exists logradouro text;
alter table commerce_fiscal_settings add column if not exists numero text;
alter table commerce_fiscal_settings add column if not exists bairro text;
alter table commerce_fiscal_settings add column if not exists codigo_municipio_ibge text;
alter table commerce_fiscal_settings add column if not exists municipio text;
alter table commerce_fiscal_settings add column if not exists cep text;
alter table commerce_fiscal_settings add column if not exists serie_nfce smallint not null default 1 check (serie_nfce > 0);
alter table commerce_fiscal_settings add column if not exists serie_nfe smallint not null default 1 check (serie_nfe > 0);
alter table commerce_fiscal_settings drop constraint if exists commerce_fiscal_settings_provedor_check;
alter table commerce_fiscal_settings add constraint commerce_fiscal_settings_provedor_check
  check (provedor in ('simulado', 'incassa_direto', 'focus_nfe', 'plugnotas', 'enotas'));

alter table commerce_products add column if not exists cfop_venda text;
alter table commerce_products add column if not exists unidade_comercial text not null default 'UN';
alter table commerce_products add column if not exists aliquota_icms numeric(7,4);
alter table commerce_products add column if not exists aliquota_pis numeric(7,4);
alter table commerce_products add column if not exists aliquota_cofins numeric(7,4);

alter table commerce_customers add column if not exists logradouro text;
alter table commerce_customers add column if not exists numero text;
alter table commerce_customers add column if not exists bairro text;
alter table commerce_customers add column if not exists codigo_municipio_ibge text;
alter table commerce_customers add column if not exists municipio text;
alter table commerce_customers add column if not exists uf text;
alter table commerce_customers add column if not exists cep text;

alter table commerce_fiscal_documents drop constraint if exists commerce_fiscal_documents_ambiente_check;
alter table commerce_fiscal_documents add constraint commerce_fiscal_documents_ambiente_check
  check (ambiente in ('homologacao', 'producao'));
alter table commerce_fiscal_documents drop constraint if exists commerce_fiscal_documents_status_check;
alter table commerce_fiscal_documents add constraint commerce_fiscal_documents_status_check
  check (status in ('rascunho', 'erro_validacao', 'validado', 'simulado', 'enviando', 'processando', 'autorizado', 'rejeitado', 'denegado', 'erro_comunicacao', 'cancelamento_solicitado', 'cancelado'));
alter table commerce_fiscal_documents add column if not exists referencia_provedor text;
alter table commerce_fiscal_documents add column if not exists numero integer;
alter table commerce_fiscal_documents add column if not exists serie smallint;
alter table commerce_fiscal_documents add column if not exists xml_path text;
alter table commerce_fiscal_documents add column if not exists danfe_path text;
alter table commerce_fiscal_documents add column if not exists ultima_consulta_em timestamptz;

create table commerce_fiscal_events (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references commerce_fiscal_documents(id) on delete cascade,
  business_id uuid not null,
  owner_id uuid not null,
  tipo text not null,
  status_anterior text,
  status_novo text,
  codigo_sefaz text,
  mensagem_sanitizada text,
  created_by uuid default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  foreign key (business_id, owner_id) references commerce_businesses(id, owner_id) on delete cascade
);

alter table commerce_fiscal_events enable row level security;
create policy commerce_fiscal_events_module on commerce_fiscal_events for select
  using (owner_id = commerce_owner_atual() and commerce_tem_modulo('fiscal'));
create policy commerce_fiscal_events_insert on commerce_fiscal_events for insert
  with check (owner_id = commerce_owner_atual() and commerce_tem_modulo('fiscal'));
create index commerce_fiscal_events_document_idx on commerce_fiscal_events (document_id, created_at desc);

create table commerce_fiscal_inutilizacoes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  owner_id uuid not null,
  modelo text not null check (modelo in ('55', '65')),
  serie smallint not null,
  numero_inicial integer not null,
  numero_final integer not null,
  justificativa text not null,
  status text not null default 'pendente' check (status in ('pendente', 'autorizada', 'rejeitada', 'erro_comunicacao')),
  protocolo text,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  check (numero_inicial > 0 and numero_final >= numero_inicial),
  foreign key (business_id, owner_id) references commerce_businesses(id, owner_id) on delete cascade
);

alter table commerce_fiscal_inutilizacoes enable row level security;
create policy commerce_fiscal_inutilizacoes_module on commerce_fiscal_inutilizacoes for all
  using (owner_id = commerce_owner_atual() and commerce_tem_modulo('fiscal'))
  with check (owner_id = commerce_owner_atual() and commerce_tem_modulo('fiscal'));
