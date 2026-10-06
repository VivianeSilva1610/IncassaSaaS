-- Rastreamento completo do pedido: um timestamp por etapa do fluxo
-- (chegou_cozinha_em já existe desde a 0033), pra saber quando cada
-- comanda entrou em preparo, ficou pronta e foi informada como entregue.
alter table del_orders add column if not exists em_preparo_em timestamptz;
alter table del_orders add column if not exists pronto_em timestamptz;
alter table del_orders add column if not exists entregue_em timestamptz;
