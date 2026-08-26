create or replace function public.check_client_ownership()
returns trigger as $$
begin
  if not exists (
    select 1 from clients c where c.id = new.client_id and c.user_id = new.user_id
  ) then
    raise exception 'client_id does not belong to user_id';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger invoices_check_client_owner
  before insert or update on invoices
  for each row execute function public.check_client_ownership();

create trigger quotes_check_client_owner
  before insert or update on quotes
  for each row execute function public.check_client_ownership();

create trigger comunicazioni_check_client_owner
  before insert or update on comunicazioni
  for each row execute function public.check_client_ownership();
