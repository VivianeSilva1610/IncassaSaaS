-- Corrige o onboarding inicial do Comércio.
-- Antes da primeira empresa existir, commerce_owner_atual() retornava NULL,
-- impedindo o próprio usuário autenticado de inserir commerce_businesses.

create or replace function commerce_owner_atual()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select b.owner_id
       from commerce_businesses b
      where b.owner_id = (select auth.uid())
      limit 1),
    (select s.owner_id
       from commerce_staff s
      where lower(s.email) = lower(coalesce((select auth.jwt()->>'email'), ''))
      limit 1),
    (select auth.uid())
  );
$$;

revoke all on function commerce_owner_atual() from public, anon;
grant execute on function commerce_owner_atual() to authenticated;

-- O proprietario precisa criar o plano inicial durante o onboarding e pode
-- escolher os modulos do proprio plano. A equipe continua apenas com leitura.
drop policy if exists commerce_subscriptions_owner_insert on commerce_subscriptions;
create policy commerce_subscriptions_owner_insert
on commerce_subscriptions
for insert
to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists commerce_subscriptions_owner_update on commerce_subscriptions;
create policy commerce_subscriptions_owner_update
on commerce_subscriptions
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
