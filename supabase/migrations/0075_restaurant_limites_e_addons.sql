-- Três limites de plano, cada um liberado por um add-on independente
-- (cada add-on é uma assinatura Stripe separada, mesmo padrão já usado
-- pela assinatura principal — ver handleSubscriptionCheckout):
--   - módulos ativos: o dono escolhe até 3 módulos inclusos no plano base.
--   - equipe: até 3 pessoas (del_staff) sem custo extra.
--   - abas simultâneas: até 3 abas/sessões abertas ao mesmo tempo por pessoa.
--
-- Grandfather: quem já tinha acesso antes dessa feature existir continua
-- com tudo liberado — a restrição não pode quebrar quem já está usando o
-- sistema (inclusive a própria Viviane, no Pranzo).

alter table restaurant_subscriptions add column if not exists addon_modulos_ilimitados boolean not null default false;
alter table restaurant_subscriptions add column if not exists addon_equipe_ilimitada boolean not null default false;
alter table restaurant_subscriptions add column if not exists addon_abas_ilimitadas boolean not null default false;
alter table restaurant_subscriptions add column if not exists modulos_ativos text[] not null default '{}';

update restaurant_subscriptions
set addon_modulos_ilimitados = true, addon_equipe_ilimitada = true, addon_abas_ilimitadas = true
where addon_modulos_ilimitados is distinct from true;

-- Sessão de aba ativa: uma linha por aba de navegador aberta, renovada por
-- heartbeat do cliente. Linhas sem ping recente são tratadas como "aba
-- fechada" pela aplicação (não há limpeza automática por cron aqui — a
-- query de contagem já ignora pings velhos).
create table restaurant_abas_ativas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  aba_id text not null,
  ultimo_ping_em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, aba_id)
);
alter table restaurant_abas_ativas enable row level security;
create policy "restaurant_abas_ativas_owner_only" on restaurant_abas_ativas for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
