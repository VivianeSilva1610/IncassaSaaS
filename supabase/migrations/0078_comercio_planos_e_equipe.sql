-- Mesma política comercial do INCASSA Restaurante:
-- plano base = 3 módulos, 3 pessoas e 3 abas; add-ons independentes.

create table commerce_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  subscription_status text not null default 'trialing' check (subscription_status in ('trialing', 'active', 'past_due', 'canceled', 'inactive')),
  stripe_customer_id text,
  stripe_subscription_id text,
  addon_modulos_ilimitados boolean not null default false,
  addon_equipe_ilimitada boolean not null default false,
  addon_abas_ilimitadas boolean not null default false,
  modulos_ativos text[] not null default array['vendas', 'produtos', 'estoque'],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table commerce_staff (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  nome text,
  gerente boolean not null default false,
  modulos text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (owner_id, email)
);

create table commerce_abas_ativas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  aba_id text not null,
  ultimo_ping_em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, aba_id)
);

create index commerce_staff_email_idx on commerce_staff(lower(email));
create index commerce_staff_owner_idx on commerce_staff(owner_id);
create index commerce_abas_user_ping_idx on commerce_abas_ativas(user_id, ultimo_ping_em);

alter table commerce_subscriptions enable row level security;
alter table commerce_staff enable row level security;
alter table commerce_abas_ativas enable row level security;

create policy commerce_subscriptions_owner on commerce_subscriptions for select
  using (user_id = (select auth.uid()));
create policy commerce_staff_owner on commerce_staff for all
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy commerce_staff_self_read on commerce_staff for select
  using (lower(email) = lower(coalesce((select auth.jwt()->>'email'), '')));
create policy commerce_abas_self on commerce_abas_ativas for all
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

insert into commerce_subscriptions (user_id, subscription_status, addon_modulos_ilimitados, addon_equipe_ilimitada, addon_abas_ilimitadas)
select owner_id, 'active', true, true, true from commerce_businesses
on conflict (user_id) do nothing;
