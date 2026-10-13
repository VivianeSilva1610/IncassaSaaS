-- Fornecedores, compras com multiplos itens e contas a pagar do INCASSA Comercio.
-- A compra nasce em rascunho: estoque e custo medio so mudam na efetivacao existente.

alter table commerce_suppliers
  add column if not exists observacoes text,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists commerce_suppliers_business_name_idx
  on commerce_suppliers (business_id, nome);

create or replace function commerce_criar_compra(
  p_business_id uuid,
  p_supplier_id uuid,
  p_numero_documento text,
  p_valor_frete numeric,
  p_valor_desconto numeric,
  p_observacoes text,
  p_itens jsonb,
  p_parcelas jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_owner_id uuid := commerce_owner_atual();
  v_entry_id uuid;
  v_item jsonb;
  v_parcela jsonb;
  v_product commerce_products%rowtype;
  v_quantidade numeric(14,4);
  v_valor_unitario numeric(14,4);
  v_valor_produtos numeric(14,2) := 0;
  v_valor_total numeric(14,2);
  v_total_parcelas numeric(14,2) := 0;
  v_vencimento date;
  v_valor_parcela numeric(14,2);
begin
  if v_owner_id is null then raise exception 'Sessao invalida.'; end if;
  perform 1 from commerce_businesses where id = p_business_id and owner_id = v_owner_id;
  if not found then raise exception 'Empresa nao encontrada.'; end if;

  if p_supplier_id is not null then
    perform 1 from commerce_suppliers
      where id = p_supplier_id and business_id = p_business_id
        and owner_id = v_owner_id and ativo = true;
    if not found then raise exception 'Fornecedor invalido ou inativo.'; end if;
  end if;

  if jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) = 0 then
    raise exception 'Adicione ao menos um item a compra.';
  end if;
  if jsonb_array_length(p_itens) > 200 then raise exception 'A compra aceita ate 200 itens.'; end if;
  if coalesce(p_valor_frete, 0) < 0 or coalesce(p_valor_desconto, 0) < 0 then
    raise exception 'Frete e desconto nao podem ser negativos.';
  end if;

  for v_item in select value from jsonb_array_elements(p_itens)
  loop
    begin
      v_quantidade := (v_item->>'quantidade')::numeric;
      v_valor_unitario := (v_item->>'valor_unitario')::numeric;
    exception when others then
      raise exception 'Quantidade ou custo de item invalido.';
    end;
    if v_quantidade <= 0 or v_valor_unitario < 0 then
      raise exception 'Quantidade e custo dos itens devem ser validos.';
    end if;
    select * into v_product from commerce_products
      where id = (v_item->>'product_id')::uuid
        and business_id = p_business_id and owner_id = v_owner_id and ativo = true;
    if not found then raise exception 'Produto invalido ou inativo.'; end if;
    v_valor_produtos := v_valor_produtos + round(v_quantidade * v_valor_unitario, 2);
  end loop;

  v_valor_total := round(v_valor_produtos + coalesce(p_valor_frete, 0) - coalesce(p_valor_desconto, 0), 2);
  if v_valor_total < 0 then raise exception 'O desconto nao pode superar o valor da compra.'; end if;

  if jsonb_typeof(coalesce(p_parcelas, '[]'::jsonb)) <> 'array' then
    raise exception 'Parcelas invalidas.';
  end if;
  if jsonb_array_length(coalesce(p_parcelas, '[]'::jsonb)) > 60 then
    raise exception 'A compra aceita ate 60 parcelas.';
  end if;
  for v_parcela in select value from jsonb_array_elements(coalesce(p_parcelas, '[]'::jsonb))
  loop
    begin
      v_vencimento := (v_parcela->>'vencimento')::date;
      v_valor_parcela := (v_parcela->>'valor')::numeric;
    exception when others then
      raise exception 'Vencimento ou valor de parcela invalido.';
    end;
    if v_valor_parcela <= 0 then raise exception 'O valor da parcela deve ser positivo.'; end if;
    v_total_parcelas := v_total_parcelas + v_valor_parcela;
  end loop;
  if jsonb_array_length(coalesce(p_parcelas, '[]'::jsonb)) > 0
     and round(v_total_parcelas, 2) <> v_valor_total then
    raise exception 'A soma das parcelas deve ser igual ao total da compra.';
  end if;

  insert into commerce_stock_entries (
    business_id, owner_id, supplier_id, origem, numero_documento,
    valor_produtos, valor_frete, valor_desconto, valor_total, observacoes
  ) values (
    p_business_id, v_owner_id, p_supplier_id, 'compra_manual', nullif(trim(p_numero_documento), ''),
    v_valor_produtos, coalesce(p_valor_frete, 0), coalesce(p_valor_desconto, 0),
    v_valor_total, nullif(trim(p_observacoes), '')
  ) returning id into v_entry_id;

  for v_item in select value from jsonb_array_elements(p_itens)
  loop
    select * into v_product from commerce_products
      where id = (v_item->>'product_id')::uuid
        and business_id = p_business_id and owner_id = v_owner_id;
    v_quantidade := (v_item->>'quantidade')::numeric;
    v_valor_unitario := (v_item->>'valor_unitario')::numeric;
    insert into commerce_stock_entry_items (
      entry_id, business_id, owner_id, product_id, descricao_documento,
      quantidade, unidade, valor_unitario, valor_total
    ) values (
      v_entry_id, p_business_id, v_owner_id, v_product.id, v_product.nome,
      v_quantidade, v_product.unidade, v_valor_unitario,
      round(v_quantidade * v_valor_unitario, 2)
    );
  end loop;

  for v_parcela in select value from jsonb_array_elements(coalesce(p_parcelas, '[]'::jsonb)) with ordinality
  loop
    v_vencimento := (v_parcela->>'vencimento')::date;
    v_valor_parcela := (v_parcela->>'valor')::numeric;
    insert into commerce_accounts_payable (
      business_id, owner_id, supplier_id, entry_id, descricao, valor, vencimento
    ) values (
      p_business_id, v_owner_id, p_supplier_id, v_entry_id,
      'Compra ' || coalesce(nullif(trim(p_numero_documento), ''), '#' || left(v_entry_id::text, 8)),
      v_valor_parcela, v_vencimento
    );
  end loop;

  return v_entry_id;
end;
$$;

revoke all on function commerce_criar_compra(uuid, uuid, text, numeric, numeric, text, jsonb, jsonb) from public, anon;
grant execute on function commerce_criar_compra(uuid, uuid, text, numeric, numeric, text, jsonb, jsonb) to authenticated;

