create table if not exists del_pedido_compra_sequencias (
  owner_id uuid not null references auth.users(id) on delete cascade,
  ano integer not null check (ano between 2000 and 9999),
  ultimo_numero bigint not null check (ultimo_numero > 0),
  primary key (owner_id, ano)
);
alter table del_pedido_compra_sequencias enable row level security;
create policy "del_owner_only" on del_pedido_compra_sequencias for all
  using (owner_id in (select public.del_effective_owner_ids()))
  with check (owner_id in (select public.del_effective_owner_ids()));

alter table del_pedidos_compra add column if not exists numero_controle text;
with numerados as (
  select id, owner_id,
    extract(year from created_at at time zone 'America/Sao_Paulo')::integer as ano,
    row_number() over (partition by owner_id, extract(year from created_at at time zone 'America/Sao_Paulo') order by created_at, id) as sequencia
  from del_pedidos_compra where numero_controle is null
)
update del_pedidos_compra p
set numero_controle = 'PC-' || n.ano || '-' || lpad(n.sequencia::text, 6, '0')
from numerados n where p.id = n.id;

insert into del_pedido_compra_sequencias (owner_id, ano, ultimo_numero)
select owner_id, extract(year from created_at at time zone 'America/Sao_Paulo')::integer, count(*)
from del_pedidos_compra group by owner_id, extract(year from created_at at time zone 'America/Sao_Paulo')
on conflict (owner_id, ano) do update set ultimo_numero = greatest(del_pedido_compra_sequencias.ultimo_numero, excluded.ultimo_numero);

create or replace function public.del_gerar_numero_pedido_compra()
returns trigger language plpgsql security invoker set search_path = public as $$
declare v_ano integer; v_numero bigint;
begin
  if new.numero_controle is not null then raise exception 'O numero e gerado automaticamente'; end if;
  v_ano := extract(year from current_timestamp at time zone 'America/Sao_Paulo')::integer;
  insert into del_pedido_compra_sequencias (owner_id, ano, ultimo_numero) values (new.owner_id, v_ano, 1)
  on conflict (owner_id, ano) do update set ultimo_numero = del_pedido_compra_sequencias.ultimo_numero + 1
  returning ultimo_numero into v_numero;
  new.numero_controle := 'PC-' || v_ano || '-' || lpad(v_numero::text, 6, '0');
  return new;
end;
$$;
drop trigger if exists del_gerar_numero_pedido_compra_trigger on del_pedidos_compra;
create trigger del_gerar_numero_pedido_compra_trigger before insert on del_pedidos_compra
for each row execute function public.del_gerar_numero_pedido_compra();
alter table del_pedidos_compra alter column numero_controle set not null;
create unique index if not exists del_pedidos_compra_owner_numero_controle_key on del_pedidos_compra (owner_id, numero_controle);
