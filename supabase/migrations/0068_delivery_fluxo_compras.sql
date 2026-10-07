-- Fluxo de compras completo, conforme combinado:
--   Solicitação interna → Orçamentos → Aprovação do gerente →
--   Pedido de compra → Recebimento da NF-e
--
-- Totalmente aditivo — não toca em del_pedidos_compra/del_pedidos_compra_itens
-- nem em del_notas_entrada existentes, só acrescenta colunas opcionais.
-- Pedidos de compra já criados continuam exatamente como estão
-- (orcamento_id fica null neles).

-- ───────────────────────── Solicitação de compra ─────────────────────────
-- Só produto + quantidade. Sem fornecedor, sem preço negociado. O custo de
-- referência é só pra uso interno (nunca é enviado ao fornecedor).
create table del_solicitacoes_compra (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  numero_controle text not null,
  ingrediente_id uuid not null references del_ingredients(id) on delete restrict,
  descricao_snapshot text not null,
  unidade_snapshot text not null,
  quantidade numeric(16, 4) not null check (quantidade > 0),
  custo_referencia numeric(16, 4),
  status text not null default 'aberta' check (status in ('aberta', 'em_orcamento', 'atendida', 'cancelada')),
  solicitado_por uuid not null references auth.users(id),
  solicitado_por_email text,
  observacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table del_solicitacoes_compra enable row level security;
create policy "del_owner_only" on del_solicitacoes_compra for all
  using (owner_id in (select public.del_effective_owner_ids()))
  with check (owner_id in (select public.del_effective_owner_ids()));

create index del_solicitacoes_compra_owner_status_idx on del_solicitacoes_compra (owner_id, status);

create table del_solicitacao_sequencias (
  owner_id uuid not null references auth.users(id) on delete cascade,
  ano integer not null check (ano between 2000 and 9999),
  ultimo_numero bigint not null check (ultimo_numero > 0),
  primary key (owner_id, ano)
);
alter table del_solicitacao_sequencias enable row level security;
create policy "del_owner_only" on del_solicitacao_sequencias for all
  using (owner_id in (select public.del_effective_owner_ids()))
  with check (owner_id in (select public.del_effective_owner_ids()));

create or replace function public.del_gerar_numero_solicitacao()
returns trigger language plpgsql security invoker set search_path = public as $$
declare v_ano integer; v_numero bigint;
begin
  if new.numero_controle is not null then raise exception 'O numero e gerado automaticamente'; end if;
  v_ano := extract(year from current_timestamp at time zone 'America/Sao_Paulo')::integer;
  insert into del_solicitacao_sequencias (owner_id, ano, ultimo_numero) values (new.owner_id, v_ano, 1)
  on conflict (owner_id, ano) do update set ultimo_numero = del_solicitacao_sequencias.ultimo_numero + 1
  returning ultimo_numero into v_numero;
  new.numero_controle := 'SC-' || v_ano || '-' || lpad(v_numero::text, 6, '0');
  return new;
end;
$$;
create trigger del_gerar_numero_solicitacao_trigger before insert on del_solicitacoes_compra
for each row execute function public.del_gerar_numero_solicitacao();
create unique index del_solicitacoes_compra_owner_numero_key on del_solicitacoes_compra (owner_id, numero_controle);

-- ───────────────────────── Orçamento (RFQ) ─────────────────────────
-- Agrupa itens (de uma ou mais solicitações) e é enviado a um ou mais
-- fornecedores, sem revelar o custo de referência interno.
create table del_orcamentos_compra (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  numero_controle text not null,
  observacao text,
  status text not null default 'aberto' check (status in ('aberto', 'respondido', 'aprovado', 'cancelado')),
  criado_por uuid not null references auth.users(id),
  aprovado_por uuid references auth.users(id),
  aprovado_em timestamptz,
  fornecedor_vencedor_id uuid references del_fornecedores(id),
  pedido_compra_id uuid references del_pedidos_compra(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table del_orcamentos_compra enable row level security;
create policy "del_owner_only" on del_orcamentos_compra for all
  using (owner_id in (select public.del_effective_owner_ids()))
  with check (owner_id in (select public.del_effective_owner_ids()));

create table del_orcamento_sequencias (
  owner_id uuid not null references auth.users(id) on delete cascade,
  ano integer not null check (ano between 2000 and 9999),
  ultimo_numero bigint not null check (ultimo_numero > 0),
  primary key (owner_id, ano)
);
alter table del_orcamento_sequencias enable row level security;
create policy "del_owner_only" on del_orcamento_sequencias for all
  using (owner_id in (select public.del_effective_owner_ids()))
  with check (owner_id in (select public.del_effective_owner_ids()));

create or replace function public.del_gerar_numero_orcamento()
returns trigger language plpgsql security invoker set search_path = public as $$
declare v_ano integer; v_numero bigint;
begin
  if new.numero_controle is not null then raise exception 'O numero e gerado automaticamente'; end if;
  v_ano := extract(year from current_timestamp at time zone 'America/Sao_Paulo')::integer;
  insert into del_orcamento_sequencias (owner_id, ano, ultimo_numero) values (new.owner_id, v_ano, 1)
  on conflict (owner_id, ano) do update set ultimo_numero = del_orcamento_sequencias.ultimo_numero + 1
  returning ultimo_numero into v_numero;
  new.numero_controle := 'OR-' || v_ano || '-' || lpad(v_numero::text, 6, '0');
  return new;
end;
$$;
create trigger del_gerar_numero_orcamento_trigger before insert on del_orcamentos_compra
for each row execute function public.del_gerar_numero_orcamento();
create unique index del_orcamentos_compra_owner_numero_key on del_orcamentos_compra (owner_id, numero_controle);

create table del_orcamento_itens (
  id uuid primary key default gen_random_uuid(),
  orcamento_id uuid not null references del_orcamentos_compra(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  solicitacao_id uuid references del_solicitacoes_compra(id),
  ingrediente_id uuid not null references del_ingredients(id) on delete restrict,
  descricao_snapshot text not null,
  unidade_snapshot text not null,
  quantidade numeric(16, 4) not null check (quantidade > 0),
  created_at timestamptz not null default now(),
  unique (orcamento_id, ingrediente_id)
);
alter table del_orcamento_itens enable row level security;
create policy "del_owner_only" on del_orcamento_itens for all
  using (owner_id in (select public.del_effective_owner_ids()))
  with check (owner_id in (select public.del_effective_owner_ids()));

-- Um fornecedor convidado = um fornecedor chamado pra cotar. As colunas de
-- resposta ficam null até ele responder (respondido_em preenchido).
create table del_orcamento_fornecedores (
  id uuid primary key default gen_random_uuid(),
  orcamento_id uuid not null references del_orcamentos_compra(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  fornecedor_id uuid not null references del_fornecedores(id) on delete restrict,
  enviado_email_para text,
  enviado_email_em timestamptz,
  enviado_email_por uuid references auth.users(id),
  frete numeric(14, 2),
  desconto numeric(14, 2),
  prazo_entrega_dias integer,
  condicao_pagamento text,
  observacao_resposta text,
  respondido_em timestamptz,
  registrado_por uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (orcamento_id, fornecedor_id)
);
alter table del_orcamento_fornecedores enable row level security;
create policy "del_owner_only" on del_orcamento_fornecedores for all
  using (owner_id in (select public.del_effective_owner_ids()))
  with check (owner_id in (select public.del_effective_owner_ids()));

create table del_orcamento_resposta_itens (
  id uuid primary key default gen_random_uuid(),
  orcamento_fornecedor_id uuid not null references del_orcamento_fornecedores(id) on delete cascade,
  orcamento_item_id uuid not null references del_orcamento_itens(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  preco_unitario numeric(16, 4) not null check (preco_unitario >= 0),
  created_at timestamptz not null default now(),
  unique (orcamento_fornecedor_id, orcamento_item_id)
);
alter table del_orcamento_resposta_itens enable row level security;
create policy "del_owner_only" on del_orcamento_resposta_itens for all
  using (owner_id in (select public.del_effective_owner_ids()))
  with check (owner_id in (select public.del_effective_owner_ids()));

-- ───────────────────────── Elos com o que já existe ─────────────────────────
-- Pedido de compra gerado a partir de um orçamento aprovado — nulo nos
-- pedidos antigos (criados direto, sem passar por orçamento), que
-- continuam funcionando exatamente como antes.
alter table del_pedidos_compra add column if not exists orcamento_id uuid references del_orcamentos_compra(id);

-- Recebimento (NF-e) passa a poder ser conferido contra um pedido de
-- compra aprovado. O status 'recebido' do pedido (que já existia na
-- constraint, mas nunca era usado) passa a ser setado de verdade quando a
-- nota vinculada é processada — isso é feito na camada de aplicação
-- (processarCompra), não aqui.
alter table del_notas_entrada add column if not exists pedido_compra_id uuid references del_pedidos_compra(id);
