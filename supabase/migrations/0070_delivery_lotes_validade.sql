-- Controle de lote e validade por entrada de estoque. Não substitui o
-- modelo atual (quantidade_atual agregada por ingrediente) — é um registro
-- adicional, só pra saber que lote/validade entrou e alertar antes de
-- vencer. Não deduz por lote nas saídas (isso exigiria reestruturar todo o
-- controle de estoque pra FEFO, fora de escopo por ora).
create table del_lotes_estoque (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  ingredient_id uuid not null references del_ingredients(id) on delete cascade,
  numero_lote text,
  quantidade numeric(16, 4) not null check (quantidade > 0),
  validade date,
  origem text,
  nota_entrada_item_id uuid references del_notas_entrada_itens(id) on delete set null,
  stock_movement_id uuid references del_stock_movements(id) on delete set null,
  observacao text,
  created_at timestamptz not null default now()
);

alter table del_lotes_estoque enable row level security;
create policy "del_owner_only" on del_lotes_estoque for all
  using (owner_id in (select public.del_effective_owner_ids()))
  with check (owner_id in (select public.del_effective_owner_ids()));

create index del_lotes_estoque_owner_validade_idx on del_lotes_estoque (owner_id, validade) where validade is not null;
create index del_lotes_estoque_ingredient_idx on del_lotes_estoque (ingredient_id);
