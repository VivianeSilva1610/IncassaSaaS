alter table profiles add column if not exists locale text not null default 'it';

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, locale)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'locale', 'it'));
  return new;
end;
$$ language plpgsql security definer set search_path = public;
