-- Pedidos de mesa/balcão/telefone não passam por um gateway de pagamento
-- (o cliente paga na hora, em dinheiro/cartão/maquininha) — então, ao
-- contrário do site (Pix via Asaas), o sistema não tinha como saber se
-- já foi pago. Esse campo existe pra registrar isso manualmente, e serve
-- de gatilho pra emissão automática da NFC-e.
alter table del_orders add column if not exists pago boolean not null default false;
alter table del_orders add column if not exists pago_em timestamptz;

-- Pedidos do site que já passaram de "aguardando_pagamento" tiveram o Pix
-- confirmado pelo webhook da Asaas — já eram pagos de fato, só não tinha
-- esse campo ainda pra registrar.
update del_orders
set pago = true, pago_em = coalesce(chegou_cozinha_em, created_at)
where canal = 'site' and status <> 'aguardando_pagamento' and pago = false;
