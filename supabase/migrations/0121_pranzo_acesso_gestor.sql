-- Mantém o restaurante operacional do gestor da plataforma acessível sem
-- exigir que ele contrate o próprio produto. O Comércio já recebe o mesmo
-- tratamento em 0115_comercio_assinatura_rls.sql.
insert into restaurant_subscriptions (
  user_id, subscription_status, addon_modulos_ilimitados,
  addon_equipe_ilimitada, addon_abas_ilimitadas, modulos_ativos
)
select id, 'active', true, true, true,
       array['compras','estoque','vendas','cardapio','cozinha','producao','custos','caixa','financeiro','gestao','fiscal']::text[]
  from auth.users
 where lower(email) = 'viroedu@gmail.com'
on conflict (user_id) do update set
  subscription_status = 'active',
  addon_modulos_ilimitados = true,
  addon_equipe_ilimitada = true,
  addon_abas_ilimitadas = true,
  modulos_ativos = excluded.modulos_ativos;
