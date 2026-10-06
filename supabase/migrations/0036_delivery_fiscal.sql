-- Base fiscal/contábil, pronta para emissão de NFC-e quando houver um
-- provedor fiscal contratado (Focus NFe, PlugNotas, eNotas...). Regime
-- hoje é MEI, sem Inscrição Estadual ainda — nada aqui emite nota de
-- verdade, só guarda os dados pra quando a Viviane tiver IE + certificado
-- digital + provedor escolhido. "ambiente" começa em homologação de
-- propósito, pra nunca emitir em produção sem decisão explícita.

create table del_fiscal_config (
  owner_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  razao_social text,
  nome_fantasia text,
  cnpj text,
  inscricao_estadual text,
  -- 'mei' | 'simples_nacional' | 'normal' — rege que campos fazem sentido
  -- (ex: MEI normalmente não recolhe ICMS por fora, é tudo no DAS fixo).
  regime_tributario text not null default 'mei' check (regime_tributario in ('mei', 'simples_nacional', 'normal')),
  -- Código de Regime Tributário do XML da NFC-e (1=Simples Nacional,
  -- 2=SN excesso de sublimite, 3=Regime Normal). Confirmar com contador
  -- antes de emitir em produção — não assumir sem revisão.
  crt smallint,
  logradouro text,
  numero text,
  bairro text,
  municipio text,
  uf text,
  cep text,
  ambiente text not null default 'homologacao' check (ambiente in ('homologacao', 'producao')),
  -- null até ela contratar e configurar um provedor de NFC-e.
  provedor text check (provedor is null or provedor in ('focus_nfe', 'plugnotas', 'enotas')),
  proxima_numeracao integer not null default 1,
  serie smallint not null default 1,
  updated_at timestamptz not null default now()
);

alter table del_fiscal_config enable row level security;
create policy "del_owner_only" on del_fiscal_config for all
  using (owner_id in (select public.del_effective_owner_ids()))
  with check (owner_id in (select public.del_effective_owner_ids()));

-- Campos fiscais por item do menu, necessários numa NFC-e. Os defaults
-- (CFOP 5102 = venda de mercadoria dentro do estado, origem 0 = nacional)
-- são só ponto de partida — revisar por produto com contador antes de
-- emitir em produção, principalmente pratos preparados vs. bebida revenda.
alter table del_products add column if not exists ncm text;
alter table del_products add column if not exists cfop text not null default '5102';
alter table del_products add column if not exists cest text;
alter table del_products add column if not exists origem smallint not null default 0;

-- CPF/CNPJ do consumidor, pra identificar na nota quando informado (já é
-- coletado no checkout do site para o Pix via Asaas, mas não ficava salvo
-- no pedido).
alter table del_orders add column if not exists cliente_cpf_cnpj text;

-- Uma linha por tentativa de emissão. "pendente" até o provedor confirmar;
-- "erro" guarda o motivo pra reemitir; "cancelada" é emitida e depois
-- estornada.
create table del_notas_fiscais (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid not null references del_orders(id) on delete cascade,
  status text not null default 'pendente' check (status in ('pendente', 'emitida', 'erro', 'cancelada')),
  ambiente text not null default 'homologacao',
  provedor text,
  numero integer,
  serie smallint,
  chave_acesso text,
  protocolo_autorizacao text,
  url_danfe text,
  url_xml text,
  erro_mensagem text,
  created_at timestamptz not null default now(),
  emitida_em timestamptz
);

alter table del_notas_fiscais enable row level security;
create policy "del_owner_only" on del_notas_fiscais for all
  using (owner_id in (select public.del_effective_owner_ids()))
  with check (owner_id in (select public.del_effective_owner_ids()));

create index if not exists del_notas_fiscais_order_idx on del_notas_fiscais (order_id);
