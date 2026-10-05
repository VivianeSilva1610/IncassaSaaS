-- del_caixa_movimentos existed since 0014 but was schema-only (no owner_id,
-- no screen). Wiring it up now: same multi-tenant pattern as every other
-- del_* table (owner_id + RLS by owner), plus fixing the Italian-leftover
-- default category from the original draft.

alter table del_caixa_movimentos add column if not exists owner_id uuid references auth.users(id) on delete cascade;
update del_caixa_movimentos set owner_id = (select id from auth.users where email = 'viroedu@gmail.com') where owner_id is null;
alter table del_caixa_movimentos alter column owner_id set not null;
alter table del_caixa_movimentos alter column owner_id set default auth.uid();
alter table del_caixa_movimentos alter column categoria set default 'outro';

drop policy "del_owner_only" on del_caixa_movimentos;
create policy "del_owner_only" on del_caixa_movimentos for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
