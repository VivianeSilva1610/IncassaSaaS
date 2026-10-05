-- Orders placed through the public Pranzo site (/pranzo) start as
-- "aguardando_pagamento" and only flip to "novo" (visible in Cozinha) once
-- the Stripe webhook confirms the Pix payment — stock is only deducted at
-- that point too, never for an abandoned/unpaid checkout.

alter table del_orders add column if not exists stripe_session_id text;
alter table del_orders add column if not exists endereco text;
