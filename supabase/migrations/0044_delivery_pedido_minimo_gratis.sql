-- Em vez de "grátis" ser incondicional por bairro, passa a depender do
-- valor do pedido: evita que uma marmita avulsa num bairro de 25km vire
-- prejuízo (taxa real absorvida sem o cliente nem saber). Null = sem
-- mínimo, usa sempre a taxa cheia daquele bairro.
alter table del_zonas_entrega add column if not exists pedido_minimo_gratis numeric(10, 2);
