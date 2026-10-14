-- Cofre fiscal compartilhado pelo Restaurante e pelo Comércio.
-- Não há policy para authenticated: somente a service role do servidor pode
-- ler ou alterar certificados A1, senhas, CSCs e tokens de provedores.

create table fiscal_credentials (
  id uuid primary key default gen_random_uuid(),
  produto text not null check (produto in ('restaurante', 'comercio')),
  owner_id uuid not null references auth.users(id) on delete cascade,
  ambiente text not null default 'homologacao' check (ambiente in ('homologacao', 'producao')),
  provedor text not null check (provedor in ('incassa_direto', 'focus_nfe')),
  tipo text not null check (tipo in ('certificado_a1', 'senha_certificado', 'csc', 'token_api')),
  cifra text not null,
  iv text not null,
  auth_tag text not null,
  versao_chave integer not null default 1 check (versao_chave > 0),
  ultimos4 text,
  ultimo_teste_ok boolean,
  ultimo_teste_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (produto, owner_id, ambiente, provedor, tipo)
);

alter table fiscal_credentials enable row level security;
revoke all on table fiscal_credentials from anon, authenticated;

create index fiscal_credentials_owner_idx
  on fiscal_credentials (owner_id, produto, ambiente);

create table fiscal_webhook_eventos (
  id uuid primary key default gen_random_uuid(),
  provedor text not null,
  referencia text not null,
  evento_id text not null,
  recebido_em timestamptz not null default now(),
  processado_em timestamptz,
  erro_sanitizado text,
  unique (provedor, evento_id)
);

alter table fiscal_webhook_eventos enable row level security;
revoke all on table fiscal_webhook_eventos from anon, authenticated;

-- XML e DANFE nunca são públicos. O servidor usa service role e entrega
-- URLs assinadas curtas depois de autorizar o usuário e o owner_id.
insert into storage.buckets (id, name, public)
values ('fiscal-documentos', 'fiscal-documentos', false)
on conflict (id) do update set public = false;

comment on table fiscal_credentials is
  'Segredos fiscais cifrados pela aplicação. Nunca contém certificado, senha, CSC ou token em texto aberto.';

