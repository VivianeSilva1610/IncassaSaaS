-- Defesa em profundidade do SaaS Comércio.
-- Impede acesso direto às tabelas quando a assinatura estiver inativa e
-- impede que o cliente altere status/add-ons da própria assinatura via API.

create or replace function commerce_tem_modulo(p_modulo text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with contexto as (
    select
      commerce_owner_atual() as owner_id,
      lower(coalesce(auth.jwt()->>'email', '')) as email
  ), plano as (
    select s.subscription_status, s.addon_modulos_ilimitados, s.modulos_ativos
      from commerce_subscriptions s, contexto c
     where s.user_id = c.owner_id
  ), pessoa as (
    select s.gerente, s.modulos
      from commerce_staff s, contexto c
     where s.owner_id = c.owner_id
       and lower(s.email) = c.email
     limit 1
  )
  select case
    -- Acesso administrativo solicitado para o gestor da plataforma.
    when (select email from contexto) = 'viroedu@gmail.com' then true
    when not exists (
      select 1 from plano where subscription_status in ('trialing', 'active')
    ) then false
    -- Proprietário: módulo precisa fazer parte do plano, exceto gerência.
    when (select owner_id from contexto) = auth.uid() then
      p_modulo = 'gerencia'
      or exists (
        select 1 from plano
         where addon_modulos_ilimitados or p_modulo = any(modulos_ativos)
      )
    -- Equipe: o módulo precisa estar no plano e também atribuído à pessoa.
    else
      exists (
        select 1
          from plano p cross join pessoa pe
         where (p.addon_modulos_ilimitados or p_modulo = any(p.modulos_ativos) or p_modulo = 'gerencia')
           and (p_modulo = any(pe.modulos) or (p_modulo = 'gerencia' and pe.gerente))
      )
  end;
$$;

revoke all on function commerce_tem_modulo(text) from public, anon;
grant execute on function commerce_tem_modulo(text) to authenticated;

-- A assinatura é financeira: somente o webhook com service role pode criar
-- ou alterar status, IDs Stripe e add-ons. O usuário escolhe módulos por RPC.
drop policy if exists commerce_subscriptions_owner_insert on commerce_subscriptions;
drop policy if exists commerce_subscriptions_owner_update on commerce_subscriptions;

-- Garante o acesso operacional ilimitado solicitado para o gestor, sem
-- depender de uma inserção feita pelo navegador.
insert into commerce_subscriptions (
  user_id, subscription_status, addon_modulos_ilimitados,
  addon_equipe_ilimitada, addon_abas_ilimitadas, modulos_ativos
)
select id, 'active', true, true, true,
       array['vendas','produtos','estoque','compras','clientes','financeiro','fiscal']::text[]
  from auth.users
 where lower(email) = 'viroedu@gmail.com'
on conflict (user_id) do update set
  subscription_status = 'active',
  addon_modulos_ilimitados = true,
  addon_equipe_ilimitada = true,
  addon_abas_ilimitadas = true,
  modulos_ativos = excluded.modulos_ativos,
  updated_at = now();

create or replace function commerce_atualizar_modulos(p_modulos text[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_modulos text[];
  v_ilimitados boolean;
begin
  if auth.uid() is null then
    raise exception 'Autenticação obrigatória.';
  end if;

  select coalesce(array_agg(distinct modulo order by modulo), '{}')
    into v_modulos
    from unnest(coalesce(p_modulos, '{}')) as modulo;

  if not v_modulos <@ array['vendas','produtos','estoque','compras','clientes','financeiro','fiscal']::text[] then
    raise exception 'Módulo inválido.';
  end if;

  select addon_modulos_ilimitados
    into v_ilimitados
    from commerce_subscriptions
   where user_id = auth.uid()
     and subscription_status in ('trialing', 'active')
   for update;

  if not found then
    raise exception 'Assinatura ativa não encontrada.';
  end if;
  if not v_ilimitados and cardinality(v_modulos) > 3 then
    raise exception 'O plano base permite até 3 módulos.';
  end if;

  update commerce_subscriptions
     set modulos_ativos = v_modulos,
         updated_at = now()
   where user_id = auth.uid();
end;
$$;

revoke all on function commerce_atualizar_modulos(text[]) from public, anon;
grant execute on function commerce_atualizar_modulos(text[]) to authenticated;
