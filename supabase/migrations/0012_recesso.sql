create table if not exists recesso_richieste (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  tipo text not null check (tipo in ('saas', 'kit')),
  motivo text,
  stripe_subscription_id text,
  cancellato_automaticamente boolean not null default false,
  created_at timestamptz not null default now()
);

alter table recesso_richieste enable row level security;

-- No public policies: all reads/writes go through the service-role client
-- in /api/recesso, since the withdrawal function must work for unauthenticated
-- Kit Incassa buyers too (they have no account/session at all).
