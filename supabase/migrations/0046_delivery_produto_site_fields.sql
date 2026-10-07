-- FASE 2a — Loja pública multiempresa: tira os IDs de produto fixos do
-- código. A página pública passa a listar os produtos do restaurante
-- direto do banco, então alguns campos que só existiam como texto
-- hardcoded em src/app/pranzo/page.tsx precisam de um lugar no schema:
--
-- - nome_site: nome como aparece pro cliente, quando diferente do nome
--   interno usado na cozinha/fiscal (ex: "Frango à pizzaiola" no site vs
--   "Pollo alla Pizzaiola" nas telas internas). Nulo = usa o nome normal.
-- - destaque: selo de destaque no cardápio público (ex: "Mais pedido").
-- - ordem: ordem de exibição no cardápio público (menor primeiro).
alter table del_products add column if not exists nome_site text;
alter table del_products add column if not exists destaque text;
alter table del_products add column if not exists ordem integer not null default 0;

-- Preserva exatamente o que já estava hardcoded hoje pro Pranzo, pra essa
-- migration não mudar nada visível no site além de tirar o hardcode do
-- código-fonte. Nenhum outro restaurante é afetado (filtro por id).
update del_products set nome_site = 'Parmigiana da casa', destaque = 'Mais pedido', ordem = 0,
  descrizione = 'Berinjela gratinada, arroz soltinho, feijão e salada fresca.'
  where id = '01377895-5e99-44f6-b043-a07d88ae8f71';
update del_products set nome_site = 'Frango à pizzaiola', destaque = 'Favorito da casa', ordem = 1,
  descrizione = 'Frango suculento ao molho de tomate, arroz e batatas douradas.'
  where id = '166eec79-9a12-4d7a-a007-4ad7e7775010';
update del_products set nome_site = 'Almôndegas ao molho', destaque = 'Receita de família', ordem = 2,
  descrizione = 'Almôndegas macias ao molho artesanal, arroz e feijão.'
  where id = '58caa404-15d6-4e9f-a0a7-edb57aeec347';
update del_products set nome_site = 'Spezzatino', destaque = 'Especial italiano', ordem = 3,
  descrizione = 'Ensopado rústico e macio, servido com arroz e polenta cremosa.'
  where id = '4a6f63c7-7a16-4f93-b642-ecfe714f20c6';
update del_products set nome_site = 'Frango à caçadora', destaque = 'Bem servido', ordem = 4,
  descrizione = 'Frango cozido lentamente em molho encorpado, com arroz e feijão.'
  where id = 'cc9c5ee8-73c2-43ff-815a-022817ef0a6d';
update del_products set nome_site = 'Polpette de lentilha', destaque = 'Sem carne', ordem = 5,
  descrizione = 'Almôndegas de lentilha e legumes, uma opção leve e cheia de sabor.'
  where id = 'a0c0b21b-f3ba-402b-b7f6-6191d5cfdbdd';
update del_products set nome_site = 'Tagliatelle al ragù', destaque = 'Clássico italiano', ordem = 6,
  descrizione = 'Massa envolvida em ragù cozido lentamente, acompanhada de salada fresca.'
  where id = 'e0293f4d-55cf-4fc3-982d-1fe1abf087fd';
update del_products set nome_site = 'Salsiccia ao molho', destaque = 'Sabor da trattoria', ordem = 7,
  descrizione = 'Linguiça ao molho de tomate, servida com polenta, arroz e feijão.'
  where id = '058053d5-d059-419e-90d0-6e2e1fbd3a71';
update del_products set nome_site = 'Cotoletta de frango', destaque = 'Crocante', ordem = 8,
  descrizione = 'Frango empanado, dourado e crocante, com acompanhamentos da casa.'
  where id = '3ce28e86-3da2-4404-a8de-d5249e812723';

update del_products set nome_site = 'Tiramisù', destaque = 'Il dolce italiano', ordem = 0,
  descrizione = 'O clássico italiano em camadas cremosas, com café e cacau.'
  where id = 'a10d1590-4d48-462b-8a82-2f4e8d1b8fe6';
update del_products set nome_site = 'Panna cotta', destaque = 'Leve e cremosa', ordem = 1,
  descrizione = 'Delicada, cremosa e finalizada com uma cobertura irresistível.'
  where id = 'f988f659-573d-4de5-af52-b0f5f7a3ab25';

update del_products set ordem = 0 where id = '220adf8c-9ed3-46a4-8b72-4dd99b021873';
update del_products set ordem = 1 where id = '7fb55954-3d8c-4061-8c95-8d9dfe8af0ac';
update del_products set ordem = 2 where id = 'e6938c88-308f-47b2-834c-ca1f5d690185';
update del_products set ordem = 3 where id = '23cbaae1-109f-444a-bd2f-eeb660dac5fe';
update del_products set ordem = 4 where id = '4e179b13-87dd-41c7-90fb-013e38700acb';
update del_products set ordem = 5 where id = '09531674-9926-4847-a720-6dcae6ad9399';
