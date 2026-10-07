-- Permissão de gerente: só o dono ou quem for marcado como gerente pode
-- editar/excluir ingredientes do estoque. O dono sempre pode; um gerente
-- também pode conceder essa marcação pra outros membros da equipe (não
-- só o dono) — por isso é um campo em del_staff, não uma checagem fixa.
alter table del_staff add column if not exists gerente boolean not null default false;
