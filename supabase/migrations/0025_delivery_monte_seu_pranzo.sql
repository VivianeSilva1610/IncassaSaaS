-- "Monte seu Pranzo": a marmitex size (categoria 'tamanho') has a fixed
-- price and a number of included sides; the customer picks 1 main dish
-- (categoria 'principal', price 0 — included in the tamanho) and N sides
-- (categoria 'acompanhamento', price 0), plus optional paid extras
-- (categoria 'extra', its own price). del_products.categoria is extended
-- to cover these new item types alongside the existing 'prato'/'bebida'.

alter table del_products drop constraint if exists del_products_categoria_check;
alter table del_products add constraint del_products_categoria_check
  check (categoria in ('prato', 'bebida', 'tamanho', 'principal', 'acompanhamento', 'extra'));

alter table del_products add column if not exists max_acompanhamentos int;

-- Weekly recurring schedule: which "principal" options are offered on each
-- day of the week (0 = domingo … 6 = sábado), repeating every week — not
-- tied to a specific date, so Viviane sets it once instead of every day.
create table del_cardapio_semana (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  dia_semana int not null check (dia_semana between 0 and 6),
  product_id uuid not null references del_products(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table del_cardapio_semana enable row level security;

create policy "del_owner_only" on del_cardapio_semana for all
  using (owner_id in (select public.del_effective_owner_ids()))
  with check (owner_id in (select public.del_effective_owner_ids()));

create or replace function public.check_cardapio_semana_ownership()
returns trigger as $$
begin
  if not exists (
    select 1 from del_products p where p.id = new.product_id and p.owner_id = new.owner_id
  ) then
    raise exception 'product_id does not belong to owner_id';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger del_cardapio_semana_check_owner
  before insert or update on del_cardapio_semana
  for each row execute function public.check_cardapio_semana_ownership();
