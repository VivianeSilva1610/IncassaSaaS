-- Memoriza como cada codigo de produto do fornecedor deve ser classificado
-- e convertido para a unidade interna do estoque.
create table if not exists del_fornecedor_produto_mapeamentos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  fornecedor_id uuid not null references del_fornecedores(id) on delete cascade,
  codigo_fornecedor text not null,
  descricao_fornecedor text,
  unidade_fiscal text,
  destinacao text not null check (
    destinacao in (
      'insumo_producao', 'embalagem', 'mercadoria_revenda',
      'uso_consumo', 'ativo_imobilizado', 'despesa'
    )
  ),
  ingrediente_id uuid references del_ingredients(id) on delete set null,
  fator_conversao numeric(18,6) check (fator_conversao > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint del_fornecedor_produto_mapeamentos_codigo_key
    unique (owner_id, fornecedor_id, codigo_fornecedor),
  constraint del_fornecedor_produto_mapeamentos_estoque_check check (
    (destinacao in ('insumo_producao', 'embalagem', 'mercadoria_revenda')
      and ingrediente_id is not null and fator_conversao is not null)
    or
    (destinacao not in ('insumo_producao', 'embalagem', 'mercadoria_revenda')
      and ingrediente_id is null and fator_conversao is null)
  )
);

alter table del_fornecedor_produto_mapeamentos enable row level security;
create policy "del_owner_only" on del_fornecedor_produto_mapeamentos for all
  using (owner_id in (select public.del_effective_owner_ids()))
  with check (owner_id in (select public.del_effective_owner_ids()));

create index if not exists del_fornecedor_produto_mapeamentos_fornecedor_idx
  on del_fornecedor_produto_mapeamentos (owner_id, fornecedor_id);

