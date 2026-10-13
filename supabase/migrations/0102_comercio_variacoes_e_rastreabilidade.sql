-- Variacoes comerciais e configuracao opcional de lote/validade por produto.
alter table commerce_products
 add column if not exists controla_lote boolean not null default false,
 add column if not exists controla_validade boolean not null default false;

create table commerce_product_variants(
 id uuid primary key default gen_random_uuid(),product_id uuid not null,business_id uuid not null,owner_id uuid not null,
 nome text not null,cor text,tamanho text,sku text,gtin text,
 preco_venda numeric(14,2),custo_medio numeric(14,4) not null default 0,
 estoque_atual numeric(14,4) not null default 0,estoque_minimo numeric(14,4) not null default 0,
 ativo boolean not null default true,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(id,business_id,owner_id),
 foreign key(product_id,business_id,owner_id) references commerce_products(id,business_id,owner_id) on delete cascade,
 foreign key(business_id,owner_id) references commerce_businesses(id,owner_id) on delete cascade,
 check(length(trim(nome))>=1),check(gtin is null or gtin ~ '^([0-9]{8}|[0-9]{12,14})$'),
 check(preco_venda is null or preco_venda>=0),check(custo_medio>=0),check(estoque_atual>=0),check(estoque_minimo>=0)
);
create unique index commerce_variant_sku_unique on commerce_product_variants(business_id,sku) where sku is not null;
create unique index commerce_variant_gtin_unique on commerce_product_variants(business_id,gtin) where gtin is not null;
create index commerce_variants_product_idx on commerce_product_variants(product_id,ativo,nome);
alter table commerce_product_variants enable row level security;
create policy commerce_product_variants_module on commerce_product_variants for all
 using(owner_id=commerce_owner_atual() and (commerce_tem_modulo('produtos') or commerce_tem_modulo('estoque') or commerce_tem_modulo('vendas') or commerce_tem_modulo('compras')))
 with check(owner_id=commerce_owner_atual() and (commerce_tem_modulo('produtos') or commerce_tem_modulo('estoque') or commerce_tem_modulo('vendas') or commerce_tem_modulo('compras')));
create trigger commerce_log_product_variants after insert or update or delete on commerce_product_variants
 for each row execute function commerce_log_activity('variacao_produto');
