alter table del_products drop constraint if exists del_products_categoria_check;
alter table del_products add constraint del_products_categoria_check
  check (categoria in ('prato', 'bebida', 'sobremesa', 'tamanho', 'principal', 'acompanhamento', 'extra'));
