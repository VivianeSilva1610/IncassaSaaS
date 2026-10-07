-- Histórico de custo unitário por ingrediente. Esse relatório de estoque
-- vai servir de inventário oficial da Viviane — custo_unitario atual não
-- basta, precisa saber qual era o custo vigente em cada data passada.
--
-- Cada linha é "esse custo passou a valer a partir de vigente_desde".
-- O custo vigente numa data D = a linha com maior vigente_desde <= D.
create table del_ingredient_custos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  ingredient_id uuid not null references del_ingredients(id) on delete cascade,
  custo_unitario numeric(10, 2) not null,
  vigente_desde timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table del_ingredient_custos enable row level security;
create policy "del_owner_only" on del_ingredient_custos for all
  using (owner_id in (select public.del_effective_owner_ids()))
  with check (owner_id in (select public.del_effective_owner_ids()));

create index del_ingredient_custos_ingredient_vigente_idx
  on del_ingredient_custos (ingredient_id, vigente_desde desc);

-- Backfill: registra o custo de hoje como ponto de partida do histórico.
-- Não há como saber o custo antes de hoje — relatórios de períodos
-- anteriores a esta migração mostram custo desconhecido, honestamente.
insert into del_ingredient_custos (owner_id, ingredient_id, custo_unitario, vigente_desde)
select owner_id, id, custo_unitario, now()
from del_ingredients
where custo_unitario is not null;
