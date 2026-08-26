alter table clients add column if not exists note text;

create table if not exists comunicazioni (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  tipo_documento text not null,
  document_id uuid,
  canale text not null,
  tono text,
  automatico boolean not null default false,
  created_at timestamptz not null default now()
);

alter table comunicazioni enable row level security;

create policy "comunicazioni_all_own" on comunicazioni for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
