-- Plano Free do Supabase não tem backup automático. Essa função lista todas
-- as tabelas do schema public (sem precisar de pg_dump nem de uma conexão
-- Postgres direta — só o client normal via service role), pra um cron
-- próprio conseguir descobrir e exportar tudo sem manter uma lista manual
-- que fica desatualizada a cada tabela nova.
create or replace function public.listar_tabelas_backup()
returns setof text
language sql
stable
security definer
set search_path = public
as $$
  select table_name from information_schema.tables
  where table_schema = 'public' and table_type = 'BASE TABLE'
  order by table_name
$$;

revoke all on function public.listar_tabelas_backup() from public, anon, authenticated;

-- Bucket privado só pra guardar os dumps diários — nunca público, só a
-- service role (usada pelo cron) consegue ler/escrever.
insert into storage.buckets (id, name, public)
values ('backups', 'backups', false)
on conflict (id) do nothing;
