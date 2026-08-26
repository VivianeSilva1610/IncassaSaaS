create table if not exists pagamenti (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  invoice_id uuid not null references invoices(id) on delete cascade,
  importo numeric(10, 2) not null,
  data_pagamento date not null,
  created_at timestamptz not null default now()
);

alter table pagamenti enable row level security;

create policy "pagamenti_all_own" on pagamenti for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.check_invoice_ownership()
returns trigger as $$
begin
  if not exists (
    select 1 from invoices i where i.id = new.invoice_id and i.user_id = new.user_id
  ) then
    raise exception 'invoice_id does not belong to user_id';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger pagamenti_check_invoice_owner
  before insert or update on pagamenti
  for each row execute function public.check_invoice_ownership();
