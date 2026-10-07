-- Fechamento diário auditável. O snapshot preserva os totais conferidos no
-- momento do fechamento, mesmo que ocorram ajustes posteriores.
create table if not exists del_caixa_fechamentos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  data date not null,
  snapshot jsonb not null,
  observacao text,
  fechado_por uuid not null references auth.users(id),
  fechado_por_email text,
  fechado_em timestamptz not null default now(),
  unique (owner_id, data),
  check (jsonb_typeof(snapshot) = 'object')
);

alter table del_caixa_fechamentos enable row level security;
create policy "del_owner_only" on del_caixa_fechamentos for all
  using (owner_id in (select public.del_effective_owner_ids()))
  with check (owner_id in (select public.del_effective_owner_ids()));

create index if not exists del_caixa_fechamentos_owner_data_idx
  on del_caixa_fechamentos (owner_id, data desc);
