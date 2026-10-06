-- Taxa de entrega por bairro: a Viviane cadastra os bairros que atende
-- (até 30km inicialmente) com a distância aproximada e o valor da taxa
-- — bairro fora dessa lista simplesmente não é uma opção no checkout do
-- site, o que já limita a entrega à área que ela quer cobrir, sem
-- precisar geocodificar endereço nenhum.
create table del_zonas_entrega (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  bairro text not null,
  distancia_km numeric(5, 1),
  taxa numeric(10, 2) not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  unique (owner_id, bairro)
);

alter table del_zonas_entrega enable row level security;
create policy "del_owner_only" on del_zonas_entrega for all
  using (owner_id in (select public.del_effective_owner_ids()))
  with check (owner_id in (select public.del_effective_owner_ids()));

-- Guarda qual bairro foi escolhido no pedido, pra conferência e pro
-- relatório de vendas — a taxa em si já fica em del_orders.taxa_entrega.
alter table del_orders add column if not exists bairro_entrega text;
