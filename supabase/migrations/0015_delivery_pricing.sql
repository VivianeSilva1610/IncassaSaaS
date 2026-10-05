-- Fixed-cost allocation and suggested pricing. Lets Viviane enter monthly
-- fixed costs (rent, utilities, etc.) and a desired margin, then combine
-- that with the recipe cost (del_product_ingredients, from 0014) to suggest
-- a sale price per dish: custo_total = custo_variavel + (custos_fixos /
-- volume_mensal_estimado); preco_sugerido = custo_total / (1 - margem).

create table del_fixed_costs (
  id uuid primary key default gen_random_uuid(),
  descricao text not null,
  valor_mensal numeric(10, 2) not null,
  created_at timestamptz not null default now()
);

-- Singleton row (fixed id) holding the pricing assumptions: expected
-- monthly volume and desired margin (0 to <1, e.g. 0.30 = 30%).
create table del_pricing_config (
  id uuid primary key default '00000000-0000-0000-0000-000000000001'::uuid,
  volume_mensal_estimado numeric(10, 2) not null default 0,
  margem_desejada numeric(5, 4) not null default 0.30,
  updated_at timestamptz not null default now()
);

alter table del_fixed_costs enable row level security;
alter table del_pricing_config enable row level security;

create policy "del_owner_only" on del_fixed_costs for all
  using ((auth.jwt() ->> 'email') = 'viroedu@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'viroedu@gmail.com');

create policy "del_owner_only" on del_pricing_config for all
  using ((auth.jwt() ->> 'email') = 'viroedu@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'viroedu@gmail.com');
