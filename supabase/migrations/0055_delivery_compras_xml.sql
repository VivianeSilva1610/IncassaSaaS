-- Compras e entrada de mercadorias por XML de NF-e (modelo 55).
-- A importacao apenas registra o documento para conferencia: estoque e contas
-- a pagar continuam separados para evitar efeitos financeiros acidentais.
create table if not exists del_fornecedores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  documento text not null,
  razao_social text not null,
  nome_fantasia text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint del_fornecedores_owner_documento_key unique (owner_id, documento)
);

create table if not exists del_notas_entrada (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  fornecedor_id uuid not null references del_fornecedores(id),
  chave_acesso text not null check (chave_acesso ~ '^[0-9]{44}$'),
  numero text not null,
  serie text,
  emitida_em timestamptz,
  fornecedor_documento text not null,
  fornecedor_nome text not null,
  destinatario_documento text,
  valor_total numeric(14, 2) not null check (valor_total >= 0),
  protocolo_autorizacao text,
  status text not null default 'importada'
    check (status in ('importada', 'conferida', 'processada', 'cancelada')),
  xml_original text not null,
  importada_por uuid not null references auth.users(id),
  importada_em timestamptz not null default now(),
  conferida_em timestamptz,
  processada_em timestamptz,
  observacao text,
  constraint del_notas_entrada_owner_chave_key unique (owner_id, chave_acesso)
);

create table if not exists del_notas_entrada_itens (
  id uuid primary key default gen_random_uuid(),
  nota_entrada_id uuid not null references del_notas_entrada(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  numero_item integer not null check (numero_item > 0),
  codigo_fornecedor text,
  ean text,
  descricao text not null,
  ncm text,
  cest text,
  cfop text,
  unidade text,
  quantidade numeric(16, 4) not null check (quantidade >= 0),
  valor_unitario numeric(16, 4) not null check (valor_unitario >= 0),
  valor_total numeric(14, 2) not null check (valor_total >= 0),
  ingrediente_id uuid references del_ingredients(id) on delete set null,
  quantidade_estoque numeric(16, 4),
  created_at timestamptz not null default now(),
  constraint del_notas_entrada_itens_nota_numero_key unique (nota_entrada_id, numero_item)
);

alter table del_fornecedores enable row level security;
alter table del_notas_entrada enable row level security;
alter table del_notas_entrada_itens enable row level security;

create policy "del_owner_only" on del_fornecedores for all
  using (owner_id in (select public.del_effective_owner_ids()))
  with check (owner_id in (select public.del_effective_owner_ids()));
create policy "del_owner_only" on del_notas_entrada for all
  using (owner_id in (select public.del_effective_owner_ids()))
  with check (owner_id in (select public.del_effective_owner_ids()));
create policy "del_owner_only" on del_notas_entrada_itens for all
  using (owner_id in (select public.del_effective_owner_ids()))
  with check (owner_id in (select public.del_effective_owner_ids()));

create index if not exists del_fornecedores_owner_nome_idx
  on del_fornecedores (owner_id, razao_social);
create index if not exists del_notas_entrada_owner_emissao_idx
  on del_notas_entrada (owner_id, emitida_em desc);
create index if not exists del_notas_entrada_itens_nota_idx
  on del_notas_entrada_itens (nota_entrada_id);
