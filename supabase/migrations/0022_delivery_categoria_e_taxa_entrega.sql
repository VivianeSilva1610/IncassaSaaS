alter table del_products add column if not exists categoria text not null default 'prato' check (categoria in ('prato', 'bebida'));

alter table del_orders add column if not exists taxa_entrega numeric(10, 2) not null default 0;
