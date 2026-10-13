-- Ciclo de vida da assinatura do INCASSA Comércio.
-- Os campos são informativos; o acesso continua condicionado ao status
-- sincronizado e a Stripe permanece como fonte de verdade da cobrança.
alter table commerce_subscriptions
  add column if not exists trial_ends_at timestamptz,
  add column if not exists current_period_ends_at timestamptz,
  add column if not exists cancel_at_period_end boolean not null default false;

create index if not exists commerce_subscriptions_status_period_idx
  on commerce_subscriptions (subscription_status, current_period_ends_at);

comment on column commerce_subscriptions.trial_ends_at is
  'Fim do período de teste informado pela Stripe.';
comment on column commerce_subscriptions.current_period_ends_at is
  'Fim do período vigente do primeiro item da assinatura Stripe.';
comment on column commerce_subscriptions.cancel_at_period_end is
  'Cancelamento programado para o fim do período vigente.';
