create table if not exists uscite (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  descrizione text not null,
  importo numeric(10, 2) not null,
  data_scadenza date not null,
  status text not null default 'da_pagare',
  created_at timestamptz not null default now()
);

alter table uscite enable row level security;

create policy "uscite_all_own" on uscite for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
