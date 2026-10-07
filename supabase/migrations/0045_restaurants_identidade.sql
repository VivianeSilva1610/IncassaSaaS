-- FASE 1 — Identidade do restaurante (tenant), do plano de transformação
-- do módulo restaurante em SaaS white-label multiempresa/multipaís.
--
-- Esta migration é puramente aditiva: nenhuma tabela del_* é alterada,
-- nenhum código de aplicação passa a ler/escrever nestas tabelas ainda.
-- owner_id continua sendo a fonte de verdade em todo o schema existente
-- nesta fase — "restaurants" só cria o vínculo 1:1 que vai sustentar a
-- migração futura, tabela por tabela (não tudo de uma vez).

create table restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null,
  slug text not null unique,
  country_code text not null default 'BR' check (country_code in ('BR', 'IT')),
  currency text not null default 'BRL' check (currency in ('BRL', 'EUR')),
  timezone text not null default 'America/Sao_Paulo',
  status text not null default 'active' check (status in ('active', 'suspended', 'closed')),
  default_locale text not null default 'pt-BR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index restaurants_owner_user_id_idx on restaurants (owner_user_id);

create table restaurant_members (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  email text,
  role text not null default 'staff' check (role in ('owner', 'staff')),
  status text not null default 'active' check (status in ('active', 'invited', 'revoked')),
  created_at timestamptz not null default now(),
  check (user_id is not null or email is not null)
);

create index restaurant_members_restaurant_id_idx on restaurant_members (restaurant_id);
create unique index restaurant_members_restaurant_user_idx
  on restaurant_members (restaurant_id, user_id) where user_id is not null;
create unique index restaurant_members_restaurant_email_idx
  on restaurant_members (restaurant_id, lower(email)) where email is not null;

create table restaurant_domains (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  hostname text not null unique,
  verification_token text not null default encode(gen_random_bytes(16), 'hex'),
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'verified', 'blocked')),
  verified_at timestamptz,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index restaurant_domains_restaurant_id_idx on restaurant_domains (restaurant_id);

-- Normaliza hostname (minúsculo, sem espaços) antes de gravar — um domínio
-- cadastrado com maiúsculas não pode escapar da unicidade nem da
-- resolução por Host header na Fase 3.
create or replace function public.restaurant_domains_normalize_hostname()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.hostname := lower(trim(new.hostname));
  return new;
end;
$$;

drop trigger if exists restaurant_domains_normalize on restaurant_domains;
create trigger restaurant_domains_normalize
  before insert or update of hostname on restaurant_domains
  for each row execute function public.restaurant_domains_normalize_hostname();

-- Equivalente a del_effective_owner_ids(), mas pra restaurant_id: dono
-- sempre tem acesso ao próprio restaurante; membro ativo (por user_id ou
-- por e-mail do JWT) tem acesso de leitura ao(s) restaurante(s) dele.
create or replace function public.restaurant_effective_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from restaurants where owner_user_id = auth.uid()
  union
  select rm.restaurant_id
  from restaurant_members rm
  where rm.status = 'active'
    and (rm.user_id = auth.uid() or rm.email = (auth.jwt() ->> 'email'))
$$;

alter table restaurants enable row level security;
-- Leitura: dono ou membro ativo. Escrita (insert/update/delete): só dono,
-- via "for all" — como "for all" também cobre select, membro continua
-- lendo pela policy de select abaixo (policies permissivas se somam com OR).
create policy "restaurants_select_members" on restaurants for select
  using (id in (select public.restaurant_effective_ids()));
create policy "restaurants_manage_owner" on restaurants for all
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

alter table restaurant_members enable row level security;
create policy "restaurant_members_select" on restaurant_members for select
  using (restaurant_id in (select public.restaurant_effective_ids()));
create policy "restaurant_members_manage_owner" on restaurant_members for all
  using (restaurant_id in (select id from restaurants where owner_user_id = auth.uid()))
  with check (restaurant_id in (select id from restaurants where owner_user_id = auth.uid()));

alter table restaurant_domains enable row level security;
create policy "restaurant_domains_select" on restaurant_domains for select
  using (restaurant_id in (select public.restaurant_effective_ids()));
create policy "restaurant_domains_manage_owner" on restaurant_domains for all
  using (restaurant_id in (select id from restaurants where owner_user_id = auth.uid()))
  with check (restaurant_id in (select id from restaurants where owner_user_id = auth.uid()));

-- Cria o PRANZO como primeiro restaurante, sem perder nem mover dado
-- nenhum existente — só registra a identidade em cima do owner_id atual.
insert into restaurants (owner_user_id, name, slug, country_code, currency, timezone, default_locale)
select u.id, 'Pranzo', 'pranzo', 'BR', 'BRL', 'America/Sao_Paulo', 'pt-BR'
from auth.users u
where u.email = 'viroedu@gmail.com'
  and not exists (select 1 from restaurants r where r.owner_user_id = u.id);

insert into restaurant_members (restaurant_id, user_id, email, role, status)
select r.id, r.owner_user_id, u.email, 'owner', 'active'
from restaurants r
join auth.users u on u.id = r.owner_user_id
where r.slug = 'pranzo'
  and not exists (
    select 1 from restaurant_members m where m.restaurant_id = r.id and m.user_id = r.owner_user_id
  );

-- Preserva, na nova tabela, os mesmos funcionários já autorizados hoje em
-- del_staff — sem alterar del_staff nem o mecanismo que já funciona.
insert into restaurant_members (restaurant_id, email, role, status)
select r.id, s.email, 'staff', 'active'
from restaurants r
join del_staff s on s.owner_id = r.owner_user_id
where r.slug = 'pranzo'
  and not exists (
    select 1 from restaurant_members m
    where m.restaurant_id = r.id and lower(m.email) = lower(s.email)
  );
