-- Credenciais de pagamento (Asaas/Pix) e e-mail (Resend) por restaurante.
-- Até aqui, ambos eram uma única conta compartilhada (ASAAS_API_KEY e
-- RESEND_API_KEY no .env) pra TODOS os tenants — inviável pra vender como
-- produto: o dinheiro de pedidos de qualquer restaurante caía sempre na
-- mesma conta Asaas. Aditivo, segue o mesmo padrão de restaurant_domains
-- (0045) e restaurant_fiscal_it (0050).
--
-- Diferença proposital em relação a restaurant_fiscal_it: aqui SELECT
-- também é restrito ao dono (não a restaurant_effective_ids()), porque as
-- colunas guardam segredo (chave de API), não só dado cadastral — equipe
-- não deveria conseguir ler a chave de pagamento do restaurante.
create table restaurant_payment_providers (
  restaurant_id uuid primary key references restaurants(id) on delete cascade,
  provedor text not null default 'asaas' check (provedor in ('asaas')),
  asaas_api_key text,
  ativo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table restaurant_email_providers (
  restaurant_id uuid primary key references restaurants(id) on delete cascade,
  provedor text not null default 'resend' check (provedor in ('resend')),
  resend_api_key text,
  from_email text,
  from_name text,
  ativo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table restaurant_payment_providers enable row level security;
create policy "restaurant_payment_providers_owner_only" on restaurant_payment_providers for all
  using (restaurant_id in (select id from restaurants where owner_user_id = auth.uid()))
  with check (restaurant_id in (select id from restaurants where owner_user_id = auth.uid()));

alter table restaurant_email_providers enable row level security;
create policy "restaurant_email_providers_owner_only" on restaurant_email_providers for all
  using (restaurant_id in (select id from restaurants where owner_user_id = auth.uid()))
  with check (restaurant_id in (select id from restaurants where owner_user_id = auth.uid()));
