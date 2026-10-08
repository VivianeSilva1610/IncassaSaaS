-- O cadastro público hoje grava country_code='BR' pra TODO restaurante
-- novo (placeholder — não existe seletor de país no formulário de
-- cadastro). Esse campo marca se o país já foi de fato confirmado
-- (detectado pelo CNPJ/Partita IVA informado em Fiscal > Estabelecimento,
-- com confirmação visual) ou se ainda está no valor padrão não revisado.
alter table restaurants add column if not exists country_confirmed boolean not null default false;

-- Restaurantes que já tinham dado fiscal cadastrado antes dessa migration
-- claramente já passaram por essa decisão (mesmo que informalmente) — não
-- faz sentido pedir confirmação de novo pra eles.
update restaurants r set country_confirmed = true
where exists (select 1 from del_fiscal_config c where c.owner_id = r.owner_user_id)
   or exists (select 1 from restaurant_fiscal_it f where f.restaurant_id = r.id);
