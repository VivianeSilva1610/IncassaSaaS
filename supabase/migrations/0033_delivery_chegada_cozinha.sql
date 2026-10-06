-- Quando a comanda chega na cozinha, independente do canal (mesa, PDV,
-- site). Diferente de created_at: um pedido do site é criado como
-- "aguardando_pagamento" e só chega na cozinha quando o Pix é confirmado,
-- minutos depois — created_at não reflete isso.
alter table del_orders add column if not exists chegou_cozinha_em timestamptz;
