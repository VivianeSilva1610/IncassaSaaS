-- Unidade de compra opcional (saco, caixa, fardo...) com fator de conversão
-- pra unidade de estoque (kg/l/un). O estoque, o custo e a ficha técnica
-- continuam sempre na unidade de estoque — a unidade de compra só existe
-- pra permitir informar quantidades na hora de registrar uma compra (ex:
-- "comprei 2 sacos" em vez de ter que calcular "50kg" de cabeça), evitando
-- o erro de digitar a quantidade errada na unidade de estoque.
alter table del_ingredients
  add column if not exists unidade_compra text,
  add column if not exists fator_conversao_compra numeric(12, 4);

alter table del_ingredients
  drop constraint if exists del_ingredients_unidade_compra_consistente;
alter table del_ingredients
  add constraint del_ingredients_unidade_compra_consistente
  check ((unidade_compra is null) = (fator_conversao_compra is null));

alter table del_ingredients
  drop constraint if exists del_ingredients_fator_conversao_compra_positivo;
alter table del_ingredients
  add constraint del_ingredients_fator_conversao_compra_positivo
  check (fator_conversao_compra is null or fator_conversao_compra > 0);
