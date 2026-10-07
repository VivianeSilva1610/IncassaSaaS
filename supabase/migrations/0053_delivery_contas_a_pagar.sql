-- Contas a pagar (fornecedores) do restaurante. Reaproveita o conceito da
-- Uscite do INCASSA (valor + vencimento + status, pra saber o que falta
-- pagar) — mas como tabela própria do restaurante, porque del_orders/del_*
-- ainda são owner_id (não dá pra reaproveitar a tabela uscite em si, que é
-- do produto de cobrança que vai ser desativado).
--
-- Diferente do del_caixa_movimentos (que só registra o que JÁ foi pago no
-- dia): aqui é o que ainda vai vencer, pra alimentar um saldo estimado do
-- mês (igual ao "Saldo netto stimato" do INCASSA).
create table if not exists del_contas_a_pagar (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  fornecedor text not null,
  descricao text,
  valor numeric(10, 2) not null,
  data_vencimento date not null,
  status text not null default 'a_pagar' check (status in ('a_pagar', 'paga')),
  pago_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table del_contas_a_pagar enable row level security;
create policy "del_owner_only" on del_contas_a_pagar for all
  using (owner_id in (select public.del_effective_owner_ids()))
  with check (owner_id in (select public.del_effective_owner_ids()));

create index if not exists del_contas_a_pagar_owner_vencimento_idx
  on del_contas_a_pagar (owner_id, data_vencimento);
