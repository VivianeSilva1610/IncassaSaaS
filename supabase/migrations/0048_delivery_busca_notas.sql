-- Campos normalizados para localizar notas pelo cliente sem depender da
-- pontuacao usada ao salvar CPF/CNPJ. O documento original permanece intacto.
alter table del_orders add column if not exists cliente_nome_busca text;
alter table del_orders add column if not exists cliente_documento_busca text;

create or replace function public.del_normalize_cliente_search()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.cliente_nome_busca := lower(trim(coalesce(new.cliente_nome, '')));
  new.cliente_documento_busca := regexp_replace(coalesce(new.cliente_cpf_cnpj, ''), '[^0-9]', '', 'g');
  return new;
end;
$$;

drop trigger if exists del_orders_normalize_cliente_search on del_orders;
create trigger del_orders_normalize_cliente_search
  before insert or update of cliente_nome, cliente_cpf_cnpj on del_orders
  for each row execute function public.del_normalize_cliente_search();

update del_orders
set cliente_nome_busca = lower(trim(coalesce(cliente_nome, ''))),
    cliente_documento_busca = regexp_replace(coalesce(cliente_cpf_cnpj, ''), '[^0-9]', '', 'g')
where cliente_nome_busca is null or cliente_documento_busca is null;

alter table del_orders alter column cliente_nome_busca set not null;
alter table del_orders alter column cliente_nome_busca set default '';
alter table del_orders alter column cliente_documento_busca set not null;
alter table del_orders alter column cliente_documento_busca set default '';

create index if not exists del_orders_owner_documento_busca_idx
  on del_orders (owner_id, cliente_documento_busca)
  where cliente_documento_busca <> '';
