-- Processamento atomico da NF-e de entrada: conferencia, estoque, custo medio
-- e (opcionalmente) conta a pagar. Uma repeticao nao duplica movimentos.
alter table del_stock_movements
  add column if not exists nota_entrada_item_id uuid references del_notas_entrada_itens(id) on delete set null;

create unique index if not exists del_stock_movements_nota_item_key
  on del_stock_movements (nota_entrada_item_id)
  where nota_entrada_item_id is not null;

alter table del_contas_a_pagar
  add column if not exists nota_entrada_id uuid references del_notas_entrada(id) on delete set null;

create unique index if not exists del_contas_a_pagar_nota_entrada_key
  on del_contas_a_pagar (nota_entrada_id)
  where nota_entrada_id is not null;

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
  v_ingrediente_id uuid;
  v_quantidade numeric(16,4);
  v_saldo_anterior numeric(16,4);
  v_custo_anterior numeric(16,4);
  v_custo_novo numeric(16,4);
  v_count integer;
begin
  select * into v_nota
    from del_notas_entrada
   where id = p_nota_id
   for update;

  if not found then raise exception 'Nota de entrada nao encontrada'; end if;
  if not (
    v_nota.owner_id = auth.uid()
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
    raise exception 'Todos os itens da nota precisam ser vinculados';
  end if;

  for v_map in select value from jsonb_array_elements(p_mapeamentos)
  loop
    select * into v_item
      from del_notas_entrada_itens
     where id = (v_map ->> 'item_id')::uuid
       and nota_entrada_id = p_nota_id
       and owner_id = v_nota.owner_id;
    if not found then raise exception 'Item da nota invalido'; end if;

    v_ingrediente_id := (v_map ->> 'ingrediente_id')::uuid;
    v_quantidade := (v_map ->> 'quantidade_estoque')::numeric;
    if v_quantidade <= 0 then raise exception 'A quantidade recebida deve ser maior que zero'; end if;

    select quantidade_atual, coalesce(custo_unitario, 0)
      into v_saldo_anterior, v_custo_anterior
      from del_ingredients
     where id = v_ingrediente_id and owner_id = v_nota.owner_id
     for update;
    if not found then raise exception 'Ingrediente nao encontrado no estabelecimento'; end if;

    -- Custo medio ponderado: (saldo anterior x custo anterior + valor do item)
    -- dividido pelo novo saldo. O valor usado e vProd do item da NF-e.
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

    update del_notas_entrada_itens
       set ingrediente_id = v_ingrediente_id,
           quantidade_estoque = v_quantidade
     where id = v_item.id;

    insert into del_stock_movements
      (owner_id, ingredient_id, tipo, quantidade, motivo, nota_entrada_item_id)
    values
      (v_nota.owner_id, v_ingrediente_id, 'entrada', v_quantidade,
       'NF-e de compra ' || v_nota.numero, v_item.id);
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
