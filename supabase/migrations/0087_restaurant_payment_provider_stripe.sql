-- Permite Stripe como segunda opção de pagamento próprio por restaurante,
-- além da Asaas (0071). Mesmo padrão: o restaurante cola a própria chave
-- secreta, o dinheiro cai direto na conta Stripe dele, nunca na nossa nem
-- na de outro tenant. Asaas só opera no Brasil — sem isso, restaurantes da
-- Itália não tinham nenhuma forma de aceitar cartão pelo site.
alter table restaurant_payment_providers drop constraint restaurant_payment_providers_provedor_check;
alter table restaurant_payment_providers add constraint restaurant_payment_providers_provedor_check
  check (provedor in ('asaas', 'stripe'));
alter table restaurant_payment_providers add column if not exists stripe_secret_key text;

-- Equivalente a asaas_payment_id (0031), pra idempotência e consulta do
-- pagamento feito via Checkout Session da Stripe do próprio restaurante.
alter table del_orders add column if not exists stripe_checkout_session_id text;
