-- Pedido de compra e uma etapa operacional anterior ao recebimento da NF-e.
-- Nao movimenta estoque e nao cria conta a pagar.
create table if not exists del_pedidos_compra (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  numero bigint generated always as identity,
  fornecedor_id uuid not null references del_fornecedores(id) on delete restrict,
  status text not null default 'rascunho'
    check (status in ('rascunho', 'emitido', 'recebido', 'cancelado')),
  observacao text,
  criado_por uuid not null references auth.users(id),
  emitido_por uuid references auth.users(id),
  emitido_em timestamptz,
  recebido_em timestamptz,
  cancelado_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint del_pedidos_compra_owner_numero_key unique (owner_id, numero)
);

create table if not exists del_pedidos_compra_itens (
  id uuid primary key default gen_random_uuid(),
  pedido_compra_id uuid not null references del_pedidos_compra(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  ingrediente_id uuid not null references del_ingredients(id) on delete restrict,
  descricao_snapshot text not null,
  unidade_snapshot text not null,
  quantidade numeric(16,4) not null check (quantidade > 0),
  custo_unitario_estimado numeric(16,4) check (custo_unitario_estimado >= 0),
  created_at timestamptz not null default now(),
  constraint del_pedidos_compra_itens_produto_key unique (pedido_compra_id, ingrediente_id)
);

alter table del_pedidos_compra enable row level security;
alter table del_pedidos_compra_itens enable row level security;
create policy "del_owner_only" on del_pedidos_compra for all
  using (owner_id in (select public.del_effective_owner_ids()))
  with check (owner_id in (select public.del_effective_owner_ids()));
create policy "del_owner_only" on del_pedidos_compra_itens for all
  using (owner_id in (select public.del_effective_owner_ids()))
  with check (owner_id in (select public.del_effective_owner_ids()));

create index if not exists del_pedidos_compra_owner_status_idx
  on del_pedidos_compra (owner_id, status, created_at desc);
create index if not exists del_pedidos_compra_fornecedor_idx
  on del_pedidos_compra (fornecedor_id);
create index if not exists del_pedidos_compra_itens_pedido_idx
  on del_pedidos_compra_itens (pedido_compra_id);

