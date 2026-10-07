-- Hierarquia de acesso por módulo: cada pessoa da equipe só vê e acessa os
-- módulos marcados pra ela (ex: responsável pelo caixa → caixa+vendas; chef
-- → só cozinha). Lista flexível em vez de cargos fixos, pra não precisar de
-- uma migration nova toda vez que surgir uma combinação diferente.
--
-- Ortogonal ao "gerente" (que já existe): módulos definem O QUE a pessoa
-- vê; gerente define se ela pode editar/excluir dentro do que vê. O dono
-- sempre vê e pode tudo, independente do que estiver aqui.
alter table del_staff add column if not exists modulos text[] not null default '{}';
