create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text not null default 'none',
  trial_ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  telefono text,
  email text,
  tipo text not null default 'privato',
  created_at timestamptz not null default now()
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  descrizione text,
  importo numeric(10, 2) not null,
  data_scadenza date not null,
  status text not null default 'aperta',
  created_at timestamptz not null default now()
);

create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  descrizione text,
  importo numeric(10, 2) not null,
  data_invio date not null,
  status text not null default 'in_attesa',
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table clients enable row level security;
alter table invoices enable row level security;
alter table quotes enable row level security;

create policy "profiles_select_own" on profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

create policy "clients_all_own" on clients for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "invoices_all_own" on invoices for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "quotes_all_own" on quotes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
