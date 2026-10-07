-- O nome cadastrado no Menu do site passa a ser a unica fonte exibida na
-- loja. Mantemos nome_site sincronizado por compatibilidade com integracoes.
alter table del_products add column if not exists video_url text;

update del_products
   set nome_site = nome
 where nome_site is distinct from nome;

