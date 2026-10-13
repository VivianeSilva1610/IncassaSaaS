-- Observabilidade do backup diário (frente Claude — 0120..0124).
--
-- 1) ops_backup_runs: uma linha por execução do /api/cron/backup-database,
--    com início, fim, status, tamanho, checksum, avisos e erro já
--    sanitizado. É uma tabela de operação da plataforma, não de um
--    cliente — por isso não tem business_id/owner_id. Só a service role
--    lê/escreve: RLS ligado sem nenhuma policy e sem grant para anon ou
--    authenticated. A tela /comercio/operacoes lê pelo servidor, depois de
--    conferir que quem acessa está em ADMIN_EMAILS.
--
-- 2) backup_tabelas_metadados(): lista as tabelas do schema public junto
--    com as colunas da chave primária, para o backup paginar com ordem
--    estável. Substitui o uso de listar_tabelas_backup() (mantida para
--    não quebrar nada que ainda a chame).

create table if not exists public.ops_backup_runs (
  id uuid primary key default gen_random_uuid(),
  origem text not null default 'cron' check (origem in ('cron', 'manual')),
  status text not null default 'executando'
    check (status in ('executando', 'sucesso', 'parcial', 'falha')),
  iniciado_em timestamptz not null default now(),
  finalizado_em timestamptz,
  arquivo text,
  tamanho_bytes bigint check (tamanho_bytes is null or tamanho_bytes >= 0),
  sha256 text check (sha256 is null or sha256 ~ '^[0-9a-f]{64}$'),
  tabelas_total integer,
  linhas_total bigint,
  usuarios_auth_total integer,
  avisos text[] not null default '{}',
  erro text check (erro is null or char_length(erro) <= 1000),
  email_enviado boolean not null default false,
  -- true quando o arquivo foi baixado de volta do Storage logo após o
  -- upload e o sha256 bateu com o que foi gerado.
  verificado boolean not null default false,
  backups_removidos integer not null default 0
);

create index if not exists ops_backup_runs_iniciado_idx
  on public.ops_backup_runs (iniciado_em desc);
create index if not exists ops_backup_runs_sucesso_idx
  on public.ops_backup_runs (iniciado_em desc) where status = 'sucesso';

alter table public.ops_backup_runs enable row level security;
revoke all on table public.ops_backup_runs from public, anon, authenticated;
grant select, insert, update, delete on table public.ops_backup_runs to service_role;

create or replace function public.backup_tabelas_metadados()
returns table (tabela text, colunas_pk text[])
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select
    c.relname::text,
    (
      select array_agg(a.attname::text order by k.ord)
      from pg_index i
      cross join lateral unnest(i.indkey) with ordinality as k(attnum, ord)
      join pg_attribute a on a.attrelid = i.indrelid and a.attnum = k.attnum
      where i.indrelid = c.oid and i.indisprimary
    )
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind in ('r', 'p')
    and not c.relispartition
  order by c.relname
$$;

revoke all on function public.backup_tabelas_metadados() from public, anon, authenticated;
grant execute on function public.backup_tabelas_metadados() to service_role;
