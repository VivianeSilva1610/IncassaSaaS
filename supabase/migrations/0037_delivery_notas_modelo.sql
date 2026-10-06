-- Prepara para dois tipos de documento: NFC-e (modelo 65, consumidor final)
-- e NF-e (modelo 55, para clientes PJ que precisam de nota própria). Hoje
-- só NFC-e é usada; o campo existe pra não precisar de outra migration
-- quando NF-e for implementada de verdade.
alter table del_notas_fiscais add column if not exists modelo text not null default '65' check (modelo in ('55', '65'));
