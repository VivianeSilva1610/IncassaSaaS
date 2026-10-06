-- Todo ingrediente/produto de estoque passa a ter um código interno, pra
-- identificar rapidamente na hora de informar uma compra de fornecedor:
-- se o código já existe, é só entrada de estoque; se não existe, é produto
-- novo. Códigos existentes são numerados sequencialmente por dono.
alter table del_ingredients add column if not exists codigo text;

with numerados as (
  select id, row_number() over (partition by owner_id order by created_at) as rn
  from del_ingredients
  where codigo is null
)
update del_ingredients i
set codigo = lpad(numerados.rn::text, 4, '0')
from numerados
where i.id = numerados.id;

alter table del_ingredients alter column codigo set not null;
create unique index if not exists del_ingredients_owner_codigo_idx on del_ingredients (owner_id, codigo);
