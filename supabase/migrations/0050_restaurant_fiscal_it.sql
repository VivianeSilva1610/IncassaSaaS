-- Fase 4 (plano de white-label multi-país): fundação do módulo fiscal
-- italiano. Totalmente aditivo — não toca em del_fiscal_config,
-- del_notas_fiscais nem em nenhuma regra brasileira (NCM/CFOP/CEST/CRT).
-- Segue o mapa de tabelas do skill commercialista-italiano:
-- restaurant_fiscal_profiles (ativação/ambiente, país-agnóstico),
-- restaurant_fiscal_it (Partita IVA, Codice Fiscale, regime, PEC),
-- fiscal_documents (cabeçalho comum e imutável) + fiscal_documents_it
-- (identificadores SdI) + fiscal_events (histórico idempotente).
--
-- Nenhum provedor real de fattura elettronica está contratado — a
-- emissão em produção fica bloqueada (ambiente só aceita 'homologacao')
-- até validação com commercialista, igual já vale para o Brasil.

create table restaurant_fiscal_profiles (
  restaurant_id uuid primary key references restaurants(id) on delete cascade,
  ambiente text not null default 'homologacao' check (ambiente in ('homologacao', 'producao')),
  ativo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table restaurant_fiscal_it (
  restaurant_id uuid primary key references restaurants(id) on delete cascade,
  ragione_sociale text,
  partita_iva text,
  codice_fiscale text,
  regime_fiscale text,
  pec text,
  codice_destinatario text,
  provedor text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table fiscal_documents (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  order_id uuid references del_orders(id) on delete set null,
  country_code text not null,
  tipo_documento text not null,
  status text not null default 'pendente' check (status in ('pendente', 'emitido', 'erro', 'cancelado')),
  valuta text not null,
  totale_imponibile numeric,
  totale_imposta numeric,
  totale numeric not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index fiscal_documents_restaurant_id_idx on fiscal_documents(restaurant_id);
create index fiscal_documents_order_id_idx on fiscal_documents(order_id);

create table fiscal_documents_it (
  fiscal_document_id uuid primary key references fiscal_documents(id) on delete cascade,
  protocollo_sdi text,
  ricevuta_consegna text,
  esito text,
  codice_scarto text,
  motivo_scarto text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table fiscal_events (
  id uuid primary key default gen_random_uuid(),
  fiscal_document_id uuid not null references fiscal_documents(id) on delete cascade,
  tipo_evento text not null,
  evento_externo_id text,
  detalhe jsonb,
  created_at timestamptz not null default now()
);

create index fiscal_events_fiscal_document_id_idx on fiscal_events(fiscal_document_id);
-- Idempotência: o mesmo evento de um provedor/webhook nunca é gravado duas vezes.
create unique index fiscal_events_dedupe_idx on fiscal_events(fiscal_document_id, evento_externo_id) where evento_externo_id is not null;

alter table restaurant_fiscal_profiles enable row level security;
alter table restaurant_fiscal_it enable row level security;
alter table fiscal_documents enable row level security;
alter table fiscal_documents_it enable row level security;
alter table fiscal_events enable row level security;

-- Leitura: dono e equipe do tenant (mesmo padrão de restaurant_effective_ids()
-- criado na Fase 1). Escrita de configuração: só o dono, direto por RLS —
-- mesma regra já aplicada a del_fiscal_config via updateFiscalConfig().
create policy "restaurant_fiscal_profiles_select" on restaurant_fiscal_profiles for select using (restaurant_id in (select public.restaurant_effective_ids()));
create policy "restaurant_fiscal_profiles_owner_write" on restaurant_fiscal_profiles for all using (restaurant_id in (select id from restaurants where owner_user_id = auth.uid()));

create policy "restaurant_fiscal_it_select" on restaurant_fiscal_it for select using (restaurant_id in (select public.restaurant_effective_ids()));
create policy "restaurant_fiscal_it_owner_write" on restaurant_fiscal_it for all using (restaurant_id in (select id from restaurants where owner_user_id = auth.uid()));

-- fiscal_documents* e fiscal_events são gerados pelo sistema (emissão via
-- provedor/webhook, sempre com a service role) — só leitura para o tenant.
create policy "fiscal_documents_select" on fiscal_documents for select using (restaurant_id in (select public.restaurant_effective_ids()));
create policy "fiscal_documents_it_select" on fiscal_documents_it for select using (fiscal_document_id in (select id from fiscal_documents where restaurant_id in (select public.restaurant_effective_ids())));
create policy "fiscal_events_select" on fiscal_events for select using (fiscal_document_id in (select id from fiscal_documents where restaurant_id in (select public.restaurant_effective_ids())));
