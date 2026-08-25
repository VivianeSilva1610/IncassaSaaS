create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text unique not null,
  email text not null,
  product text not null default 'kit_incassa',
  status text not null default 'pending',
  email_sent_at timestamptz,
  created_at timestamptz not null default now()
);
