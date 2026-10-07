-- Parcelas/duplicatas informadas na cobranca da NF-e de entrada.
create table if not exists del_notas_entrada_parcelas (
  id uuid primary key default gen_random_uuid(),
  nota_entrada_id uuid not null references del_notas_entrada(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  numero text not null,
  vencimento date not null,
  valor numeric(14,2) not null check (valor > 0),
  created_at timestamptz not null default now(),
  constraint del_notas_entrada_parcelas_nota_numero_key unique (nota_entrada_id, numero)
);

alter table del_notas_entrada_parcelas enable row level security;
create policy "del_owner_only" on del_notas_entrada_parcelas for all
  using (owner_id in (select public.del_effective_owner_ids()))
  with check (owner_id in (select public.del_effective_owner_ids()));

create index if not exists del_notas_entrada_parcelas_owner_vencimento_idx
  on del_notas_entrada_parcelas (owner_id, vencimento);
create index if not exists del_notas_entrada_parcelas_nota_idx
  on del_notas_entrada_parcelas (nota_entrada_id);

alter table del_contas_a_pagar
  add column if not exists nota_entrada_parcela_id uuid
    references del_notas_entrada_parcelas(id) on delete set null;

drop index if exists del_contas_a_pagar_nota_entrada_key;

create unique index if not exists del_contas_a_pagar_nota_parcela_key
  on del_contas_a_pagar (nota_entrada_parcela_id)
  where nota_entrada_parcela_id is not null;

create unique index if not exists del_contas_a_pagar_nota_sem_parcela_key
  on del_contas_a_pagar (nota_entrada_id)
  where nota_entrada_id is not null and nota_entrada_parcela_id is null;

-- A funcao de processamento existente tenta gerar uma conta unica. Este
-- gatilho a substitui pelas parcelas do XML dentro da mesma transacao.
create or replace function public.del_expandir_conta_parcelada_nfe()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_parcela del_notas_entrada_parcelas%rowtype;
  v_quantidade integer;
  v_total numeric(14,2);
begin
  if new.nota_entrada_id is null or new.nota_entrada_parcela_id is not null then
    return new;
  end if;

  select count(*), coalesce(sum(valor), 0)
    into v_quantidade, v_total
    from del_notas_entrada_parcelas
   where nota_entrada_id = new.nota_entrada_id
     and owner_id = new.owner_id;

  if v_quantidade = 0 then return new; end if;
  if abs(v_total - new.valor) > 0.02 then
    raise exception 'A soma das parcelas da NF-e (%) difere do total da nota (%)', v_total, new.valor;
  end if;

  for v_parcela in
    select * from del_notas_entrada_parcelas
     where nota_entrada_id = new.nota_entrada_id
       and owner_id = new.owner_id
     order by vencimento, numero
  loop
    insert into del_contas_a_pagar
      (owner_id, fornecedor, descricao, valor, data_vencimento,
       nota_entrada_id, nota_entrada_parcela_id)
    values
      (new.owner_id, new.fornecedor,
       coalesce(new.descricao, 'NF-e') || ' · parcela ' || v_parcela.numero,
       v_parcela.valor, v_parcela.vencimento,
       new.nota_entrada_id, v_parcela.id);
  end loop;

  return null;
end;
$$;

drop trigger if exists del_expandir_conta_parcelada_nfe_trigger on del_contas_a_pagar;
create trigger del_expandir_conta_parcelada_nfe_trigger
before insert on del_contas_a_pagar
for each row execute function public.del_expandir_conta_parcelada_nfe();

