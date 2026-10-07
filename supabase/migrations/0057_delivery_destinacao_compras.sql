-- Destinacao contabil/gerencial dos itens comprados. Nao presume que todo
-- produto da NF-e seja ingrediente: uso/consumo, despesa e ativo ficam fora
-- do estoque de insumos.
alter table del_notas_entrada_itens
  add column if not exists destinacao text not null default 'insumo_producao';

alter table del_notas_entrada_itens
  drop constraint if exists del_notas_entrada_itens_destinacao_check;
alter table del_notas_entrada_itens
  add constraint del_notas_entrada_itens_destinacao_check check (
    destinacao in (
      'insumo_producao', 'embalagem', 'mercadoria_revenda',
      'uso_consumo', 'ativo_imobilizado', 'despesa'
    )
  );

create table if not exists del_ativos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  nota_entrada_item_id uuid not null references del_notas_entrada_itens(id) on delete restrict,
  nome text not null,
  valor_aquisicao numeric(14,2) not null check (valor_aquisicao >= 0),
  adquirido_em date not null,
  status text not null default 'ativo' check (status in ('ativo', 'baixado')),
  observacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint del_ativos_nota_item_key unique (nota_entrada_item_id)
);

alter table del_ativos enable row level security;
create policy "del_owner_only" on del_ativos for all
  using (owner_id in (select public.del_effective_owner_ids()))
  with check (owner_id in (select public.del_effective_owner_ids()));

create index if not exists del_ativos_owner_status_idx on del_ativos (owner_id, status);
create index if not exists del_notas_entrada_itens_owner_destinacao_idx
  on del_notas_entrada_itens (owner_id, destinacao);

create or replace function public.del_processar_nota_entrada(
  p_nota_id uuid,
  p_mapeamentos jsonb,
  p_gerar_conta boolean default true,
  p_vencimento date default null
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_nota del_notas_entrada%rowtype;
  v_item del_notas_entrada_itens%rowtype;
  v_map jsonb;
  v_destinacao text;
  v_ingrediente_id uuid;
  v_quantidade numeric(16,4);
  v_saldo_anterior numeric(16,4);
  v_custo_anterior numeric(16,4);
  v_custo_novo numeric(16,4);
  v_count integer;
  v_controla_estoque boolean;
begin
  select * into v_nota
    from del_notas_entrada
   where id = p_nota_id
   for update;

  if not found then raise exception 'Nota de entrada nao encontrada'; end if;
  if not (
    v_nota.owner_id = (select auth.uid())
    or exists (
      select 1 from del_staff s
       where s.owner_id = v_nota.owner_id
         and lower(s.email) = lower(auth.jwt() ->> 'email')
         and s.gerente = true
    )
  ) then raise exception 'Sem permissao para processar esta compra'; end if;
  if v_nota.status = 'processada' then raise exception 'Esta compra ja foi processada'; end if;
  if v_nota.status = 'cancelada' then raise exception 'Uma compra cancelada nao pode ser processada'; end if;
  if jsonb_typeof(p_mapeamentos) <> 'array' then raise exception 'Mapeamentos invalidos'; end if;

  select count(*) into v_count from del_notas_entrada_itens where nota_entrada_id = p_nota_id;
  if jsonb_array_length(p_mapeamentos) <> v_count then
    raise exception 'Todos os itens da nota precisam ser classificados';
  end if;

  -- Bloqueia ingredientes sempre na mesma ordem para evitar deadlocks entre
  -- duas notas processadas ao mesmo tempo.
  perform 1
    from del_ingredients i
   where i.owner_id = v_nota.owner_id
     and i.id in (
       select (value ->> 'ingrediente_id')::uuid
         from jsonb_array_elements(p_mapeamentos)
        where value ->> 'destinacao' in ('insumo_producao', 'embalagem', 'mercadoria_revenda')
          and nullif(value ->> 'ingrediente_id', '') is not null
     )
   order by i.id
   for update;

  for v_map in select value from jsonb_array_elements(p_mapeamentos)
  loop
    select * into v_item
      from del_notas_entrada_itens
     where id = (v_map ->> 'item_id')::uuid
       and nota_entrada_id = p_nota_id
       and owner_id = v_nota.owner_id;
    if not found then raise exception 'Item da nota invalido'; end if;

    v_destinacao := v_map ->> 'destinacao';
    if v_destinacao not in (
      'insumo_producao', 'embalagem', 'mercadoria_revenda',
      'uso_consumo', 'ativo_imobilizado', 'despesa'
    ) then raise exception 'Destinacao do item invalida'; end if;

    v_controla_estoque := v_destinacao in ('insumo_producao', 'embalagem', 'mercadoria_revenda');
    if v_controla_estoque then
      v_ingrediente_id := nullif(v_map ->> 'ingrediente_id', '')::uuid;
      v_quantidade := (v_map ->> 'quantidade_estoque')::numeric;
      if v_ingrediente_id is null then raise exception 'Selecione o item de estoque'; end if;
      if v_quantidade is null or v_quantidade <= 0 then raise exception 'A quantidade recebida deve ser maior que zero'; end if;

      select quantidade_atual, coalesce(custo_unitario, 0)
        into v_saldo_anterior, v_custo_anterior
        from del_ingredients
       where id = v_ingrediente_id and owner_id = v_nota.owner_id;
      if not found then raise exception 'Item de estoque nao encontrado no estabelecimento'; end if;

      v_custo_novo := case
        when v_saldo_anterior + v_quantidade > 0
          then ((v_saldo_anterior * v_custo_anterior) + v_item.valor_total)
               / (v_saldo_anterior + v_quantidade)
        else v_item.valor_total / v_quantidade
      end;

      update del_ingredients
         set quantidade_atual = quantidade_atual + v_quantidade,
             custo_unitario = round(v_custo_novo, 2)
       where id = v_ingrediente_id and owner_id = v_nota.owner_id;

      insert into del_stock_movements
        (owner_id, ingredient_id, tipo, quantidade, motivo, nota_entrada_item_id)
      values
        (v_nota.owner_id, v_ingrediente_id, 'entrada', v_quantidade,
         'NF-e de compra ' || v_nota.numero, v_item.id);
    else
      v_ingrediente_id := null;
      v_quantidade := null;
    end if;

    update del_notas_entrada_itens
       set destinacao = v_destinacao,
           ingrediente_id = v_ingrediente_id,
           quantidade_estoque = v_quantidade
     where id = v_item.id;

    if v_destinacao = 'ativo_imobilizado' then
      insert into del_ativos
        (owner_id, nota_entrada_item_id, nome, valor_aquisicao, adquirido_em)
      values
        (v_nota.owner_id, v_item.id, v_item.descricao, v_item.valor_total,
         coalesce(v_nota.emitida_em::date, current_date));
    end if;
  end loop;

  if p_gerar_conta then
    if p_vencimento is null then raise exception 'Informe o vencimento da conta a pagar'; end if;
    insert into del_contas_a_pagar
      (owner_id, fornecedor, descricao, valor, data_vencimento, nota_entrada_id)
    values
      (v_nota.owner_id, v_nota.fornecedor_nome, 'NF-e ' || v_nota.numero,
       v_nota.valor_total, p_vencimento, v_nota.id);
  end if;

  update del_notas_entrada
     set status = 'processada', conferida_em = now(), processada_em = now()
   where id = p_nota_id;
end;
$$;

revoke execute on function public.del_processar_nota_entrada(uuid, jsonb, boolean, date) from public;
grant execute on function public.del_processar_nota_entrada(uuid, jsonb, boolean, date) to authenticated;
