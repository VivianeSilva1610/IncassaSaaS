-- NCM opcional no cadastro de estoque. O valor pode vir do XML da compra ou
-- ser informado manualmente, mas permanece pendente de revisao ate confirmacao.
alter table del_ingredients add column if not exists ncm text;
alter table del_ingredients add column if not exists ncm_origem text;
alter table del_ingredients add column if not exists ncm_revisado boolean not null default false;

alter table del_ingredients drop constraint if exists del_ingredients_ncm_check;
alter table del_ingredients add constraint del_ingredients_ncm_check
  check (ncm is null or ncm ~ '^[0-9]{8}$');

alter table del_ingredients drop constraint if exists del_ingredients_ncm_origem_check;
alter table del_ingredients add constraint del_ingredients_ncm_origem_check
  check (ncm_origem is null or ncm_origem in ('xml', 'manual'));

create index if not exists del_ingredients_owner_ncm_idx
  on del_ingredients (owner_id, ncm)
  where ncm is not null;
