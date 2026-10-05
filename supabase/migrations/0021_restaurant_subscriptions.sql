-- Phase 3: billing for the restaurant SaaS product, kept deliberately
-- separate from `profiles` (which is semantically "INCASSA subscription" —
-- reusing it would break requireActiveSubscription() and would prevent a
-- user from subscribing to both products independently).

create table restaurant_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text not null default 'none',
  trial_ends_at timestamptz,
  created_at timestamptz not null default now()
);

alter table restaurant_subscriptions enable row level security;

create policy "restaurant_subscriptions_select_own" on restaurant_subscriptions for select using (auth.uid() = user_id);
