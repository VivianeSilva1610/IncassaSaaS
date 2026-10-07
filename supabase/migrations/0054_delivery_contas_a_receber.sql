-- Contas a receber (pedidos vendidos a prazo). Substitui a ponte que hoje
-- cria cliente/fatura no INCASSA (clients/invoices via invoice-bridge.ts)
-- quando um pedido é marcado "a prazo" — essa ponte só funcionava pro dono
-- (RLS de clients/invoices é por user_id de usuário único) e depende de um
-- produto que vai ser desativado. Nativa do restaurante, owner_id, mesma
-- RLS das outras tabelas do módulo.
--
-- Denormalizada (cliente_nome/telefone direto na linha, sem tabela de
-- clientes separada) igual já é del_orders — o pedido já carrega esses
-- dados, não precisa duplicar numa entidade de cliente à parte.
create table if not exists del_contas_a_receber (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid references del_orders(id) on delete set null,
  cliente_nome text not null,
  cliente_telefone text,
  valor numeric(10, 2) not null,
  data_vencimento date not null,
  status text not null default 'aberta' check (status in ('aberta', 'paga')),
  pago_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table del_contas_a_receber enable row level security;
create policy "del_owner_only" on del_contas_a_receber for all
  using (owner_id in (select public.del_effective_owner_ids()))
  with check (owner_id in (select public.del_effective_owner_ids()));

create index if not exists del_contas_a_receber_owner_vencimento_idx
  on del_contas_a_receber (owner_id, data_vencimento);
