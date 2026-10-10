-- Rastro de "quem fez o quê" por restaurante. Até aqui só del_caixa_movimentos
-- e del_caixa_fechamentos guardavam o operador — o resto (cardápio, estoque,
-- pedidos, compras) não registrava nenhuma autoria. Tabela única e genérica
-- em vez de uma coluna criado_por/atualizado_por em cada tabela: mais simples
-- de consultar como um feed, e não exige migration nova a cada módulo novo.
create table restaurant_activity_log (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  ator_email text not null,
  ator_nome text,
  acao text not null,
  entidade text,
  entidade_id uuid,
  detalhe text,
  created_at timestamptz not null default now()
);

create index restaurant_activity_log_owner_id_idx on restaurant_activity_log (owner_id, created_at desc);

alter table restaurant_activity_log enable row level security;

-- Leitura: dono ou equipe ativa (mesmo critério de del_effective_owner_ids).
-- A tela decide quem de fato vê a lista (dono/gerente) — a RLS aqui só
-- impede vazamento entre restaurantes diferentes, não é o controle fino.
create policy "restaurant_activity_log_select" on restaurant_activity_log for select
  using (owner_id in (select public.del_effective_owner_ids()));

-- Inserção: qualquer membro efetivo do restaurante pode registrar a própria
-- ação (ator_email vem sempre do servidor, nunca do formulário do cliente).
create policy "restaurant_activity_log_insert" on restaurant_activity_log for insert
  with check (owner_id in (select public.del_effective_owner_ids()));
