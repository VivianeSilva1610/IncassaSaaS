-- Fase 2 (parte que faltava): cadastro público de um NOVO restaurante.
-- Até aqui, restaurants só tinha o Pranzo, criado manualmente na Fase 1.
-- Esse trigger roda no momento da criação da conta (supabase.auth.signUp,
-- antes mesmo da confirmação de e-mail) quando o metadata indica que é um
-- cadastro de restaurante, e cria a linha em restaurants + o vínculo de
-- dono em restaurant_members — sem depender de outra migration manual
-- por tenant novo.
--
-- Totalmente aditivo: não toca em handle_new_user() (trigger existente,
-- usado por todo cadastro do INCASSA) nem em nenhuma tabela del_*.
create or replace function public.handle_new_restaurant_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  nome_restaurante text;
  slug_desejado text;
  slug_final text;
  novo_restaurant_id uuid;
begin
  if coalesce(new.raw_user_meta_data->>'restaurant_signup', 'false') <> 'true' then
    return new;
  end if;

  nome_restaurante := coalesce(nullif(trim(new.raw_user_meta_data->>'restaurant_name'), ''), 'Meu restaurante');
  slug_desejado := coalesce(nullif(trim(new.raw_user_meta_data->>'restaurant_slug'), ''), 'restaurante-' || substr(new.id::text, 1, 8));

  -- Rede de segurança contra corrida de concorrência no slug: nunca deixa
  -- o cadastro da conta falhar por causa disso — só sufixa e segue.
  slug_final := slug_desejado;
  if exists (select 1 from restaurants where slug = slug_final) then
    slug_final := slug_desejado || '-' || substr(new.id::text, 1, 6);
  end if;

  insert into restaurants (owner_user_id, name, slug, country_code, currency, timezone, default_locale)
  values (new.id, nome_restaurante, slug_final, 'BR', 'BRL', 'America/Sao_Paulo', 'pt-BR')
  on conflict (owner_user_id) do nothing
  returning id into novo_restaurant_id;

  if novo_restaurant_id is not null then
    insert into restaurant_members (restaurant_id, user_id, email, role, status)
    values (novo_restaurant_id, new.id, new.email, 'owner', 'active')
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_restaurant on auth.users;
create trigger on_auth_user_created_restaurant
  after insert on auth.users
  for each row execute function public.handle_new_restaurant_signup();
