-- INCASSA Comércio — núcleo multi-tenant para revenda de mercadorias.
-- Entradas manuais e por NF-e convergem no mesmo razão de estoque.
-- Nenhuma classificação fiscal é presumida: produtos/configuração começam
-- pendentes e podem registrar a revisão do contador responsável.

create table commerce_businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  nome text not null check (length(trim(nome)) between 2 and 160),
  nome_fantasia text,
  cnpj text check (cnpj is null or cnpj ~ '^\d{14}$'),
  inscricao_estadual text,
  uf char(2),
  timezone text not null default 'America/Sao_Paulo',
  status text not null default 'rascunho' check (status in ('rascunho', 'ativo', 'suspenso')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id),
  unique (id, owner_id)
);

create table commerce_suppliers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  owner_id uuid not null,
  nome text not null,
  documento text,
  email text,
  telefone text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  unique (business_id, documento),
  unique (id, business_id, owner_id),
  foreign key (business_id, owner_id) references commerce_businesses(id, owner_id) on delete cascade
);

create table commerce_products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  owner_id uuid not null,
  nome text not null,
  sku text,
  gtin text check (gtin is null or gtin ~ '^(\d{8}|\d{12,14})$'),
  unidade text not null default 'UN',
  categoria text,
  marca text,
  custo_medio numeric(14,4) not null default 0 check (custo_medio >= 0),
  preco_venda numeric(14,2) not null default 0 check (preco_venda >= 0),
  estoque_atual numeric(14,4) not null default 0,
  estoque_minimo numeric(14,4) not null default 0 check (estoque_minimo >= 0),
  ncm text check (ncm is null or ncm ~ '^\d{8}$'),
  cest text check (cest is null or cest ~ '^\d{7}$'),
  origem_mercadoria text check (origem_mercadoria is null or origem_mercadoria ~ '^\d$'),
  cst text check (cst is null or cst ~ '^\d{2}$'),
  csosn text check (csosn is null or csosn ~ '^\d{3}$'),
  classificacao_fiscal_status text not null default 'pendente'
    check (classificacao_fiscal_status in ('pendente', 'revisada', 'revisar')),
  classificacao_revisada_em timestamptz,
  classificacao_revisada_por text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, sku),
  unique (business_id, gtin),
  unique (id, business_id, owner_id),
  foreign key (business_id, owner_id) references commerce_businesses(id, owner_id) on delete cascade
);

create table commerce_stock_entries (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  owner_id uuid not null,
  supplier_id uuid,
  origem text not null check (origem in ('compra_manual', 'nfe_xml')),
  status text not null default 'rascunho' check (status in ('rascunho', 'conferida', 'efetivada', 'cancelada')),
  numero_documento text,
  serie_documento text,
  chave_acesso_nfe text check (chave_acesso_nfe is null or chave_acesso_nfe ~ '^\d{44}$'),
  xml_storage_path text,
  xml_sha256 text,
  emitida_em timestamptz,
  recebida_em timestamptz,
  valor_produtos numeric(14,2) not null default 0 check (valor_produtos >= 0),
  valor_frete numeric(14,2) not null default 0 check (valor_frete >= 0),
  valor_desconto numeric(14,2) not null default 0 check (valor_desconto >= 0),
  valor_total numeric(14,2) not null default 0 check (valor_total >= 0),
  observacoes text,
  efetivada_em timestamptz,
  efetivada_por uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, chave_acesso_nfe),
  unique (id, business_id, owner_id),
  foreign key (business_id, owner_id) references commerce_businesses(id, owner_id) on delete cascade,
  foreign key (supplier_id, business_id, owner_id) references commerce_suppliers(id, business_id, owner_id)
);

create table commerce_stock_entry_items (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null,
  business_id uuid not null,
  owner_id uuid not null,
  product_id uuid,
  codigo_fornecedor text,
  descricao_documento text not null,
  quantidade numeric(14,4) not null check (quantidade > 0),
  unidade text not null default 'UN',
  valor_unitario numeric(14,4) not null check (valor_unitario >= 0),
  valor_total numeric(14,2) not null check (valor_total >= 0),
  ncm_documento text,
  cfop_documento text,
  created_at timestamptz not null default now(),
  foreign key (entry_id, business_id, owner_id) references commerce_stock_entries(id, business_id, owner_id) on delete cascade,
  foreign key (product_id, business_id, owner_id) references commerce_products(id, business_id, owner_id)
);

create table commerce_inventory_movements (
  id bigint generated always as identity primary key,
  business_id uuid not null,
  owner_id uuid not null,
  product_id uuid not null,
  tipo text not null check (tipo in ('entrada_compra', 'entrada_nfe', 'saida_venda', 'devolucao_cliente', 'devolucao_fornecedor', 'ajuste_entrada', 'ajuste_saida')),
  quantidade numeric(14,4) not null check (quantidade > 0),
  custo_unitario numeric(14,4) check (custo_unitario is null or custo_unitario >= 0),
  entry_id uuid,
  referencia_externa text,
  ocorrido_em timestamptz not null default now(),
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  foreign key (business_id, owner_id) references commerce_businesses(id, owner_id) on delete cascade,
  foreign key (product_id, business_id, owner_id) references commerce_products(id, business_id, owner_id),
  foreign key (entry_id, business_id, owner_id) references commerce_stock_entries(id, business_id, owner_id)
);

create table commerce_fiscal_settings (
  business_id uuid primary key,
  owner_id uuid not null,
  ambiente text not null default 'homologacao' check (ambiente in ('homologacao', 'producao')),
  regime_tributario text,
  crt smallint check (crt is null or crt in (1, 2, 3, 4)),
  cnae_principal text check (cnae_principal is null or cnae_principal ~ '^\d{7}$'),
  contador_nome text,
  contador_crc text,
  revisao_status text not null default 'pendente' check (revisao_status in ('pendente', 'revisada', 'revisar')),
  revisada_em timestamptz,
  revisada_por text,
  legislacao_versao text,
  legislacao_fonte_url text,
  vigencia_inicio date,
  observacoes text,
  updated_at timestamptz not null default now(),
  foreign key (business_id, owner_id) references commerce_businesses(id, owner_id) on delete cascade
);

create index commerce_suppliers_owner_idx on commerce_suppliers(owner_id, business_id);
create index commerce_products_owner_active_idx on commerce_products(owner_id, business_id, ativo);
create index commerce_products_name_idx on commerce_products(business_id, nome);
create index commerce_entries_owner_status_idx on commerce_stock_entries(owner_id, business_id, status, created_at desc);
create index commerce_entry_items_entry_idx on commerce_stock_entry_items(entry_id);
create index commerce_movements_product_date_idx on commerce_inventory_movements(business_id, product_id, ocorrido_em desc);
create index commerce_movements_owner_date_idx on commerce_inventory_movements(owner_id, ocorrido_em desc);

alter table commerce_businesses enable row level security;
alter table commerce_suppliers enable row level security;
alter table commerce_products enable row level security;
alter table commerce_stock_entries enable row level security;
alter table commerce_stock_entry_items enable row level security;
alter table commerce_inventory_movements enable row level security;
alter table commerce_fiscal_settings enable row level security;

create policy commerce_businesses_owner on commerce_businesses for all
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy commerce_suppliers_owner on commerce_suppliers for all
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy commerce_products_owner on commerce_products for all
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy commerce_stock_entries_owner on commerce_stock_entries for all
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy commerce_stock_entry_items_owner on commerce_stock_entry_items for all
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy commerce_inventory_movements_owner on commerce_inventory_movements for all
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy commerce_fiscal_settings_owner on commerce_fiscal_settings for all
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

comment on column commerce_products.classificacao_fiscal_status is
  'Classificação tributária exige validação do contador; o sistema não presume NCM/CST/CSOSN.';
comment on column commerce_fiscal_settings.ambiente is
  'Homologação é o padrão seguro. Mudança para produção depende de configuração e autorização explícitas.';
